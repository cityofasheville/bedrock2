/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, addInfo,
} = require('../utilities/utilities');

async function addAssetType(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  const name = 'asset type';
  const tableName = 'asset_types';
  const idField = 'id';
  const requiredFields = ['id', 'name'];
  const idValue = pathElements[1];
  const shouldExist = false;
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: `Successfully added ${name} ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    checkInfo(body, requiredFields, name, idValue, idField);
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    response.result = await addInfo(client, body, tableName, name);
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

module.exports = addAssetType;
