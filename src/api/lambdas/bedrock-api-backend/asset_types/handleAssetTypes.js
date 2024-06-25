/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getAssetTypeList from './getAssetTypeList.js';
import getAssetType from './getAssetType.js';
import addAssetType from './addAssetType.js';
import updateAssetType from './updateAssetType.js';
import deleteAssetType from './deleteAssetType.js';
/* eslint-disable no-console */

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
  const idField = 'asset_type_id';
  let idValue;
  const name = 'asset type';
  const tableName = 'bedrock2.asset_types';
  const requiredFields = ['asset_type_id', 'asset_type_name'];
  const allFields = ['asset_type_id', 'asset_type_name', 'parent'];
  const tableNameCustomFields = 'bedrock2.asset_type_custom_fields';

  if (nParams === 2 && (pathElements[1] === null || pathElements[1].length === 0)) nParams = 1;
  if ('body' in event) {
    body = JSON.parse(event.body);
  }
  console.log(pathElements);
  if (!(pathElements[1] == null)) {
    [, idValue] = pathElements;
  } else if (body) { // For POST requests, setting idValue here since it's not in the path
    idValue = body[idField];
  }

  switch (nParams) {
    // GET asset_type
    case 1:
      switch (verb) {
        case 'GET':
          result = await getAssetTypeList(
            event.requestContext.domainName,
            pathElements,
            queryParams,
            connection,
            idField,
            name,
            tableName,
            tableNameCustomFields,
          );
          break;

        case 'POST':
          result = await addAssetType(
            connection,
            allFields,
            body,
            idField,
            name,
            tableName,
            tableNameCustomFields,
            requiredFields,
          );
          break;

        default:
          result.message = `Unknown asset types endpoint: [${pathElements.join()}]`;
          result.error = true;
          break;
      }
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
            tableNameCustomFields,
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
            tableNameCustomFields,
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
            tableNameCustomFields,
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

export default handleAssetTypes;
