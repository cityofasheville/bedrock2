/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, checkBeforeDelete,
} from '../utilities/utilities.js';

async function deleteOwner(
  db,
  idField,
  idValue,
  name,
  tableName,
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

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  await checkBeforeDelete(db, name, assetsTableName, idField, idValue, connectedData, connectedDataIdField)
  await deleteInfo(db, tableName, idField, idValue, name);

  return response;
}

export default deleteOwner;
