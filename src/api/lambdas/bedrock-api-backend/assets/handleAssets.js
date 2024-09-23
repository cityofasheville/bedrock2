/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getAssetList from './getAssetList.js';
import getAsset from './getAsset.js';
import getRelations from './getRelations.js';
import addAsset from './addAsset.js';
import updateAsset from './updateAsset.js';
import deleteAsset from './deleteAsset.js';
import getTasks from './getTasks.js';
import updateTasks from './updateTasks.js';
import getExpandedRelations from './getExpandedRelations.js';

// eslint-disable-next-line no-unused-vars
async function handleAssets(event, pathElements, queryParams, verb, db) {
  try {
  let response = {
    statusCode: 200,
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
  const allFields = ['asset_id', 'asset_name', 'description', 'location', 'active', 'asset_type_id', 'connection_class', 'location', 'link', 'owner_id', 'tags', 'notes', 'parents', 'custom_fields'];

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
            db,
            tableName,
          );
          break;

        case 'POST':
          response = await addAsset(
            db,
            idField,
            name,
            tableName,
            requiredFields,
            body,
          );
          break;

        default:
          response.message = `handleAssets: unknown verb ${verb}`;
          response.statusCode = 404;
          break;
      }
      break;

    // VERB assets/{assetname}
    case 2:
      switch (verb) {
        case 'GET':
          response = await getAsset(
            queryParams,
            db,
            idValue,
            allFields,
          );
          break;

        case 'PUT':
          response = await updateAsset(
            pathElements,
            queryParams,
            db,
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
          response = await deleteAsset(
            db,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          response.message = `handleAssets: unknown verb ${verb}`;
          response.statusCode = 404;
          break;
      }
      break;

    // GET/DELETE assets/{assetname}/tasks OR
    // GET assets/{assetname}/relations
    case 3:
      if (pathElements[2] === 'tasks') {
        if (verb === 'GET') {
          response = await getTasks(db, idValue, idField, name);
        } else if (verb === 'PUT') {
          response = await updateTasks(
            db,
            idField,
            idValue,
            name,
            body,
          );
        } else {
          response.message = `${verb} all asset tasks not implemented`;
          response.statusCode = 404;
        }
      } else if (pathElements[2] === 'relations') {
        response = await getRelations(
          db,
          idValue,
          tableName,
          idField,
          name
        );       
      } else if (pathElements[2] === 'expandedRelations') {
          response = await getExpandedRelations(
            db,
            idValue,
            tableName,
            idField,
            name
          );
      } else {
        response.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        response.statusCode = 404;
      }
      break;

    // POST/PUT/DELETE assets/{assetname}/tasks/{taskPosition} OR
    // GET /bedrock/assets/search/{searchString}
    case 4:
      if (pathElements[1] === 'search') {
        response.message = 'Assets search not implemented';
        response.statusCode = 404;
      } else if (pathElements[2] === 'tasks') {
        switch (verb) {
          case 'POST':
            response.message = 'Add asset task not implemented';
            response.statusCode = 404;
            break;

          case 'DELETE':
            response.message = 'Delete asset task not implemented';
            response.statusCode = 404;
            break;

          default:
            response.message = `handleAssets: unknown verb ${verb}`;
            response.statusCode = 404;
            break;
        }
      } else {
        response.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        response.statusCode = 404;
      }
      break;

    default:
      response.message = `Unknown assets endpoint: [${pathElements.join()}]`;
      response.statusCode = 404;
      break;
  }
  if (response.statusCode !== 200) {
    console.log(`We have an error but do not know why! - ${response.message}`);
  }
  return response;
} catch (e) {
  return {
    statusCode: 500,
    message: e,
    result: null,
  };
}
}

export default handleAssets;
