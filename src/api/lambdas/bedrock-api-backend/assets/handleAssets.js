/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getAssetList from './getAssetList.js';
import getAsset from './getAsset.js';
import getAllAssetRelations from './getAllAssetRelations.js';
import addAsset from './addAsset.js';
import updateAsset from './updateAsset.js';
import deleteAsset from './deleteAsset.js';
import getTasks from './getTasks.js';

// eslint-disable-next-line no-unused-vars
async function handleAssets(event, pathElements, queryParams, verb, connection) {
  let response = {
    error: false,
    message: '',
    result: null,
  };

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
          );
          break;

        case 'POST':
          response = await addAsset(event.body, connection);
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
          response = await getAsset(pathElements, queryParams, connection);
          break;

        case 'PUT':
          response = await updateAsset(event.body, pathElements, queryParams, connection);
          break;

        case 'DELETE':
          response = deleteAsset(pathElements, queryParams, connection);
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
          response = await getTasks(pathElements, queryParams, connection);
        } else if (verb === 'DELETE') {
          response.message = 'Delete all asset tasks not implemented';
          response.error = true;
        }
      } else if (pathElements[2] === 'relations') {
        response = await getAllAssetRelations(pathElements, queryParams, connection);
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

          case 'PUT':
            response.message = 'Update asset task not implemented';
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
