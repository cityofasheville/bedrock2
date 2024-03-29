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

async function checkInfo(body, rungroupName) {
  // Make sure that the rungroup name in the body, if there, matches the path
  if ('run_group_name' in body && body.run_group_name !== rungroupName) {
    throw new Error(`Rungroup name ${rungroupName} in path does not match rungroup name ${body.run_group_name} in body`);
  }
}

async function checkExistence(client, rungroupName) {
  // Verify that the rungroup exists
  const sql = 'SELECT * FROM bedrock.run_groups where run_group_name like $1';
  let res;
  try {
    res = await client.query(sql, [rungroupName]);
  } catch (error) {
    throw new Error(`PG error verifying that rungroup exists: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error(`Rungroup like ${rungroupName} does not exist`);
  }
}

async function baseInsert(client, body, rungroupName) {
  let result;
  const members = ['cron_string'];
  let cnt = 1;
  const args = [];
  let sql = 'UPDATE run_groups SET ';

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      args.push(body[members[i]]);
      result[members[i]] = body[members[i]];
      cnt += 1;
      comma = ',';
    }
  }
  sql += ` where run_group_name = $${cnt}`;
  console.log(` where run_group_name = $${cnt}`);
  args.push(rungroupName);
  console.log(sql);
  console.log(JSON.stringify(args));
  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating rungroup: ${pgErrorCodes[error.code]}`);
  }

  return result;
}

async function updateRungroup(requestBody, pathElements, queryParams, connection) {
  const rungroupName = pathElements[1];
  const body = JSON.parse(requestBody);
  let client;
  const result = {
    error: false,
    message: `Successfully updated asset ${rungroupName}`,
    result: null,
  };

  try {
    await checkInfo(body, rungroupName);
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    await checkExistence(client, rungroupName);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    await client.end();
    return result;
  }
  try {
    await client.query('BEGIN');
    result.result = await baseInsert(client, body, rungroupName);
    await client.query('COMMIT');
    await client.end();
  } catch (error) {
    await client.query('ROLLBACK');
    await client.end();
    result.error = true;
    result.message = error.message;
  }

  return result;
}

module.exports = updateRungroup;
