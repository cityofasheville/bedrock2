/* eslint-disable no-console */
const {
  newClient, checkExistence, deleteInfo,
} = require('../utilities/utilities');

async function deleteTag(pathElements, queryParams, connection) {
  const name = 'tag';
  const tableName = 'tags';
  const idField = 'tag_name';
  const idValue = pathElements[1];
  let client;
  const shouldExist = true;

  const response = {
    error: false,
    message: `Successfully deleted tag ${idValue}`,
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
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    await client.end();
    return response;
  }

  try {
    await deleteInfo(client, tableName, idField, idValue, name);
    console.log('no error i swear');
  } catch (error) {
    response.error = true;
    response.message = error.message;
    await client.end();
    return response;
  }
  await client.end();
  return response;
}

module.exports = deleteTag;
