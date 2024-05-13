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

function checkInfo(body, id) {
  // Make sure that the asset_type name in the body, if there, matches the path
  if ('id' in body && body.id !== id) {
    throw new Error(`Asset type id ${id} in path does not match asset type id ${body.id} in body`);
  }
}

async function checkExistence(client, id) {
  // Verify that the asset_type exists
  const sql = 'SELECT * FROM bedrock.asset_types where id like $1';
  let res;
  try {
    res = await client.query(sql, [id]);
  } catch (error) {
    throw new Error(`PG error verifying that asset_type exists: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error(`Asset type like ${id} does not exist`);
  }
}

async function baseInsert(client, body, id) {
  const members = ['name', 'parent'];
  let cnt = 1;
  const args = [];
  const asset_type = new Map()
  let sql = 'UPDATE asset_types SET ';

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      args.push(body[members[i]]);
      asset_type.set(members[i], body[members[i]]);
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
    throw new Error(`PG error updating asset_type: ${pgErrorCodes[error.code]}`);
  }

  return asset_type;
}

async function updateAssetType(requestBody, pathElements, queryParams, connection) {
  const id = pathElements[1];
  const body = JSON.parse(requestBody);
  let client;
  let assetType;
  const response = {
    error: false,
    message: `Successfully updated asset type ${id}`,
    result: null,
  };

  try {
    checkInfo(body, id);
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, id);
    assetType = await baseInsert(client, body, id);
    response.result = Object.fromEntries(assetType.entries());
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }
}

module.exports = updateAssetType;
