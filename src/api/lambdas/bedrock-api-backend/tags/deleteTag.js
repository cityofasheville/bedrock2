/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, getName
} from '../utilities/utilities.js';

async function deleteTag(
  db,
  idField,
  idValue,
  name,
  tableName,
  nameField
) {
  const shouldExist = true;
  const linkingTableName = 'bedrock.asset_tags'

  const response = {
    statusCode: 200,
    result: null,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  let tagName = await getName(db, nameField, tableName, idField, idValue)
  response.message = `Successfully deleted ${name} ${tagName}`;
  await deleteInfo(db, tableName, idField, idValue, name);
  await deleteInfo(db, linkingTableName, idField, idValue, name);
  return response;
}

export default deleteTag;
