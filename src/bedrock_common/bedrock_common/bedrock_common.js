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
  // default values
  let host = '';
  let port = 5432;
  let user = 'bedrock';
  let password = 'test-bedrock';
  let database = 'bedrock';

  if ('BEDROCK_DB_HOST_ENDPOINT' in process.env && process.env.BEDROCK_DB_HOST_ENDPOINT.trim() !== '') {
    host = process.env.BEDROCK_DB_HOST_ENDPOINT.replace(/"/g,"").split(':')[0];
  }
  if ('BEDROCK_DB_HOST' in process.env && process.env.BEDROCK_DB_HOST.trim() !== '') {
    host = process.env.BEDROCK_DB_HOST.replace(/"/g,"");
  }
  if ('BEDROCK_DB_USER' in process.env && process.env.BEDROCK_DB_USER.trim() !== '') {
    user = process.env.BEDROCK_DB_USER.replace(/"/g,"");
  }
  if ('BEDROCK_DB_PASSWORD' in process.env && process.env.BEDROCK_DB_PASSWORD.trim() !== '') {
    password = process.env.BEDROCK_DB_PASSWORD.replace(/"/g,"");
  }
  if ('BEDROCK_DB_NAME' in process.env && process.env.BEDROCK_DB_NAME.trim() !== '') {
    database = process.env.BEDROCK_DB_NAME.replace(/"/g,"");
  }

  let connection = {
    host,
    port,
    user,
    password,
    database,
    max: 10,
    idleTimeoutMillis: 10000,
  };

  // If BEDROCK_DB_HOST is not in the environment, assume production Bedrock DB
  if (host === '') {
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

