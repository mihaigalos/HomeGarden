class Netatmo{
    
    double rainLastHour;
    uint32_t lastRun;
   
public:
    double getRain(){
        return   rainLastHour;
    
    }
    
    void onNeatatmoToken(const char *name, const char *data) {
       // Particle.publish("GotToken!!");
       
       
       String response = String(data);
       
       int posTokenStart = response.indexOf("\":\"", 12); // skip first ":"access_token part, go direct to token part
       int posTokenEnd  = response.indexOf("\"",posTokenStart+3);
       
       char buffer [33];   
       
       
       String token = response.substring(posTokenStart+3, posTokenEnd);
     //  Particle.publish(String("GotToken: "),token);
     
       String tokenJson = "{\"token\":\""+token+"\"}";
        delay(2*1000); // 15 min
        Particle.publish("getNetatmoMeasurements", tokenJson);
    }
    
    void onNeatatmoMeasurments(const char *name, const char *data) {
        
       String measurements (data);
        
       
       String sumRain1 = "sum_rain_1\":";
        int posSumRain1Start = measurements.indexOf(sumRain1);
        
        if(-1 != posSumRain1Start){
            
            posSumRain1Start+=sumRain1.length();
            int posSumRain1End = measurements.indexOf("}",posSumRain1Start);
            
            if(measurements.substring(posSumRain1Start, posSumRain1End).toFloat() > rainLastHour ) {
                Particle.publish("rainDetected");
            }
            
            rainLastHour = measurements.substring(posSumRain1Start, posSumRain1End).toFloat();
        }
        
    }
    
    void init(){
        rainLastHour = 0.0; lastRun = 0; // 60 hours, negative to assure first iteration
        Particle.subscribe("hook-response/getNetatmoToken", &Netatmo::onNeatatmoToken, this, MY_DEVICES);
        Particle.subscribe("hook-response/getNetatmoMeasurements", &Netatmo::onNeatatmoMeasurments, this, MY_DEVICES);
    }
    
    void run(uint32_t period=15*60*1000){
        
        if((0 == lastRun) || (millis() - lastRun >= period) ) {
            lastRun = millis();
            Particle.publish("getNetatmoToken");
        }
    }
    
};