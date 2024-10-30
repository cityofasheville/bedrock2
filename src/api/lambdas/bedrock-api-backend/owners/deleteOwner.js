/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, checkBeforeDelete, getName
} from '../utilities/utilities.js';

async function deleteOwner(
  db,
  idField,
  idValue,
  name,
  tableName,
  nameField
) {
  const shouldExist = true;
  const assetsTableName = 'bedrock.assets';
  const connectedData = 'assets';
  const connectedDataIdField = 'asset_id';

  const response = {
    statusCode: 200,
    result: null,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  await checkBeforeDelete(db, name, assetsTableName, idField, idValue, connectedData, connectedDataIdField)
  let ownerName = await getName(db, nameField, tableName, idField, idValue)
  response.message = `Successfully deleted ${name} ${ownerName}`,

  await deleteInfo(db, tableName, idField, idValue, name);

  return response;
}

export default deleteOwner;
