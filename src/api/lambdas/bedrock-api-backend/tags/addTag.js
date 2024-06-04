/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  newClient, checkInfo, checkExistence, addInfo, generateId,
} from '../utilities/utilities.js';

async function addTag(
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
  let clientInitiated = false;
  const bodyWithID = {
    ...body,
    tag_name: generateId(),
  };
  const idValue = bodyWithID.tag_name;

  const response = {
    error: false,
    message: `Successfully added ${name} ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    checkInfo(bodyWithID, requiredFields, name, idValue, idField);
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    response.result = await addInfo(client, allFields, bodyWithID, tableName, name);
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

export default addTag;
