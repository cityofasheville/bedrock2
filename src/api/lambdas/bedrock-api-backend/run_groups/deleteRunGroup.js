/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, checkBeforeDelete, getName
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
  const nameField = 'run_group_name'

  const response = {
    statusCode: 200,
    result: null,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  await checkBeforeDelete(db, name, etlTableName, idField, idValue, connectedData, connectedDataIdField)
  let runGroupName = await getName(db, nameField, tableName, idField, idValue)
  response.message = `Successfully deleted ${name} ${runGroupName}`,
  await deleteInfo(db, tableName, idField, idValue, name);

  return response;
}

export default deleteRunGroup;
