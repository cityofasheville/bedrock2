/* eslint-disable no-console */
const { newClient, getInfo } = require('../utilities/utilities');

async function getTag(pathElements, queryParams, connection) {
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const idValue = pathElements[1];
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    response.result = await getInfo(client, idField, idValue, name, tableName);
    await client.end();
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

module.exports = getTag;
