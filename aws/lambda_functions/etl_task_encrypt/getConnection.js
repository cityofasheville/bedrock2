var AWS = require('aws-sdk'),
    region = "us-east-1",
    secret;

function getConnection (secretName) {
    return new Promise((resolve,reject) => {
        var client = new AWS.SecretsManager({
            region: region
        })
        client.getSecretValue({SecretId: secretName}, function(err, data) {
            if (err) {
                reject(`Connection string ${secretName} not found: ${err.code}` );
            }else{
                if ('SecretString' in data) {
                    secret = data.SecretString;
                    resolve(JSON.parse(secret))
                }
                else {
                    reject("Connection secret is binary, should be JSON")
                }
            }
        });        
    })
}

module.exports = getConnection