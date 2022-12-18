var AWS = require('aws-sdk'),
    region = "us-east-1",
    secret,
    decodedBinarySecret;

function getConnection (secretName) {
    return new Promise((resolve,reject) => {
        var client = new AWS.SecretsManager({
            region: region
        })
        client.getSecretValue({SecretId: secretName}, function(err, data) {
            if (err) {
                console.log('a1');
                reject(`Connection string ${secretName} not found: ${err.code}` );
            }else{
              console.log('a2');
              if ('SecretString' in data) {
                    secret = data.SecretString;
                    resolve(JSON.parse(secret))
                }
                else {
                  console.log('a3');
                  reject("Connection secret is binary, should be JSON")
                }
            }
        });        
    })
}

module.exports = getConnection