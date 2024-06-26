/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getAssetList from './getAssetList.js';
import getAsset from './getAsset.js';
import getAllAssetRelations from './getAllAssetRelations.js';
import addAsset from './addAsset.js';
import updateAsset from './updateAsset.js';
import deleteAsset from './deleteAsset.js';
import getTasks from './getTasks.js';
import updateTasks from './updateTasks.js';

// eslint-disable-next-line no-unused-vars
async function handleAssets(event, pathElements, queryParams, verb, connection) {
  let response = {
    error: false,
    message: '',
    result: null,
  };

  let nParams = pathElements.length;
  let body;
  const idField = 'asset_id';
  let idValue;
  const name = 'asset';
  const tableName = 'bedrock.assets';
  const requiredFields = ['asset_id', 'asset_name', 'description', 'location', 'active'];
  const allFields = ['asset_id', 'asset_name', 'description', 'location', 'active', 'asset_type_id', 'connection_class', 'location', 'link', 'owner_id', 'tags', 'notes', 'parents', 'etl_run_group', 'etl_active', 'custom_fields'];

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  } else if (body) { // For POST requests, setting idValue here since it's not in the path
    idValue = body[idField];
  }

  switch (pathElements.length) {
    // GET assets
    case 1:
      switch (verb) {
        case 'GET':
          response = await getAssetList(
            event.requestContext.domainName,
            pathElements,
            queryParams,
            connection,
            tableName,
          );
          break;

        case 'POST':
          response = await addAsset(
            connection,
            idField,
            name,
            tableName,
            requiredFields,
            body,
          );
          break;

        default:
          response.message = `handleAssets: unknown verb ${verb}`;
          response.error = true;
          break;
      }
      break;

    // VERB assets/{assetname}
    case 2:
      switch (verb) {
        case 'GET':
          response = await getAsset(
            queryParams,
            connection,
            idValue,
            allFields,
          );
          break;

        case 'PUT':
          response = await updateAsset(
            pathElements,
            queryParams,
            connection,
            idField,
            idValue,
            name,
            tableName,
            requiredFields,
            allFields,
            body,
          );
          break;

        case 'DELETE':
          response = deleteAsset(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          response.message = `handleAssets: unknown verb ${verb}`;
          response.error = true;
          break;
      }
      break;

    // GET/DELETE assets/{assetname}/tasks OR
    // GET assets/{assetname}/relations
    case 3:
      if (pathElements[2] === 'tasks') {
        if (verb === 'GET') {
          response = await getTasks(connection, idValue, idField, name);
        } else if (verb === 'PUT') {
          response = await updateTasks(
            connection,
            idField,
            idValue,
            name,
            body,
          );
        } else {
          response.message = `${verb} all asset tasks not implemented`;
          response.error = true;
        }
      } else if (pathElements[2] === 'relations') {
        response = await getAllAssetRelations(
          connection,
          idValue,
          tableName,
        );
      } else {
        response.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        response.error = true;
      }
      break;

    // POST/PUT/DELETE assets/{assetname}/tasks/{taskPosition} OR
    // GET /bedrock/assets/search/{searchString}
    case 4:
      if (pathElements[1] === 'search') {
        response.message = 'Assets search not implemented';
        response.error = true;
      } else if (pathElements[2] === 'tasks') {
        switch (verb) {
          case 'POST':
            response.message = 'Add asset task not implemented';
            response.error = true;
            break;

          case 'DELETE':
            response.message = 'Delete asset task not implemented';
            response.error = true;
            break;

          default:
            response.message = `handleAssets: unknown verb ${verb}`;
            response.error = true;
            break;
        }
      } else {
        response.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        response.error = true;
      }
      break;

    default:
      response.message = `Unknown assets endpoint: [${pathElements.join()}]`;
      response.error = true;
      break;
  }
  if (response.error) {
    console.log(`We have an error but do not know why! - ${response.message}`);
  }
  return response;
}

export default handleAssets;
