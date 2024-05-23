/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, getInfo } from '../utilities/utilities.js';

async function getOwner(
  connection,
  idField,
  idValue,
  name,
  tableName,
) {
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: '',
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    response.result = await getInfo(client, idField, idValue, name, tableName);
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

export default getOwner;
