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

async function checkExistence(client, tagName) {
  // Check that tag exists
  const sql = 'SELECT * FROM bedrock.tags where tag_name like $1';
  let res;
  try {
    res = await client.query(sql, [tagName]);
  } catch (error) {
    throw new Error(`PG error getting tag for delete: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error('Tag not found');
  }
}

async function baseDelete(client, tagName) {

  try {
    await client
      .query('delete from tags where tag_name = $1', [
        tagName,
      ]);
  } catch (error) {
    throw new Error(`PG error deleting tag display name: ${pgErrorCodes[error.code]}`);
  }
}

async function deleteTag(pathElements, queryParams, connection) {
  const tagName = pathElements[1];
  let client;
  const response = {
    error: false,
    message: `Successfully deleted tag ${tagName}`,
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
    await checkExistence(client, tagName);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    await client.end();
    return response;
  }

  try {
    await baseDelete(client, tagName);
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }

}

module.exports = deleteTag;
