/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, checkBeforeDelete
} from '../utilities/utilities.js';

async function deleteAssetType(
  db,
  idField,
  idValue,
  name,
  tableName,
  tableNameCustomFields,
) {
  const shouldExist = true;
  const assetsTableName = 'bedrock.assets';
  const connectedData = 'assets';
  const connectedDataIdField = 'asset_id'

  const response = {
    statusCode: 200,
    message: `Successfully deleted ${name} ${idValue}`,
    result: null,
  };

  let client;

  client = await db.newClient();
  await checkExistence(client, tableName, idField, idValue, name, shouldExist);
  await checkBeforeDelete(client, name, assetsTableName, idField, idValue, connectedData, connectedDataIdField)
  await client.query('BEGIN');
  await deleteInfo(client, tableName, idField, idValue, name);
  await deleteInfo(client, tableNameCustomFields, 'asset_type_id', idValue, name);
  await client.query('COMMIT');

  return response;
}

export default deleteAssetType;
