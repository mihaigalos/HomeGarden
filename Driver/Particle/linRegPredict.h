#pragma once

#include <vector>
#include "application.h"
// adapted from http://stackoverflow.com/questions/18939869/how-to-get-the-slope-of-a-linear-regression-line-using-c

class LinearRegressionPredict{
public:
    static uint16_t  predict(std::vector<uint16_t> &measurements, bool &ok, uint16_t xResolutionMinutes, uint16_t waterAtTreshold=480); // int variant, using it for measurements from sensors returning whole measurements
    
};