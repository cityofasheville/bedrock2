/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, updateInfo,
} = require('../utilities/utilities');

async function updateTag(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  let client;
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const requiredFields = ['tag_name', 'display_name'];
  const tagShouldExist = true;
  const idValue = pathElements[1];

  let tagInfo;
  const response = {
    error: false,
    message: `Successfully updated tag ${idValue}`,
    result: null,
  };

  try {
    checkInfo(body, requiredFields, name, idValue);
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, tableName, idField, idValue, name, tagShouldExist);
    tagInfo = await updateInfo(client, body, tableName, idField, idValue, name);
    response.result = Object.fromEntries(tagInfo.entries());
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

module.exports = updateTag;
