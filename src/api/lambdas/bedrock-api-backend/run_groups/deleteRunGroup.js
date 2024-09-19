/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, checkBeforeDelete,
} from '../utilities/utilities.js';

async function deleteRunGroup(
  db,
  idField,
  idValue,
  name,
  tableName,
) {
  const shouldExist = true;
  const etlTableName = 'bedrock.etl'
  const connectedData = 'assets'
  const connectedDataIdField = 'asset_id'

  const response = {
    statusCode: 200,
    message: `Successfully deleted ${name} ${idValue}`,
    result: null,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  await checkBeforeDelete(db, name, etlTableName, idField, idValue, connectedData, connectedDataIdField)
  await deleteInfo(db, tableName, idField, idValue, name);

  return response;
}

export default deleteRunGroup;
