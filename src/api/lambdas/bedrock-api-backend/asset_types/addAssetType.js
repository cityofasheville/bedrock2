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
  if (!('id' in body) || !('name' in body)) {
    throw new Error('Asset type lacks required property (one of id or name)');
  }
  if (pathElements[1] !== body.id) {
    throw new Error(`Asset type id ${pathElements[1]} in path does not match asset type id ${body.id} in body`);
  }
}

async function checkExistence(client, pathElements) {
  const sql = 'SELECT * FROM bedrock.asset_types where id like $1';
  let res;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount > 0) {
    throw new Error('Asset type already exists');
  }
}

async function baseInsert(client, body) {
  let tempAssetType = null;
  let sql;
  let res;
  let argnum = 3;
  let args = [
    body.id,
    body.name
  ];
  sql = 'INSERT INTO asset_types (id, name';
  let vals = ') VALUES($1, $2';
  let fields = ['parent']

  for (let i = 0; i < fields.length; i += 1) {
    if (fields[i] in body) {
      sql += `, ${fields[i]}`;
      vals += `, $${argnum}`;
      args.push(body[fields[i]]);
      argnum += 1;
    }}

  sql += `${vals})`;
    console.log(sql)
    console.log(args)
  try {
    res = await client.query(sql, args);
  } catch (error) {
    throw new Error(
      `PG error adding new base asset: ${pgErrorCodes[error.code]}`,
    );
  }

  if (res.rowCount !== 1) {
    throw new Error('Unknown error inserting new asset');
  } else {
    tempAssetType = new Map([
      ['id', body.id],
      ['name', body.name],
    ]);
    for (let i = 0; i < fields.length; i += 1) {
      if (fields[0] in body) {
        tempAssetType.set(fields[0], body[fields[0]])
      }
  }}
  console.log(tempAssetType)
  return tempAssetType;
}

async function addAssetType(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  let client;
  let assetType;

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

  try {
    await checkExistence(client, pathElements);
    assetType = await baseInsert(client, body);
    response.result = Object.fromEntries(assetType.entries())
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }
}

module.exports = addAssetType;
