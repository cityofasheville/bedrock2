/* eslint-disable no-console */
const getConnection = require('./getConnection');
const pgErrorCodes = require('./pgErrorCodes');

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
  if (!('BEDROCK_DB_HOST' in process.env)) {
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
  /* This is the default response for anything we don't recognize.
   * I'm not certain about whether I need to set cookies, headers, or
   * isBase64Encoded or whether I'm doing it right.
   */
  let response = {
    cookies: event.cookies,
    isBase64Encoded: event.isBase64Encoded,
    statusCode: 404,
    headers: event.headers,
    body: 'Unknown resource',
  };
  let result;
  const connection = getConnectionObject();

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
        response.body = e;
        response.statusCode = 500;
        return response;
      }
      break;

    case 'assets':
      try {
        result = handleAssets(event, pathElements, queryParams, verb, connection);
      } catch (e) {
        response.body = e;
        response.statusCode = 500;
        return response;
      }
      break;

    default:
      console.log('Unknown path ', pathElements[0]);
      return response;
  }

  return result;
};

module.exports = {
  // eslint-disable-next-line camelcase
  lambda_handler,
};
