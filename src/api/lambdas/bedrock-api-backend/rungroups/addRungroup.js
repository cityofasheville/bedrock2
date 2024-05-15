/* eslint-disable no-console */
const {
  newClient, checkInfo, checkExistence, addInfo,
} = require('../utilities/utilities');

async function addRungroup(requestBody, pathElements, queryParams, connection) {
  const body = JSON.parse(requestBody);
  const name = 'run group';
  const tableName = 'run_groups';
  const idField = 'run_group_name';
  const requiredFields = ['run_group_name', 'cron_string'];
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

module.exports = addRungroup;
