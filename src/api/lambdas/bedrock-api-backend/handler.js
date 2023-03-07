/* eslint-disable no-console */
const getConnection = require('./getConnection');

const handleAssets = require('./handleAssets');
const handleRungroups = require('./handleRungroups');

async function getConnectionObject() {
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
    return getConnection('nopubrecdb1/bedrock/bedrock_user')
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

// eslint-disable-next-line camelcase
const lambda_handler = async function x(event) {
  let result = {
    error: true,
    message: 'Unknown resource',
    result: null,
  };
  const connection = await getConnectionObject();

  // Parse event.path to pick up the path elements and verb
  const pathElements = event.requestContext.http.path.substring(1).split('/');
  const queryParams = event.queryStringParameters;
  const verb = event.requestContext.http.method;

  // First path element identifies the resource
  switch (pathElements[0]) {
    case 'rungroups':
      try {
        result = handleRungroups(event, pathElements, queryParams, verb, connection);
      } catch (e) {
        result.message = e;
      }
      break;

    case 'assets':
      try {
        result = await handleAssets(event, pathElements, queryParams, verb, connection);
      } catch (e) {
        result.message = e;
      }
      break;

    default:
      console.log('Unknown path ', pathElements[0]);
      break;
  }

  return result;
};

module.exports = {
  // eslint-disable-next-line camelcase
  lambda_handler,
};
