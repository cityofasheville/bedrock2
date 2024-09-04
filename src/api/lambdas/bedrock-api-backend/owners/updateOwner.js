/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkInfo, checkExistence, updateInfo,
} from '../utilities/utilities.js';

async function updateOwner(
  db,
  allFields,
  body,
  idField,
  idValue,
  name,
  tableName,
  requiredFields,
) {
  const shouldExist = true;

  const response = {
    statusCode: 200,
    message: `Successfully updated ${name} ${idValue}`,
    result: null,
  };

  checkInfo(body, requiredFields, name, idValue, idField);
  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  response.result = await updateInfo(db, allFields, body, tableName, idField, idValue, name);

  return response;
}

export default updateOwner;
