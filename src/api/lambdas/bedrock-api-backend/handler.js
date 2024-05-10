/* eslint-disable no-console */
// Disabling import/no-unresolved because the dependency as defined
// in package.json only works in the build subdirectory.
// eslint-disable-next-line import/no-unresolved
const { getDBConnection } = require('bedrock_common');

const handleAssets = require('./assets/handleAssets');
const handleRungroups = require('./rungroups/handleRungroups');
const handleReference = require('./reference/handleReference');
const handleTags = require('./tags/handleTags');



// eslint-disable-next-line camelcase
const lambda_handler = async function x(event) {
  let result = {
    error: true,
    message: 'Unknown resource',
    result: null,
  };
  const connection = await getDBConnection();

  // Parse event.path to pick up the path elements and verb
  const pathElements = event.requestContext.http.path.substring(1).split('/');
  const queryParams = event.queryStringParameters;
  const verb = event.requestContext.http.method;

  // First path element identifies the resource
  switch (pathElements[0]) {
    case 'rungroups':
      try {
        result = handleRungroups(event, pathElements, queryParams || {}, verb, connection);
      } catch (e) {
        result.message = e;
      }
      break;

    case 'assets':
      try {
        result = await handleAssets(event, pathElements, queryParams || {}, verb, connection);
      } catch (e) {
        result.message = e;
        console.log('Error in handleAssets ', e);
      }
      break;

    case 'reference':
      try {
        result = await handleReference(event, pathElements, queryParams || {}, verb, connection);
      } catch (e) {
        result.message = e;
        console.log('Error in handleReference ', e);
      }
      break;

      case 'tags':
        try {
          result = await handleTags(event, pathElements, queryParams || {}, verb, connection);
        } catch (e) {
          result.message = e;
          console.log('Error in handleTags ', e);
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
