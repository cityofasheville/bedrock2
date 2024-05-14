/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, insertInfo,
} = require('../utilities/utilities');

async function addTag(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const requiredFields = ['tag_name', 'display_name'];
  const allFields = ['tag_name', 'display_name'];
  const idValue = pathElements[1];
  const tagShouldExist = false;
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: `Successfully added tag ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    checkInfo(body, requiredFields, name, idValue);
    await checkExistence(client, tableName, idField, idValue, name, tagShouldExist);
    response.result = await insertInfo(client, body, allFields, tableName, name);
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

module.exports = addTag;
