



var http = require('https');
var querystring = require("querystring"); 

var deviceID = "240044000e47343432313031"; // particle deviceId
var particleToken = "d3d2f295f9fbb706cabcac98bb626fc6293ebed8";


var fpUserId= 		'mihaigalos@yahoo.com';
var fpPassword=		'fruityFruity';
var fpClientId = 	'mihaigalos@gmail.com';
var fpClientSecret ='vUnIJISHvfqADk5CkHEz2h8KqIlcuIVqGKPIM1PGqhWaIX1o';


 
 
//----------------------------------------------------------------------------------------------

function doCall(payload, options, onResponse,
                callback, intentName, intentSlots){
		
		var req = http.request(options, function(res) {
				res.setEncoding('utf8');
				
				 console.log("statusCode: ", res.statusCode);
				 console.log("headers: ", res.headers);

				
				res.on('data', function (chunk) {
					console.log("body: " + chunk);
					var parsedResponse = JSON.parse(chunk);
					if (typeof onResponse !== 'undefined') {
						onResponse(parsedResponse, callback, intentName, intentSlots);
					}
				
				});
				
				res.on('error', function (chunk) {
					console.log('Error: '+chunk);
				});
				
				res.on('end', function() {
					
					//callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
				});
				
			});

            req.on('error', function(e){console.log('error: '+e)});
			req.write(payload);
			
			req.end();
	
}




 
 
// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("Garden: event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
         }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("Garden: onSessionStarted requestId=" + sessionStartedRequest.requestId +
            ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("Garden: onLaunch requestId=" + launchRequest.requestId +
            ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
  

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
	console.log("Garden: Intent: "+intentName)
	console.log("Garden: IntentValue: "+intent.slots.Action.value)
    // Dispatch to your skill's intent handlers
    if ("DoActionIntent" === intentName) {
        setActionInSession(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("Garden: onSessionEnded requestId=" + sessionEndedRequest.requestId +
            ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    //var speechOutput = "Welcome to smart garden.  Please tell me what action to perform.";
    var speechOutput = "Welcome to Isengard. Mines Tirith is only a stone's throw away.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me what action to undertake. For example, start watering.";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function setActionInSession(intent, session, callback) {
    var cardTitle = intent.name;
    var desiredActionSlot = intent.slots.Action;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

	 var PinStatus = 1;
	
	
	
	
	
	
	
	
    if (desiredActionSlot) {
        var desiredAction = desiredActionSlot.value;
		sessionAttributes = createActionAttributes(desiredAction);
		
		
		
		console.log("Garden: received desired action: "+desiredAction);	
		if( "start watering" === desiredAction){
		    
		    var consoleLogMessage = "watering started";
        	speechOutput = consoleLogMessage;
			buildHttpReqSendToPhoton("waterOn", consoleLogMessage, cardTitle, consoleLogMessage, repromptText, shouldEndSession, sessionAttributes,callback);
        
		} else if ("stop watering" === desiredAction){
			
			var consoleLogMessage = "Stopping watering now.";
        	speechOutput = consoleLogMessage;
			buildHttpReqSendToPhoton("waterOff", consoleLogMessage, cardTitle, consoleLogMessage, repromptText, shouldEndSession, sessionAttributes,callback);
			
		} else if ("finish watering" === desiredAction){
			

			var consoleLogMessage = "Finishing up.";
        	speechOutput = consoleLogMessage;
			buildHttpReqSendToPhoton("waterOff", consoleLogMessage, cardTitle, consoleLogMessage, repromptText, shouldEndSession, sessionAttributes,callback);			
		} else if(
					("get status of fruity" 	=== desiredAction)||
					("get status of lemon tree" === desiredAction)){
				console.log("Garden : getting token..");
				getFlowerPowerToken(callback, intent.name, intent.slots);
			
		} else if ("get help" === desiredAction) {
			speechOutput = "Ok. Options are: ";
			speechOutput +="Start or stop watering. ";
			speechOutput +="Get status of fruity. ";
			callback("", buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
			
		} else if ("stop" === desiredAction){
			callback("", buildSpeechletResponse(intent.name, "", "", true));
			
		}
		else {
			
			speechOutput +="I didn't get that, come again? ";
			callback("", buildSpeechletResponse(intent.name, speechOutput, repromptText, false));
			
		}
		
		
    } else {
        speechOutput = "I'm not sure what you want me to do. Sorry.";
        repromptText = "Please tell me what action to undertake. For example, start watering.";
    }

    /*callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));*/
}

function buildHttpReqSendToPhoton(sendCommand, consoleLogMessage, cardTitle, speechOutput, repromptText, shouldEndSession, sessionAttributes, callback) {
    var data = 'args='+sendCommand;
        			 
        			 
        			
		var options = {
			host: 'api.particle.io',
			port: 443,
			path: '/v1/devices/'+deviceID+'/extSet',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Bearer '+particleToken,
				'Content-Length': Buffer.byteLength(data)
			}
		};
		
		
		
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			console.log("Garden: "+consoleLogMessage);
			
			
			
		});
	
			res.on('error', function (chunk) {
				console.log('Garden: Error: '+chunk);
			});
			
			res.on('end', function() {
				console.log('End of request');
				callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
			});
			
		});
	
		req.on('error', function(e){console.log('Garden: error: '+e)});
		req.write(data);
		req.end();
}

function createActionAttributes(desiredAction) {
    return {
        desiredAction: desiredAction
    };
}


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

//------------------------------------------------------------------------------------------------------------
// Flower Power Specific stuff

function getDateNow(substractTwoHours){
	var now = new Date();
	var dd = now.getDate();
	var mm = now.getMonth()+1; //January is 0!
	var yyyy = now.getFullYear();
	
	var hour    =now.getHours();
	
	if(substractTwoHours){
		hour = parseInt(now.getHours() -2).toString(); // -2 for UTC and -1 for last hour
	}
    var minute  = parseInt(now.getMinutes()).toString();
    var second  = parseInt(now.getSeconds()).toString(); 
	
	
	if(dd<10) {
	    dd='0'+dd
	} 
	
	if(mm<10) {
	    mm='0'+mm
	} 
	
	now = yyyy+'-'+mm+'-'+dd+'T'+hour+':'+minute+':'+second+'Z';
	return now
}

function onReceivedDataFlowerPower (param, callback, intentName, intentSlots){
	var soilMoistureFruity	= parseFloat(param.locations[1].soil_moisture.gauge_values.current_value).toFixed(1);
	var soilMinFruity 		= param.locations[1].soil_moisture.gauge_values.min_threshold;
	
	var fertilizerFruity 		= parseFloat(param.locations[1].fertilizer.gauge_values.current_value).toFixed(0);
	var fertilizerFruityMin	= param.locations[1].fertilizer.gauge_values.min_threshold;
	
	var battery			= param.sensors[0].battery_level.level_percent;
	var batteryUntil	= param.sensors[0].battery_level.battery_end_of_life_date_utc;
	
	var soilMoistureCitrony	= parseFloat(param.locations[0].soil_moisture.gauge_values.current_value).toFixed(1);
	var soilMinCitrony 		= param.locations[0].soil_moisture.gauge_values.min_threshold;
	
	var fertilizerCitrony 		= parseFloat(param.locations[0].fertilizer.gauge_values.current_value).toFixed(0);
	var fertilizerCitronyMin	= param.locations[0].fertilizer.gauge_values.min_threshold;
	
	var batteryCitrony			= param.sensors[1].battery_level.level_percent;
	var batteryCitronyUntil	= param.sensors[1].battery_level.battery_end_of_life_date_utc;	
	
	
	console.log("Garden: Fruity and Citrony: Received data from server.");
	
	var shouldEndSession = true;
	var repromptText = "";
	var speechOutput = ""
	
	
	if("get status of fruity" === intentSlots.Action.value ){
	
		speechOutput = "Ok. Fruity's soil humidity is "+soilMoistureFruity+" percent. ";
		if (soilMoistureFruity < parseFloat(soilMinFruity).toFixed(1)){
			speechOutput += "You should water it now. ";
		}
		
		if(fertilizerFruity < parseFloat(fertilizerFruityMin).toFixed(0)){
			speechOutput +="Also, it seems the fertilizer level is "+fertilizerFruity+", and should be a minimum of "+fertilizerFruityMin+" percent. Please fertilize now. ";
		}
		console.log('Intent Name'+intentName );
		console.log('Intent Slots'+intentSlots );
		
		
		//-------------------------------------------------------------------------
		// battery part
		
		var yyyymmdd = batteryUntil.substr(0, batteryUntil.indexOf('T')); 
		var monthNames = ["January", "February", "March", "April", "May", "June",
		  "July", "August", "September", "October", "November", "December"
		];

		var day = yyyymmdd.substr(yyyymmdd.lastIndexOf("-")+1, yyyymmdd.length);
		var suffix = "th";
		if ('01' === day) { 
			suffix = "st";
		} else if ('02' === day) { 
			suffix = "nd";
		} else if ('03' === day) { 
			suffix = "rd";
		}
		
		var d = new Date(yyyymmdd);
		
		speechOutput += "Batteries are good until "+ monthNames[d.getMonth()] +", the "+parseInt(day)+suffix ;
		
	}  else if("get status of lemon tree" === intentSlots.Action.value ){
	
		speechOutput = "Ok. The lemon tree's soil humidity is "+soilMoistureCitrony+" percent. ";
		if (soilMoistureCitrony < parseFloat(soilMinCitrony).toFixed(1)){
			speechOutput += "You should water it now. ";
		}
		
		if(fertilizerCitrony < parseFloat(fertilizerCitronyMin).toFixed(0)){
			speechOutput +="Also, it seems the fertilizer level is "+fertilizerCitrony+", and should be a minimum of "+fertilizerCitronyMin+" percent. Please fertilize now. ";
		}
		console.log('Intent Name'+intentName );
		console.log('Intent Slots'+intentSlots );
		
		
		//-------------------------------------------------------------------------
		// battery part
		
		var yyyymmdd = batteryCitronyUntil.substr(0, batteryCitronyUntil.indexOf('T')); 
		var monthNames = ["January", "February", "March", "April", "May", "June",
		  "July", "August", "September", "October", "November", "December"
		];

		var day = yyyymmdd.substr(yyyymmdd.lastIndexOf("-")+1, yyyymmdd.length);
		var suffix = "th";
		if ('01' === day) { 
			suffix = "st";
		} else if ('02' === day) { 
			suffix = "nd";
		} else if ('03' === day) { 
			suffix = "rd";
		}
		
		var d = new Date(yyyymmdd);
		
		speechOutput += "Batteries are good until "+ monthNames[d.getMonth()] +", the "+parseInt(day)+suffix ;
		
	} 
	
	callback("", buildSpeechletResponse(intentName, speechOutput, repromptText, shouldEndSession));
}

function onReceivedTokenFlowerPower(param, callback, intentName, intentSlots){
	var access_token = param.access_token;
	
	
	var location_identifier = 'YAdCDQKl1J1435177919229'

	var from = getDateNow(true);

	
	var payload = querystring.stringify({
		'from_datetime_utc': from
	});
	
	var options = {
		host: 'apiflowerpower.parrot.com',
		path: '/sensor_data/v4/garden_locations_status/',
		method: 'GET',
		headers: {
		   'Authorization': 'Bearer ' + access_token
		}
		
	};
	
	doCall(payload, options, onReceivedDataFlowerPower, callback, intentName, intentSlots);
}

function getFlowerPowerToken(callback, intentName, intentSlots){

	var payload = querystring.stringify({
		'grant_type' 	: 'password',
		'client_id'		: fpClientId,
		'client_secret'	: fpClientSecret,
		'username' 		: fpUserId,
		'password' 		: fpPassword
  });
	
	var options = {
			host: 'apiflowerpower.parrot.com',
			path: '/user/v1/authenticate',
			method: 'POST',
           headers: {
		        'Content-Type': 'application/x-www-form-urlencoded',
		        'Content-Length': Buffer.byteLength(payload)
		    }
			
		};
		
	doCall(payload, options, onReceivedTokenFlowerPower, callback, intentName, intentSlots);
	
}



 
//----------------------------------------------------------------------------------------------