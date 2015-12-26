console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {
    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    var tableName = "GardenData";
    var dateTime = new Date().getTime().toString();
    
    var dateTimeIso = new Date().toISOString()
    
    console.log("datetime: "+dateTime);
    console.log("datetimeIso: "+dateTimeIso);
    
    
    dynamodb.putItem({
            "TableName": tableName,
            "Item": {
                "PartitionKey": {
                    "S": dateTimeIso
                }, 
                "SortKey": {
                    "N": dateTime
                },
                "ErrorCode": {
                    "N": event.errCode
                },
                "Humidity": {
                    "N": event.humidity
                },
                "LastWateredT": {
                    "S": event.lastWateredT
                },
                "Light": {
                    "N": event.light
                },
                "NextWateringT": {
                    "S": event.nextWateringT
                },
                "Status": {
                    "S": event.status
                }
            }
        }, function(err, data) {
            if (err) {
                context.fail('ERROR: Dynamo failed: ' + err);
            } else {
                console.log('Dynamo Success: ' + JSON.stringify(data, null, '  '));
                context.succeed('SUCCESS');
            }
        });
}