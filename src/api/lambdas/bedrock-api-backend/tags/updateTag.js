/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, updateInfo,
} = require('../utilities/utilities');

async function updateTag(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const requiredFields = ['tag_name', 'display_name'];
  const allFields = ['tag_name', 'display_name'];
  const tagShouldExist = true;
  const idValue = pathElements[1];
  let client;
  let clientInitiated = false;

  let tagInfo;
  const response = {
    error: false,
    message: `Successfully updated tag ${idValue}`,
    result: null,
  };

  try {
    checkInfo(body, requiredFields, name, idValue, idField);
    client = await newClient(connection);
    clientInitiated = true;
    await checkExistence(client, tableName, idField, idValue, name, tagShouldExist);
    tagInfo = await updateInfo(client, body, tableName, idField, idValue, name, allFields);
    response.result = Object.fromEntries(tagInfo.entries());
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

module.exports = updateTag;
