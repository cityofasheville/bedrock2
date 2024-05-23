/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { customAlphabet } from 'nanoid';
import {
  newClient, checkInfo, checkExistence, addInfo,
} from '../utilities/utilities.js';

function generateId() {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 16);
  const thisID = nanoid();
  return thisID;
}

async function addOwner(
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
  body.owner_id = generateId();
  idValue = body.owner_id;

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

export default addOwner;
