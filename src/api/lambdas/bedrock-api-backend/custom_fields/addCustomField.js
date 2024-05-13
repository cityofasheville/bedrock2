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

function checkInfo(body, pathElements) {
  if (!('id' in body) || !('field_display' in body) || !('field_type' in body) || !('field_data' in body) || !('asset_type_id' in body) || !('required' in body)) {
    throw new Error('Custom field lacks required property (one of field_display, field_type, or field_data)');
  }
  if (pathElements[1] !== body.id) {
    throw new Error(`Custom field id ${pathElements[1]} in path does not match custom field id ${body.id} in body`);
  }
}

async function checkExistence(client, pathElements) {
  const sql = 'SELECT * FROM bedrock.custom_fields where id like $1';
  let res;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount > 0) {
    throw new Error('Custom field already exists');
  }
}

async function baseInsert(client, body) {
  let res;

  try {
    res = await client
      .query(
        'INSERT INTO custom_fields (id, field_display, field_type, field_data) VALUES($1, $2, $3, $4)',
        [body.id, body.field_display, body.field_type, body.field_data],
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount !== 1) {
    throw new Error('Unknown error inserting new custom field');
  }

  return {
    id: body.id,
    field_display: body.field_display,
    field_type: body.field_type,
    field_data: body.field_data
  };
}

async function assetTypeInsert(client, body) {
  let res;

  try {
    res = await client
      .query(
        'INSERT INTO asset_type_custom_fields (asset_type_id, custom_field_id, required) VALUES($1, $2, $3)',
        [body.asset_type_id, body.id, body.required],
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount !== 1) {
    throw new Error('Unknown error inserting new custom field');
  }

  return {
    asset_type_id: body.asset_type_id,
    required: body.required,
  };
}

async function addCustomField(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  let client;
  let assetTypeInfo;

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
    checkInfo(body, pathElements);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.query('BEGIN');

  try {
    await checkExistence(client, pathElements);
    response.result = await baseInsert(client, body);
    assetTypeInfo = await assetTypeInsert(client, body)
    response.result.asset_type_id = assetTypeInfo.asset_type_id
    response.result.required = assetTypeInfo.required
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

module.exports = addCustomField;
