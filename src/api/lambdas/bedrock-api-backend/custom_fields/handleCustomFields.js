/* eslint-disable no-console */
const getCustomFieldList = require('./getCustomFieldList');
const getCustomField = require('./getCustomField');
const addCustomField = require('./addCustomField');
const updateCustomField = require('./updateCustomField');
const deleteCustomField = require('./deleteCustomField');

// eslint-disable-next-line no-unused-vars
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
  if (nParams == 2 && (pathElements[1] === null || pathElements[1].length == 0)) nParams = 1;

  switch (nParams) {
    // GET custom_fields
    case 1:
      result = await getCustomFieldList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection,
      );
      break;

    // VERB custom_fields/{id}
    case 2:
      switch (verb) {
        case 'GET':
          result = await getCustomField(pathElements, queryParams, connection);
          break;

        case 'POST':
          result = await addCustomField(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'PUT':
          result = await updateCustomField(
            event.body,
            pathElements,
            queryParams,
            connection,
          );
          break;

        case 'DELETE':
          result = deleteCustomField(pathElements, queryParams, connection);
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

module.exports = handleCustomFields;
