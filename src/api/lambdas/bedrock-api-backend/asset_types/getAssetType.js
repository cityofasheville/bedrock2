/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, getInfo } from '../utilities/utilities.js';
import { getCustomFieldsInfo } from '../utilities/assetUtilities.js'
import pgErrorCodes from '../pgErrorCodes.js';

function formatCustomFields(baseCustomFields, ancestorCustomFields) {
  // return arr.map((item) => ({
  //   [item.custom_field_id]: item.required,
  // }));
  console.log(baseCustomFields)
  console.log(ancestorCustomFields)

  const combinedCustomFields = new Map();

  // Adding all base customfields to combinedCustomFields
  for (const [key, value] of baseCustomFields) {
    combinedCustomFields.set(key, { ...value, inherited: false });
  }

  // Process MapB and merge with baseCustomFields
  for (const [key, value] of ancestorCustomFields) {
    if (combinedCustomFields.has(key)) {
      // Key exists in both maps
      const existingValue = combinedCustomFields.get(key);
      combinedCustomFields.set(key, {
        ...existingValue,
        ...value,
        inherited: true,
        required: existingValue.required || value.required
      });
    } else {
      // Key only exists in MapB
      combinedCustomFields.set(key, { ...value, inherited: true });
    }
  }

  console.log(combinedCustomFields)

  return combinedCustomFields;
}



async function getBaseCustomFieldsInfo(client, idField, idValue, name, tableName) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  let customFields = new Map();
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  res.rows.forEach((itm) => {
    customFields.set(itm.custom_field_id, itm);
  });
  console.log('loggin customFields')
  console.log(customFields)

  return customFields;
}

function calculateInherited() {
  return 'boo'
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
    const allCustomFieldsResponse = await getCustomFieldsInfo(client, idValue)

    calculateInherited()
    response.result.custom_fields = formatCustomFields(customFieldsResponse, allCustomFieldsResponse);
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
