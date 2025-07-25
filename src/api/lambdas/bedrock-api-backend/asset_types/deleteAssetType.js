/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, checkBeforeDelete, getName
} from '../utilities/utilities.js';

async function deleteAssetType(
  client,
  idField,
  idValue,
  name,
  tableName,
  tableNameCustomFields,
  nameField
) {
  const shouldExist = true;
  const assetsTableName = 'bedrock.assets';
  const connectedData = 'assets';
  const connectedDataIdField = 'asset_id'

  const response = {
    statusCode: 200,
    result: null,
  };

  await checkExistence(client, tableName, idField, idValue, name, shouldExist);
  await checkBeforeDelete(client, name, assetsTableName, idField, idValue, connectedData, connectedDataIdField)
  let assetTypeName = await getName(db, nameField, tableName, idField, idValue)
  response.message = `Successfully deleted ${name} ${assetTypeName}`,
  await client.query('BEGIN');
  await deleteInfo(client, tableName, idField, idValue, name);
  await deleteInfo(client, tableNameCustomFields, 'asset_type_id', idValue, name);
  await client.query('COMMIT');

  return response;
}

export default deleteAssetType;
