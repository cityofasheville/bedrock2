/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, updateInfo,
} = require('../utilities/utilities');

async function updateRungroup(
  connection,
  body,
  idField,
  idValue,
  name,
  tableName,
  requiredFields,
) {
  const shouldExist = true;
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: `Successfully updated ${name} ${idValue}`,
    result: null,
  };

  try {
    checkInfo(body, requiredFields, name, idValue, idField);
    client = await newClient(connection);
    clientInitiated = true;
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    response.result = await updateInfo(client, body, tableName, idField, idValue, name);
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

module.exports = updateRungroup;
