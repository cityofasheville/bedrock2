/* eslint-disable no-console */
import {
  newClient, checkExistence, deleteInfo,
} from '../utilities/utilities.js';

async function deleteRunGroup(
  connection,
  idField,
  idValue,
  name,
  tableName,
) {
  const shouldExist = true;
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: `Successfully deleted ${name} ${idValue}`,
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

export default deleteRunGroup;
