/* eslint-disable no-console */

// eslint-disable-next-line no-unused-vars
function getAsset (pathElements, queryParams, connection) {
  let ok = true;
  let message = '';
  let result = {
    name: 'ad_info',
    location: 'mdastore1',
    active: true,
    type: 'table',
    description: 'Active Directory info',
    depends: [],
  };
  return result;
}

// eslint-disable-next-line no-unused-vars
function handleAssets(event, pathElements, queryParams, verb, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };

  switch (pathElements.length) {
    // GET assets
    case 1:
      result.message = 'Get all assets not yet implemented';
      result.error = true;
      break;

    // VERB assets/{assetname}
    case 2:
      switch (verb) {
        case 'GET':
          result.result = getAsset(pathElements, queryParams, connection);
          break;

        case 'POST':
          result.message = 'Add asset not implemented';
          result.error = true;
          break;

        case 'PUT':
          result.message = 'Update asset not implemented';
          result.error = true;
          break;

        case 'DELETE':
          result.message = 'Delete asset not implemented';
          result.error = true;
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
          result.message = 'Get asset tasks not implemented';
          result.error = true;
        } else if (verb === 'DELETE') {
          result.message = 'Delete all asset tasks not implemented';
          result.error = true;
        }
      } else if (pathElements[2] === 'depends') {
        result.message = 'Get asset depends not implemented';
        result.error = true;
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
    console.log(result.message);
  }
  return result;
}

module.exports = handleAssets;
