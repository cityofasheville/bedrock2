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

async function checkInfo(body, tagName) {
  // Make sure that the tag name in the body, if there, matches the path
  if ('tag_name' in body && body.tag_name !== tagName) {
    throw new Error(`Tag name ${tagName} in path does not match tag name ${body.tag_name} in body`);
  }
}

async function checkExistence(client, tagName) {
  // Verify that the tag exists
  const sql = 'SELECT * FROM bedrock.tags where tag_name like $1';
  let res;
  try {
    res = await client.query(sql, [tagName]);
  } catch (error) {
    throw new Error(`PG error verifying that tag exists: ${
      pgErrorCodes[error.code]
    }`);
  }

  if (res.rowCount === 0) {
    throw new Error(`Tag like ${tagName} does not exist`);
  }
}

async function baseInsert(client, body, tagName) {
  const members = ['display_name'];
  let cnt = 1;
  const args = [];
  const tag = new Map()
  let sql = 'UPDATE tags SET ';

  for (let i = 0, comma = ''; i < members.length; i += 1) {
    if (members[i] in body) {
      sql += `${comma} ${members[i]} = $${cnt}`;
      args.push(body[members[i]]);
      tag.set(members[i], body[members[i]]);
      cnt += 1;
      comma = ',';
    }
  }
  sql += ` where tag_name = $${cnt}`;
  console.log(` where tag_name = $${cnt}`);
  args.push(tagName);
  console.log(sql);
  console.log(JSON.stringify(args));
  try {
    await client.query(sql, args);
  } catch (error) {
    throw new Error(`PG error updating tag: ${pgErrorCodes[error.code]}`);
  }

  return tag;
}

async function updateTag(requestBody, pathElements, queryParams, connection) {
  const tagName = pathElements[1];
  const body = JSON.parse(requestBody);
  let client;
  let tagInfo;
  const response = {
    error: false,
    message: `Successfully updated tag ${tagName}`,
    result: null,
  };

  try {
    await checkInfo(body, tagName);
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, tagName);
    tagInfo = await baseInsert(client, body, tagName);
    response.result = Object.fromEntries(tagInfo.entries());
  } catch (error) {
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
    return response;
  }
}

module.exports = updateTag;
