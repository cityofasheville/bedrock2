/* eslint-disable import/extensions */
/* eslint-disable no-console */
// Disabling import/no-unresolved because the dependency as defined
// in package.json only works in the build subdirectory.
// eslint-disable-next-line import/no-unresolved
import { getDBConnection } from 'bedrock_common';
import handleAssets from './assets/handleAssets.js';
import handleRunGroups from './run_groups/handleRunGroups.js';
import handleReference from './reference/handleReference.js';
import handleAssetTypes from './asset_types/handleAssetTypes.js';
import handleTags from './tags/handleTags.js';
import handleCustomFields from './custom_fields/handleCustomFields.js';
import handleOwners from './owners/handleOwner.js';
import handleAbout from './about/handleAbout.js';
import handleExecuteETL from './execute_etl/handleExecuteETL.js';
import { getDb } from './utilities/dbUtilities.js';

// eslint-disable-next-line camelcase, import/prefer-default-export
export async function lambda_handler(event) {
  if (event.requestContext.http.method === "OPTIONS") {
    return { statusCode: 204 };
  }
  if(event.headers.authorization !== process.env.API_KEY) {
    console.log('Not Authenticated');
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'message': 'Not Authenticated'
      })
    };
  }

  const connection = await getDBConnection();
  let db = await getDb(connection);
  
  let api_result = {
    statusCode: 404,
    message: 'Unknown resource',
    result: null,
  };

  // Parse event.path to pick up the path elements and verb
  const pathElements = event.requestContext.http.path.substring(1).split('/');
  const queryParams = event.queryStringParameters;
  const verb = event.requestContext.http.method;

  // First path element identifies the resource
  switch (pathElements[0]) {
    case 'run_groups':
      try {
        api_result = await handleRunGroups(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleRunGroups ', e);
      }
      break;

    case 'assets':
      try {
        api_result = await handleAssets(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleAssets ', e);
      }
      break;

    case 'asset_types':
      try {
        api_result = await handleAssetTypes(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleAssetTypes ', e);
      }
      break;

    case 'reference':
      try {
        api_result = await handleReference(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleReference ', e);
      }
      break;

    case 'tags':
      try {
        api_result = await handleTags(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleTags ', e);
      }
      break;

    case 'custom_fields':
      try {
        api_result = await handleCustomFields(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleTags ', e);
      }
      break;

    case 'owners':
      try {
        api_result = await handleOwners(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleOwners ', e);
      }
      break;

    case 'about':
      try {
        api_result = await handleAbout();
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in handleAbout ', e);
      }
      break;

    case 'execute_etl':
      try {
        api_result = await handleExecuteETL(event, pathElements, queryParams || {}, verb, db);
      } catch (e) {
        api_result.message = e;
        api_result.statusCode = 500;
        console.log('Error in execute_etl ', e);
      }
      break;
      
    default:
      console.log('Unknown path ', pathElements[0]);
      break;
  }
  let bodyJSON = {};
  if (api_result.result) {
    bodyJSON = api_result.result;
  }
  if (api_result.message) {
    bodyJSON.message = api_result.message.message || api_result.message;
  }
  let retvalue = {
    statusCode: api_result.statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyJSON)
  };
  return retvalue;
}
