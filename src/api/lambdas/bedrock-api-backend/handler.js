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

// eslint-disable-next-line camelcase, import/prefer-default-export
export async function lambda_handler(event) {
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
    case 'run_groups':
      try {
        result = handleRunGroups(event, pathElements, queryParams || {}, verb, connection);
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

    case 'asset_types':
      try {
        result = await handleAssetTypes(event, pathElements, queryParams || {}, verb, connection);
      } catch (e) {
        result.message = e;
        console.log('Error in handleAssetTypes ', e);
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

    case 'custom_fields':
      try {
        result = await handleCustomFields(event, pathElements, queryParams || {}, verb, connection);
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
}
