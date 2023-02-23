'use strict';
console.log('Loading hello world function');

function handleAssets(event, pathElements, verb) {
    return {
        body: `Yay I got the verb ${verb}`
    };
}
 
export const handler = async (event) => {
    let name = "you";
    let city = 'World';
    let time = 'day';
    let day = '';
    let responseCode = 200;
    let result = {body: 'No result'};
    console.log("request: " + JSON.stringify(event));
    
    // Parse event.path to pick up the elements of path
    const pathElements = event.path.substring(1).split('/');
    const verb = event.httpMethod;
    switch (pathElements[0]) {
        case 'helloworld': 
            result = handleAssets(event, pathElements, verb);
            break;
            
        case 'assets':
            result = handleAssets(event, pathElements, verb);
            break;
            
        default:
            console.log('I do not know what is happening!');
    }
    
    if (event.body) {
        let body = JSON.parse(event.body)
        if (body.time) 
            time = body.time;
    }
 
    let greeting = 'Hello';

    let responseBody = {
        elements: pathElements,
        result,
        message: greeting,
        input: event
    };
    
    // The output from a Lambda proxy integration must be 
    // in the following JSON object. The 'headers' property 
    // is for custom response headers in addition to standard 
    // ones. The 'body' property  must be a JSON string. For 
    // base64-encoded payload, you must also set the 'isBase64Encoded'
    // property to 'true'.
    let response = {
        statusCode: responseCode,
        headers: {
            "x-custom-header" : "my custom header value"
        },
        body: JSON.stringify(responseBody)
    };
    console.log("response: " + JSON.stringify(response))
    return response;
};
