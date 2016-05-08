#include "linRegPredict.h"
#include <stdint.h>
#include <numeric>

#include "application.h"
using namespace std;
uint16_t LinearRegressionPredict::predict(std::vector<uint16_t> &measurements, bool &ok, uint16_t xResolutionMinutes, uint16_t waterAtTreshold){
    uint16_t result = 0;
        vector<uint16_t> x (measurements.size());
        iota (x.begin(), x.end(), 0); // fill with incrementing values starting from 0
        
    
        double n = measurements.size();
        double avgX = accumulate(x.begin(), x.end(), 0.0) / n; double avgY = accumulate(measurements.begin(), measurements.end(), 0.0) / n;
        double numerator = 0.0; double denominator = 0.0;
    
        for(int i=0; i<n; ++i){
            numerator += (x[i] - avgX) * (measurements[i] - avgY); denominator += (x[i] - avgX) * (x[i] - avgX);
        }
    
        if(denominator == 0) ok = false;
        else {
            auto slope =  numerator / denominator;
            
            if(measurements.size() > 10){
                
                // slope = (y2-y1)/(x2-x1)   --> x2 = (y2-y1+ slope*x1)/slope, where x1 = xResolutionMinutes * (numberOfSamples - smallAverageOfCurrentY=10)
                
                double avgY10 = accumulate(measurements.end()-10, measurements.end(), 0.0) / n;
                double predictedWatering = (waterAtTreshold- avgY10  + slope*(xResolutionMinutes*(measurements.size() -10)))/slope;
                result = static_cast<uint16_t>(predictedWatering);
                ok = true;
            }
            
            
        }
    
    return result;
}