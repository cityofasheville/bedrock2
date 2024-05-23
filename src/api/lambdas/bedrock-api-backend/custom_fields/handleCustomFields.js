/* eslint-disable import/extensions */
/* eslint-disable no-console */
import getCustomFieldList from './getCustomFieldList.js';
import getCustomField from './getCustomField.js';
import addCustomField from './addCustomField.js';
import updateCustomField from './updateCustomField.js';
import deleteCustomField from './deleteCustomField.js';

async function handleCustomFields(
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
  const name = 'custom_field';
  const tableName = 'custom_fields';
  const requiredFields = ['id', 'field_display', 'field_type', 'field_data'];
  const allFields = ['id', 'field_display', 'field_type', 'field_data'];

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
    // GET custom_fields
    case 1:
      switch (verb) {
        case 'GET':
          result = await getCustomFieldList(
            event.requestContext.domainName,
            pathElements,
            queryParams,
            connection,
            idField,
            name,
            tableName,
          );
          break;

        case 'POST':
          result = await addCustomField(
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

        default:
          result.message = `handleCustomFields: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;
    // VERB custom_fields/{id}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getCustomField(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        case 'PUT':
          result = await updateCustomField(
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
          result = deleteCustomField(
            connection,
            idField,
            idValue,
            name,
            tableName,
          );
          break;

        default:
          result.message = `handleCustomFields: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown custom fields endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

export default handleCustomFields;
