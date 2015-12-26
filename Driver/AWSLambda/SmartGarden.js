



/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

var http = require('https');
var deviceID = "240044000e47343432313031";
var particleToken = "d3d2f295f9fbb706cabcac98bb626fc6293ebed8";
 
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
    console.log("Garden: onIntent requestId=" + intentRequest.requestId +
            ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

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
    var speechOutput = "Welcome to smart garden. Please tell me what action to perform.";
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