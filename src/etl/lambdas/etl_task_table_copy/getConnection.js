const AWS = require('aws-sdk');

const region = 'us-east-1';
let secret;

function getConnection(secretName) {
  return new Promise((resolve, reject) => {
    const client = new AWS.SecretsManager({
      region,
    });
    client.getSecretValue({ SecretId: secretName }, (err, data) => {
      if (err) {
        reject(new Error(`Connection string ${secretName} not found: ${err.code}`));
      } else if ('SecretString' in data) {
        secret = data.SecretString;
        resolve(JSON.parse(secret));
      } else {
        reject(new Error('Connection secret is binary, should be JSON'));
      }
    });
  });
}

module.exports = getConnection;
