/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, getInfo, capitalizeFirstLetter } from '../utilities/utilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

function formatCustomFields(arr) {
  return arr.map((item) => ({
    [item.custom_field_id]: item.required,
  }));
}

async function getCustomFieldsInfo(client, idField, idValue, name, tableName) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]||error.code}`, error]);
  }

  return res.rows;
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
    const customFieldsResponse = await getCustomFieldsInfo(client, idField, idValue, name, tableNameCustomFields);
    response.result.custom_fields = formatCustomFields(customFieldsResponse);
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
