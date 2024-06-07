import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const region = 'us-east-1';
let secret;

async function getConnection(secretName) {
  const client = new SecretsManagerClient({
    region
  });

  let response;
  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );
  } catch (error) {
    console.log(error);
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }
  return JSON.parse(response.SecretString);
}

// Get connection data for Bedrock database
async function getDBConnection() {
  let connection = Promise.resolve({
    host: process.env.BEDROCK_DB_HOST.replace(/"/g,"") || 'localhost',
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

export {
  getConnection,
  getDBConnection,
};

