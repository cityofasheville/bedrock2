/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { getInfo, getBaseCustomFieldsInfo } from '../utilities/utilities.js';

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
  db,
  idField,
  idValue,
  name,
  tableName,
  tableNameCustomFields,
) {

  const response = {
    statusCode: 200,
    message: '',
    result: null,
  };

  response.result = await getInfo(db, idField, idValue, name, tableName);
  const customFieldsResponse = await getBaseCustomFieldsInfo(db, idField, idValue, name, tableNameCustomFields)
  response.result.custom_fields = simpleFormatCustomFields(customFieldsResponse);

  return response;
}

export default getAssetType;
