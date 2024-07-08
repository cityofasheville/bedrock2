/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, getInfo, formatCustomFields, getAncestorCustomFieldsInfo, getBaseCustomFieldsInfo } from '../utilities/utilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

function simpleFormatCustomFields(customFieldsResponse) {
  let formattedCustomFields = [];

  customFieldsResponse.forEach((value, key) => {
    formattedCustomFields.push({
      custom_field_id: value.custom_field_id,
      required: value.required
    });
  });

  return formattedCustomFields;
}

async function getAssetType(
  connection,
  idField,
  idValue,
  name,
  tableName,
  tableNameCustomFields,
) {
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: '',
    result: null,
  };


  try {
    client = await newClient(connection);
    clientInitiated = true;
    response.result = await getInfo(client, idField, idValue, name, tableName);
    const customFieldsResponse = await getBaseCustomFieldsInfo(client, idField, idValue, name, tableNameCustomFields);
    // const ancestorCustomFields = await getAncestorCustomFieldsInfo(client, idValue)
    console.log('customfieldsresopnse:')
    console.log(customFieldsResponse)
    // response.result.custom_fields = formatCustomFields(customFieldsResponse, ancestorCustomFields);
    response.result.custom_fields = simpleFormatCustomFields(customFieldsResponse);
    await client.end();
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
    response.result = null;
    return response;
  }
  return response;
}

export default getAssetType;
