/* eslint-disable no-console */
import {
  newClient, checkInfo, checkExistence, addInfo,
} from '../utilities/utilities.js';

async function addRunGroup(
  connection,
  allFields,
  body,
  idField,
  idValue,
  name,
  tableName,
  requiredFields,
) {
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
    response.result = await addInfo(client, allFields, body, tableName, name);
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

export default addRunGroup;
