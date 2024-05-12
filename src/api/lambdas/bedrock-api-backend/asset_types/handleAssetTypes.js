/* eslint-disable no-console */
const getAssetTypeList = require('./getAssetTypeList');
const getAssetType = require('./getAssetType');
const addAssetType = require('./addAssetType');
const updateAssetType = require('./updateAssetType');
const deleteAssetType = require('./deleteAssetType');

// eslint-disable-next-line no-unused-vars
async function handleAssetTypes(
  event,
  pathElements,
  queryParams,
  verb,
  connection,
) {
  let result = {
    error: false,
    message: '',
    result: null,
  };
  let nParams = pathElements.length;
  if (nParams == 2 && (pathElements[1] === null || pathElements[1].length == 0)) nParams = 1;

  switch (nParams) {
    // GET asset_type
    case 1:
      result = await getAssetTypeList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
      );
      break;

    // VERB asset_type/{id}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getAssetType(pathElements, queryParams, connection);
          break;

        case 'POST':
          result = await addAssetType(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'PUT':
          result = await updateAssetType(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'DELETE':
          result = deleteAssetType(pathElements, queryParams, connection);
          break;

        default:
          result.message = `handleAssetType: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown rungroups endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

module.exports = handleAssetTypes;
