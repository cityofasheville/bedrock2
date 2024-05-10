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

async function checkInfo(body, pathElements) {
  if (!('tag_name' in body) || !('display_name' in body)) {
    throw new Error('Tag lacks required property (one of tag_name or display_name)');
  }
  if (pathElements[1] !== body.tag_name) {
    throw new Error(`Tag name ${pathElements[1]} in path does not match tag name ${body.tag_name} in body`);
  }
}

async function checkExistence(client, pathElements) {
  const sql = 'SELECT * FROM bedrock.tags where tag_name like $1';
  let res;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount > 0) {
    throw new Error('Tag already exists');
  }
}

async function baseInsert(client, body) {
  let res;

  try {
    res = await client
      .query(
        'INSERT INTO tags (tag_name, display_name) VALUES($1, $2)',
        [body.tag_name, body.display_name],
      );
  } catch (error) {
    throw new Error([`Postgres error: ${pgErrorCodes[error.code]}`, error]);
  }

  if (res.rowCount !== 1) {
    throw new Error('Unknown error inserting new tag');
  }

  return {
    tag_name: body.tag_name,
    display_name: body.display_name,
  };
}

async function addTag(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  let client;

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
    response.result = await baseInsert(client, body);
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }
}

module.exports = addTag;
