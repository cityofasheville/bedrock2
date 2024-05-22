/* eslint-disable no-console */
import { newClient, getInfo, capitalizeFirstLetter } from '../utilities/utilities.js';
import pgErrorCodes from '../pgErrorCodes.js';

async function getCustomFieldsInfo(client, idField, idValue, name, tableName) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = `SELECT * FROM bedrock.${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error(`${capitalizeFirstLetter(name)} not found`);
  }
  console.log(`this is ${JSON.stringify(res)}`);
  return res.rows;
}

function formatCustomFields(arr) {
  return arr.map((item) => ({
    [item.custom_field_id]: item.required,
  }));
}

async function getAssetType(
  connection,
  idField,
  idValue,
  name,
  tableName,
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
    const customFieldsResponse = await getCustomFieldsInfo(client, 'asset_type_id', idValue, name, 'asset_type_custom_fields');
    response.result.custom_fields = formatCustomFields(customFieldsResponse);
    await client.end();
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

export default getAssetType;
