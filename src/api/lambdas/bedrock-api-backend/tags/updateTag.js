/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  newClient, checkInfo, checkExistence, updateInfo,
} from '../utilities/utilities.js';

async function updateTag(
  connection,
  allFields,
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
    console.log('before updateInfo')
    response.result = await updateInfo(client, allFields, body, tableName, idField, idValue, name);
    console.log('after updateInfo')
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

export default updateTag;
