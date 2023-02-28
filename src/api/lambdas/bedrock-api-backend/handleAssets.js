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
  let ok = true;
  let message = '';
  let result;

  switch (pathElements.length) {
    case 1:
      ok = false;
      message = 'Not yet implemented: GET /bedrock/assets [?rungroups=...][?/& period=...]';
      console.log(message);
      break;

    case 2: // Single asset
      if (verb === 'GET') {
        return getAsset(pathElements, queryParams, connection);
      }
      break;

    default:
      ok = false;
      message = `Unknown assets endpoint: ${JSON.stringify(pathElements)}`;
      break;
  }
  if (ok) {
    return result;
  }
  throw message;
}

module.exports = handleAssets;
