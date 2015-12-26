#define MEASURE_EVERY_X_SECONDS 15

uint32_t lastMeasureTime; 
uint32_t lastWaterStartTime;

uint32_t waterTime;

int8_t errorCode;
uint16_t light, humidity, temperature;

String lastWateredT, nextWateringT, status;

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
 
  
  
   unsigned int t  = 0;
 delay(20);
   Wire.requestFrom(addr, 2);
  t = Wire.read() << 8;
  t = t | Wire.read();
  
   Wire.endTransmission();
  
  return t;
}
void setupWaterPump(){
    
      pinMode(D6, OUTPUT);    pinMode(D5, OUTPUT);
    digitalWrite(D5, HIGH); digitalWrite(D6, HIGH);
}

void setup() {
    Particle.function("extSet", extSet);
    lastMeasureTime = 0;
    setupWaterPump();
    
    pinMode(D2, OUTPUT);
    Wire.setSpeed(CLOCK_SPEED_100KHZ);
    errorCode = 0;
    lastWateredT = "-"; nextWateringT = "-"; status = "ok";
    waterTime = 0;
    //lastMeasureTime =  millis();
}
String toString(int num){
	String result;
	char data[50]="";
	sprintf (data, "%d", num);
	result = data;
	return result;
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

int extSet(String command)
{
    int result = -1;
    
    
    if (0 == command.compareTo("waterOn10s")){
         result = 0;
        digitalWrite(D5, LOW);
        waterTime = 10; // seconds
        lastWaterStartTime = millis();
    }
    else if (0 == command.compareTo("waterOn")){
        result = 0;
        digitalWrite(D5, LOW);
    } else if (0 == command.compareTo("waterOff")){
        result = 0;
        digitalWrite(D5, HIGH);
    }
    
    return result;
}




void loop() {


    if(millis() - lastWaterStartTime > waterTime*1000){
        digitalWrite(D5, HIGH);
    }

    if (millis() - lastMeasureTime > MEASURE_EVERY_X_SECONDS*1000) {
        
        lastMeasureTime = millis();
        digitalWrite(D2, HIGH); // supply board with current
        delay(100); // startup
       char data[50]="";
        String measure = "Humidity: sensor not connected";
     /*   humidity = readI2CRegister16bit(0x20, 0); //read capacitance register
         sprintf(data, "%d", humidity); measure+=data+String("   Temperature: ");
        temperature = readI2CRegister16bit(0x20, 5); //temperature register
        sprintf(data, "%d", temperature); measure+=data+String("   Light: ");
        writeI2CRegister8bit(0x20, 3); //request light measurement 
         delay(100); // startup
        light = readI2CRegister16bit(0x20, 4); //read light register
        sprintf(data, "%d", light); measure+=data+String(".");
        
       
        digitalWrite(D2, LOW);*/
      
       
        Spark.publish("Measurements",measure);
        Spark.publish("gardenNotification", buildPublishJsonData());
		
	
		
    }
}