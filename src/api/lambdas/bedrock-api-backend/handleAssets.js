/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');
const getAssetList = require('./getAssetList');
const getAsset = require('./getAsset');
const getAllAssetDepends = require('./getAllAssetDepends');
const addAsset = require('./addAsset');
const updateAsset = require('./updateAsset');
const deleteAsset = require('./deleteAsset');
const getTasks = require('./getTasks');

// eslint-disable-next-line no-unused-vars
async function handleAssets(event, pathElements, queryParams, verb, connection) {
  let result = {
    error: false,
    message: '',
    result: null,
  };

  switch (pathElements.length) {
    // GET assets
    case 1:
      result = await getAssetList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
      );
      break;

    // VERB assets/{assetname}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getAsset(pathElements, queryParams, connection);
          break;

        case 'POST':
          result = await addAsset(event.body, pathElements, queryParams, connection);
          break;

        case 'PUT':
          result = await updateAsset(event.body, pathElements, queryParams, connection);
          break;

        case 'DELETE':
          result = deleteAsset(pathElements, queryParams, connection);
          break;

        default:
          result.message = `handleAssets: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    // GET/DELETE assets/{assetname}/tasks OR
    // GET assets/{assetname}/depends
    case 3:
      if (pathElements[2] === 'tasks') {
        if (verb === 'GET') {
          result = await getTasks(
            event.requestContext.domainName,
            pathElements,
            queryParams,
            connection,
          );
        } else if (verb === 'DELETE') {
          result.message = 'Delete all asset tasks not implemented';
          result.error = true;
        }
      } else if (pathElements[2] === 'depends') {
        result = await getAllAssetDepends(pathElements, queryParams, connection);
      } else {
        result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        result.error = true;
      }
      break;

    // POST/PUT/DELETE assets/{assetname}/tasks/{taskPosition} OR
    // GET /bedrock/assets/search/{searchString}
    case 4:
      if (pathElements[1] === 'search') {
        result.message = 'Assets search not implemented';
        result.error = true;
      } else if (pathElements[2] === 'tasks') {
        switch (verb) {
          case 'POST':
            result.message = 'Add asset task not implemented';
            result.error = true;
            break;

          case 'PUT':
            result.message = 'Update asset task not implemented';
            result.error = true;
            break;

          case 'DELETE':
            result.message = 'Delete asset task not implemented';
            result.error = true;
            break;

          default:
            result.message = `handleAssets: unknown verb ${verb}`;
            result.error = true;
            break;
        }
      } else {
        result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        result.error = true;
      }
      break;

    default:
      result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log(`We have an error but do not know why! - ${result.message}`);
  }
  return result;
}

module.exports = handleAssets;
