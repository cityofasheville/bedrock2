/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkInfo, checkExistence, addInfo, generateId,
} from '../utilities/utilities.js';

async function addCustomField(
  client,
  allFields,
  body,
  idField,
  name,
  tableName,
  requiredFields,
) {
  const shouldExist = false;
  const bodyWithID = {
    ...body,
  };
  bodyWithID[idField] = generateId();
  const idValue = bodyWithID[idField];

  const response = {
    statusCode: 200,
    message: `Successfully added ${name} ${idValue}`,
    result: null,
  };

  checkInfo(bodyWithID, requiredFields, name, idValue, idField);
  await checkExistence(client, tableName, idField, idValue, name, shouldExist);
  response.result = await addInfo(client, allFields, bodyWithID, tableName, idField, idValue, name);

  return response;
}

export default addCustomField;
