/* eslint-disable no-console */
const { Client } = require('pg');
const getConnection = require('./getConnection');

let debug = false;

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

const pgErrorCodes = require('./pgErrorCodes');

function handleAssets(event, pathElements, verb) {
  return {
    body: `Yay I got the verb ${verb}`,
  };
}

// eslint-disable-next-line camelcase
const lambda_handler = async function x(event) {
  let time = 'day';
  let responseCode = 200;
  let result = { body: 'No result' };
  console.log(`request: ${JSON.stringify(event)}`);

  // Parse event.path to pick up the elements of path
  const pathElements = event.requestContext.http.path.substring(1).split('/');
  const verb = event.requestContext.http.method;
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
    const body = JSON.parse(event.body);
    if (body.time) time = body.time;
    console.log('Got the time: ', time);
    responseCode = 300;
  }

  const greeting = 'Hello';

  const responseBody = {
    elements: pathElements,
    result,
    message: greeting,
    input: event,
  };

  // The output from a Lambda proxy integration must be
  // in the following JSON object. The 'headers' property
  // is for custom response headers in addition to standard
  // ones. The 'body' property  must be a JSON string. For
  // base64-encoded payload, you must also set the 'isBase64Encoded'
  // property to 'true'.
  const response = {
    statusCode: responseCode,
    headers: {
      'x-custom-header': 'my custom header value',
    },
    body: JSON.stringify(responseBody),
  };
  console.log(`response: ${JSON.stringify(response)}`);
  return response;
};

module.exports = {
  // eslint-disable-next-line camelcase
  lambda_handler,
};
