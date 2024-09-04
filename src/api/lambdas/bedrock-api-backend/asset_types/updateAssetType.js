/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkInfo, checkExistence, updateInfo, deleteInfo,
} from '../utilities/utilities.js';
import { addAssetTypeCustomFields } from '../utilities/utilities.js'

async function updateAssetType(
  db,
  allFields,
  body,
  idField,
  idValue,
  name,
  tableName,
  tableNameCustomFields,
  requiredFields,
) {
  const shouldExist = true;

  const response = {
    statusCode: 200,
    message: `Successfully updated ${name} ${idValue}`,
    result: null,
  };

  let client = await db.newClient();
  checkInfo(body, requiredFields, name, idValue, idField);
  await checkExistence(client, tableName, idField, idValue, name, shouldExist);
  await client.query('BEGIN');
  response.result = await updateInfo(client, allFields, body, tableName, idField, idValue, name);
  await deleteInfo(client, tableNameCustomFields, 'asset_type_id', idValue, name);
  if (body.custom_fields?.length > 0) {
    await addAssetTypeCustomFields(client, idValue, body);
  } else {
    response.result.custom_fields = [];
  }
  await client.query('COMMIT');

  return response;
}

export default updateAssetType;
