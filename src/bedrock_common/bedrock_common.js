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

async function getDBConnection() {
  let connection = Promise.resolve({
    host: process.env.BEDROCK_DB_HOST || 'localhost',
    port: 5432,
    user: process.env.BEDROCK_DB_USER || 'bedrock',
    password: process.env.BEDROCK_DB_PASSWORD || 'test-bedrock',
    database: process.env.BEDROCK_DB_NAME || 'bedrock',
    max: 10,
    idleTimeoutMillis: 10000,
  });

  // If BEDROCK_DB_HOST is not in the environment, assume normal bedrock DB
  if (!('BEDROCK_DB_HOST' in process.env)
      || process.env.BEDROCK_DB_HOST === null
      || process.env.BEDROCK_DB_HOST.trim().length === 0) {
    return getConnection('pubrecdb1/bedrock/bedrock_user')
      .then(
        (cpValue) => {
          connection = {
            host: cpValue.host,
            port: cpValue.port,
            user: cpValue.username,
            password: cpValue.password,
            database: cpValue.database,
            max: 10,
            idleTimeoutMillis: 10000,
          };
          return connection;
        },
      )
      .catch((err) => { // Just pass it on.
        throw err;
      });
  }
  return connection;
}

module.exports = {
  getConnection,
  getDBConnection,
};

