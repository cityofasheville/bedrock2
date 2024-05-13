/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
  }
}

async function getInfo(client, pathElements) {
  const sql = 'SELECT * FROM bedrock.custom_fields where id like $1';
  let res;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error('Custom field not found');
  }
  return res.rows[0];
}

async function getAssetInfo(client, pathElements) {
  const sql = 'SELECT * FROM bedrock.asset_type_custom_fields where custom_field_id like $1';
  let res;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount === 0) {
    throw new Error('Associated asset type not found');
  }
  return res.rows[0];
}

async function getCustomField(pathElements, queryParams, connection) {
  const response = {
    error: false,
    message: '',
    result: null,
  };

  let client;
  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    response.result = await getInfo(client, pathElements);
    assetTypeInfo = await getAssetInfo(client, pathElements);
    response.result.asset_type_id = assetTypeInfo.asset_type_id
    response.result.required = assetTypeInfo.required
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }

}

module.exports = getCustomField;
