/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { newClient, getBaseCustomFieldsInfo, } from '../utilities/utilities.js';

async function getRichCustomFields(
  connection,
  idField,
  idValue,
  name,
  tableNameCustomFields,
) {
  let client;
  let clientInitiated = false;

  const response = {
    error: false,
    message: '',
    result: { items: null },
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    const customFieldsResponse = await getBaseCustomFieldsInfo(client, idField, idValue, name, tableNameCustomFields);
    response.result.items = Object.fromEntries(customFieldsResponse) || {};
    await client.end();
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
  }
  return response;
}

export default getRichCustomFields;
