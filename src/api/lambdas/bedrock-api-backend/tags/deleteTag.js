/* eslint-disable no-console */
const {
  newClient, checkExistence, deleteInfo,
} = require('../utilities/utilities');

async function deleteTag(pathElements, queryParams, connection) {
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const idValue = pathElements[1];
  const shouldExist = true;
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: `Successfully deleted tag ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    await deleteInfo(client, tableName, idField, idValue, name);
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

module.exports = deleteTag;
