/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkInfo, checkExistence, addInfo, generateId, addAssetTypeCustomFields
} from '../utilities/utilities.js';

function checkCustomFields(body) {
  if (body.custom_fields) {
    if (!body.custom_fields.every((value) => typeof value === 'object')) {
      throw new Error('Custom fields lacking required property or formatted incorrectly.');
    }
  }
}

async function addAssetType(
  db,
  allFields,
  body,
  idField,
  name,
  tableName,
  tableNameCustomFields,
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
  checkCustomFields(bodyWithID);

  let client = await db.newClient();

  await client.query('BEGIN');
  await checkExistence(client, tableName, idField, idValue, name, shouldExist);
  response.result = await addInfo(client, allFields, bodyWithID, tableName, name);
  if (body.custom_fields?.length > 0) {
    response.result.custom_fields = await addAssetTypeCustomFields(client, idValue, body);
  } else {
    response.result.custom_fields = [];
  }
  await client.query('COMMIT');

  return response;
}

export default addAssetType;
