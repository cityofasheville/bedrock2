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
  let body;
  const idField = 'id';
  let idValue;
  const name = 'asset type';
  const tableName = 'asset_types';
  const requiredFields = ['id', 'name'];
  const allFields = ['id', 'name', 'parent'];

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  console.log(pathElements);
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  }

  switch (nParams) {
    // GET asset_type
    case 1:
      result = await getAssetTypeList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
        idField,
        name,
        tableName,
      );
      break;

    // VERB asset_type/{id}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getAssetType(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'POST':
          result = await addAssetType(
            connection,
            allFields,
            body,
            idField,
            idValue,
            name,
            tableName,
            requiredFields,
          );
          break;

        case 'PUT':
          result = await updateAssetType(
            connection,
            allFields,
            body,
            idField,
            idValue,
            name,
            tableName,
            requiredFields,
          );
          break;

        case 'DELETE':
          result = deleteAssetType(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          result.message = `handleAssetType: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown asset types endpoint: [${pathElements.join()}]`;
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
