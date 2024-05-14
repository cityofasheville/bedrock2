/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, insertInfo,
} = require('../utilities/utilities');

async function addTag(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  let client;
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const requiredFields = ['tag_name', 'display_name'];
  const allFields = ['tag_name', 'display_name'];
  const idValue = pathElements[1];
  const tagShouldExist = false;

  const response = {
    error: false,
    message: `Successfully added tag ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    checkInfo(body, requiredFields, name, idValue);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, tableName, idField, idValue, name, tagShouldExist);
    response.result = await insertInfo(client, body, allFields, tableName, name);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

module.exports = addTag;
