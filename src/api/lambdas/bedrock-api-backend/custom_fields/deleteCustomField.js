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

async function checkExistence(client, id) {
  // Check that custom field exists
  const sql = 'SELECT * FROM bedrock.custom_fields where id like $1';
  let res;
  try {
    res = await client.query(sql, [id]);
  } catch (error) {
    throw new Error(`PG error getting custom field for delete: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error('Custom field not found');
  }
}

async function baseDelete(client, id) {

  try {
    await client
      .query('delete from custom_fields where id = $1', [
        id,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting data from custom_fields table: ${pgErrorCodes[error.code]}`);
  }
}

async function assetTypeDelete(client, id) {

  try {
    await client
      .query('delete from asset_type_custom_fields where custom_field_id = $1', [
        id,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting data from asset_type_custom_fields table: ${pgErrorCodes[error.code]}`);
  }
}

async function deleteCustomField(pathElements, queryParams, connection) {
  const id = pathElements[1];
  let client;
  const response = {
    error: false,
    message: `Successfully deleted custom field ${id}`,
    result: null,
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, id);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    await client.end();
    return response;
  }

  await client.query('BEGIN');

  try {
    await baseDelete(client, id);
    await assetTypeDelete(client, id)
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }

}

module.exports = deleteCustomField;
