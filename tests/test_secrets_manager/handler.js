// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://aws.amazon.com/developers/getting-started/nodejs/

// Load the AWS SDK
var AWS = require('aws-sdk'),
    region = "us-east-1",
    secret,
    decodedBinarySecret;

function getConnection (secretName) {
    return new Promise((resolve,reject) => {
        // Create a Secrets Manager client
        var client = new AWS.SecretsManager({
            region: region,
            // accessKeyId: "",
            // secretAccessKey: "",
            // sessionToken: ""
        })
        client.getSecretValue({SecretId: secretName}, function(err, data) {
            if (err) reject( err.code );
            console.log(data)

            if ('SecretString' in data) {
                secret = data.SecretString;
                resolve(JSON.parse(secret))
            }
            // else {
            //     // if secret is binary
            //     let buff = new Buffer(data.SecretBinary, 'base64');
            //     decodedBinarySecret = buff.toString('ascii');
            // }
        });        
    })

}

exports.lambda_handler = function (event, context) {
    getConnection("munis/munprod/fme_jobs")
    .then(ret=>console.log("ret",ret))
}

// module.exports = getConnection

/*
ERROR CODES
if (err.code === 'DecryptionFailureException')
// Secrets Manager can't decrypt the protected secret text using the provided KMS key.

else if (err.code === 'InternalServiceErrorException')
// An error occurred on the server side.

else if (err.code === 'InvalidParameterException')
// You provided an invalid value for a parameter.

else if (err.code === 'InvalidRequestException')
// You provided a parameter value that is not valid for the current state of the resource.
else if (err.code === 'ResourceNotFoundException')
// We can't find the resource that you asked for.

*/