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

async function checkInfo(body, id) {
  // Make sure that the custom field name in the body, if there, matches the path
  if ('id' in body && body.id !== id) {
    throw new Error(`Custom field id ${id} in path does not match custom field id ${body.id} in body`);
  }
}

async function checkExistence(client, id) {
  // Verify that the custom field exists
  const sql = 'SELECT * FROM bedrock.custom_fields where id like $1';
  let res;
  try {
    res = await client.query(sql, [id]);
  } catch (error) {
    throw new Error(`PG error verifying that custom field exists: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error(`Custom fiel like ${id} does not exist`);
  }
}

async function baseInsert(client, body, id) {
  const members = ['field_display', 'field_type', 'field_data'];
  let cnt = 1;
  const args = [];
  const custom_field = new Map()
  let sql = 'UPDATE custom_fields SET ';

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      args.push(body[members[i]]);
      custom_field.set(members[i], body[members[i]]);
      cnt += 1;
      comma = ',';
    }
  }
  sql += ` where id = $${cnt}`;
  console.log(` where id = $${cnt}`);
  args.push(id);
  console.log(sql);
  console.log(JSON.stringify(args));
  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating custom_fields table: ${pgErrorCodes[error.code]}`);
  }

  return custom_field;
}

async function assetTypeInsert(client, body, id) {
  const members = ['asset_type_id', 'required'];
  let cnt = 1;
  const args = [];
  const asset_type_info = new Map()
  let sql = 'UPDATE asset_type_custom_fields SET ';

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      args.push(body[members[i]]);
      asset_type_info.set(members[i], body[members[i]]);
      cnt += 1;
      comma = ',';
    }
  }
  sql += ` where custom_field_id = $${cnt}`;
  console.log(` where custom_field_id = $${cnt}`);
  args.push(id);
  console.log(sql);
  console.log(JSON.stringify(args));
  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating asset_type_custom_field table: ${pgErrorCodes[error.code]}`);
  }

  return asset_type_info;
}

async function updateCustomField(requestBody, pathElements, queryParams, connection) {
  const id = pathElements[1];
  const body = JSON.parse(requestBody);
  let client;
  let custom_field;
  const response = {
    error: false,
    message: `Successfully updated custom field ${id}`,
    result: null,
  };

  try {
    await checkInfo(body, id);
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.query('BEGIN');

  try {
    await checkExistence(client, id);
    custom_field = await baseInsert(client, body, id);
    response.result = Object.fromEntries(custom_field.entries());
    asset_type_info = await assetTypeInsert(client, body, id)
    asset_type_info.forEach((value, key) => {
      response.result[key] = value;
    });
    // response.result.asset_type_id = asset_type_info.asset_type_id
    // response.result.required = asset_type_info.required
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

module.exports = updateCustomField;
