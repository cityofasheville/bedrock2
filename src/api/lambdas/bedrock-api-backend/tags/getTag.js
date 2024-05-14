/* eslint-disable no-console */
const { newClient, getInfo } = require('../utilities/utilities');

async function getTag(pathElements, queryParams, connection) {
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const idValue = pathElements[1];
  let client;

  const response = {
    error: false,
    message: '',
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
    response.result = await getInfo(client, idField, idValue, name, tableName);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

module.exports = getTag;
