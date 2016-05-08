// This #include statement was automatically added by the Particle IDE.
#include "linRegPredict.h"

// This #include statement was automatically added by the Particle IDE.
#include "Netatmo.h"

#define MEASURE_EVERY_X_SECONDS 60
#define ALIVE_X_SECONDS 10
#define AVG_COUNT (30*2)*3

#define SUCCESS_OK 0

#define EEPROM_ADDR_LAST_AVG_HUMIDITY 0
#define EEPROM_ADDR_LAST_AVG_HUM_TIMESTAMP 4
#define EEPROM_ADDR_LAST_WATER_TIMESTAMP 12

#define WATER_AT_THRESHOLD 480

#include <vector>
#include <numeric> // for accumulate()
#include <algorithm>    // std::fill

uint32_t lastMeasureTime; 
uint32_t lastWaterStartTime;
uint32_t lastAlive;

uint32_t waterTime;

int8_t errorCode;
uint16_t light, humidity, temperature;

String lastWateredT, nextWateringT, status;

uint32_t iteration;

std::vector<uint16_t> v_hum(AVG_COUNT);

Netatmo *netatmo;


void writeI2CRegister8bit(int addr, int value) {
  Wire.beginTransmission(addr);
  Wire.write(value);
  Wire.endTransmission();
}

unsigned int readI2CRegister16bit(int addr, int reg) {
    Wire.begin();
    Wire.beginTransmission(addr);
    delay(100);
    Wire.write(reg);
    delay(100);
    
    Wire.endTransmission();
    
    
    unsigned int t  = 0;
    delay(20);
    Wire.requestFrom(addr, 2);
    t = Wire.read() << 8;
    t = t | Wire.read();
  
   
  
  return t;
}
void setupWaterPump(){
    
    pinMode(D6, OUTPUT);    pinMode(D5, OUTPUT);
    digitalWrite(D5, HIGH); digitalWrite(D6, HIGH);
}

uint32_t getAverageHumidity(){
    return std::accumulate(v_hum.begin(), v_hum.end(), 0.0) / v_hum.size();
}
String toString(int num){
	String result; 	char data[50]=""; 	sprintf (data, "%d", num);	result = data;
	return result;
}

void onResetOrOTA(){
    
    if(AVG_COUNT <= iteration) 
    { // have at least AVG_Count number of samples in the ring buffer. cannot use size because capacity already reserved when delcared.
        auto currentAverageHumidity = getAverageHumidity();
        auto currentTimeStamp = Time.now();
        EEPROM.put(EEPROM_ADDR_LAST_AVG_HUMIDITY, currentAverageHumidity);
        EEPROM.put(EEPROM_ADDR_LAST_AVG_HUM_TIMESTAMP, currentTimeStamp);
        
        
        Particle.publish("onResetOrOTA()", String("EEPROM Write:")+toString(currentAverageHumidity)+String(", ")+toString(currentTimeStamp));
    }
}

void onStartup(){
    // check if an average is already in the EEPROM
    auto eepromTimestamp = Time.now(); // get correct type
    eepromTimestamp = 0;
    
    EEPROM.get(EEPROM_ADDR_LAST_AVG_HUM_TIMESTAMP, eepromTimestamp);
    if(Time.now() - eepromTimestamp <= 15*60){ // less than 15 minutes
        uint16_t eepromHumidity ;
        EEPROM.get(EEPROM_ADDR_LAST_AVG_HUMIDITY, eepromHumidity);
        std::fill (v_hum.begin(), v_hum.end(), eepromHumidity);
        
        Particle.publish("onStartup()", String("Avg Humidity set to: ")+toString(eepromHumidity)+String(" (")+toString(Time.now() - eepromTimestamp)+" seconds old).");
    }
    
}


