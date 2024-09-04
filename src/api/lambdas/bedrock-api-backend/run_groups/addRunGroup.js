/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkInfo, checkExistence, addInfo,
  generateId,
} from '../utilities/utilities.js';

async function addRunGroup(
  db,
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
  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  response.result = await addInfo(db, allFields, bodyWithID, tableName, name);

  return response;
}

export default addRunGroup;
