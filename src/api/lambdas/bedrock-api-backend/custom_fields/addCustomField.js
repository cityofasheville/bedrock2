/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  newClient, checkInfo, checkExistence, addInfo, generateId,
} from '../utilities/utilities.js';

async function addCustomField(
  connection,
  allFields,
  body,
  idField,
  name,
  tableName,
  requiredFields,
) {
  const shouldExist = false;
  let client;
  body.id = generateId();
  const idValue = body.id;

  const response = {
    error: false,
    message: `Successfully added ${name} ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    checkInfo(body, requiredFields, name, idValue, idField);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    checkInfo(body, requiredFields, name, idValue, idField);
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    response.result = await addInfo(client, allFields, body, tableName, idField, idValue, name);
    console.log('finished first insert');
    await client.end();
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

export default addCustomField;