void setup() {
    Particle.function("extSet", extSet);
    lastMeasureTime = 0;
    setupWaterPump();
    
    onStartup(); // handle eeprom read of last known values stored before reset or OTAP
    System.on(reset+firmware_update, onResetOrOTA); // register callback before resetting or upating firmware
    
    pinMode(D2, OUTPUT);
    Wire.setSpeed(CLOCK_SPEED_100KHZ);
    errorCode = 0;
    lastWateredT = "-"; nextWateringT = "-"; status = "ok";
    waterTime = 0;
    lastAlive = 0;
    //lastMeasureTime =  millis();
    lastMeasureTime = 0;
    iteration = 0;
    
    
    
    netatmo = new Netatmo();
    netatmo->init();
    
}


String buildStr(String input){
    return String("\"")+ input+String("\"");
    return input;
}

String buildPublishJsonData(){
    String result = "{";
    
    result +=buildStr("eC")+String(":")+buildStr(toString(errorCode))+String(",");
    result +=buildStr("hum")+String(":")+buildStr(toString(humidity))+String(",");
    result +=buildStr("lWT")+String(":")+buildStr(lastWateredT)+String(",");
    result +=buildStr("li")+String(":")+buildStr(toString(light))+String(",");
    result +=buildStr("nWT")+String(":")+buildStr(nextWateringT)+String(",");
    result +=buildStr("stat")+String(":")+buildStr(status)+String("");
    
    result += "}";
    return result;
}

int onWaterOn(){
   digitalWrite(D5, LOW);
   EEPROM.put(EEPROM_ADDR_LAST_WATER_TIMESTAMP, Time.now());
   Particle.publish("LadybugNotify");
   return SUCCESS_OK; 
}

int onWaterOff(){
   digitalWrite(D5, HIGH);
   return SUCCESS_OK; 
}

int extSet(String command)
{
    int result = -1;
    
    
    if (0 == command.compareTo("waterOn15s")){
         result = 0;
        digitalWrite(D5, LOW);
        waterTime = 15; // seconds
        lastWaterStartTime = millis();
    }
    else if (0 == command.compareTo("waterOn")){
        result = onWaterOn();
        
    } else if (0 == command.compareTo("waterOff")){
        result = onWaterOff();
        
    }
    
    return result;
}




void loop() {



    if(millis() - lastAlive > ALIVE_X_SECONDS*1000){
        //Spark.publish("LadybugAlive");
        lastAlive = millis();
    }

    netatmo->run(); // delay automatically handled internally
     

    if (millis() - lastMeasureTime > MEASURE_EVERY_X_SECONDS*1000) {
        
        lastMeasureTime = millis();
        digitalWrite(D2, HIGH); // supply board with current
        delay(100); // startup
       char data[50]="";
        String measure;
        
        measure+="Avg. Humidity: ";
        if(AVG_COUNT <= ++iteration) { // have at least AVG_Count number of samples in the ring buffer. cannot use size because capacity already reserved when delcared.
	       sprintf(data, "%d", getAverageHumidity());
	       measure+=data;
	       bool ok = false;
	       nextWateringT = toString(LinearRegressionPredict::predict(v_hum, ok, MEASURE_EVERY_X_SECONDS/60, WATER_AT_THRESHOLD));
	       Particle.publish("Next watering",nextWateringT+String(" minutes."));
	    } else {
	       measure+="-"; 
	    }
        measure+="   ";
        measure+="Humidity: " ;
        humidity = readI2CRegister16bit(0x20, 0); //read capacitance register
         sprintf(data, "%d", humidity); measure+=data+String("   Temperature: ");
         
         v_hum[iteration % AVG_COUNT] = humidity;
         
        temperature = readI2CRegister16bit(0x20, 5); //temperature register
        sprintf(data, "%d", temperature); measure+=data+String("   Light: ");
        writeI2CRegister8bit(0x20, 3); //request light measurement 
         delay(100); // startup
        light = readI2CRegister16bit(0x20, 4); //read light register
        sprintf(data, "%d", light); measure+=data+String(".");
        
       
        digitalWrite(D2, LOW);
      
       
        Spark.publish("LadybugReport",measure);
        //Spark.publish("gardenNotification", buildPublishJsonData());
	    
	    	
	
    }
}