/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo,
} from '../utilities/utilities.js';

async function deleteTag(
  db,
  idField,
  idValue,
  name,
  tableName,
) {
  const shouldExist = true;
  const linkingTableName = 'bedrock.asset_tags'

  const response = {
    statusCode: 200,
    message: `Successfully deleted ${name} ${idValue}`,
    result: null,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  await deleteInfo(db, tableName, idField, idValue, name);
  await deleteInfo(db, linkingTableName, idField, idValue, name);

  return response;
}

export default deleteTag;
