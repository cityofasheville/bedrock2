/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo,
} from '../utilities/utilities.js';

async function deleteCustomField(
  db,
  idField,
  idValue,
  name,
  tableName,
) {
  const shouldExist = true;
  // We're only deleting the relationships between CFs and asset_types, not the actual CFs. 
  // which is why we're using a different table name.
  const linkingTableName = 'bedrock.asset_type_custom_fields'

  const response = {
    statusCode: 200,
    message: `Successfully deleted relationship between ${name} ${idValue} and corresponding asset_type(s).`,
    result: null,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  await deleteInfo(db, linkingTableName, idField, idValue, name);

  return response;
}

export default deleteCustomField;
