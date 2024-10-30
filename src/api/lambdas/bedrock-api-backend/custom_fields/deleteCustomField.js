/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  checkExistence, deleteInfo, getName
} from '../utilities/utilities.js';

async function deleteCustomField(
  db,
  idField,
  idValue,
  name,
  tableName,
  nameField
) {
  const shouldExist = true;
  // We're only deleting the relationships between CFs and asset_types, not the actual CFs. 
  // which is why we're using a different table name.
  const linkingTableName = 'bedrock.asset_type_custom_fields'

  const response = {
    statusCode: 200,
    result: null,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);
  let customFieldName = await getName(db, nameField, tableName, idField, idValue)
  response.message = `Successfully deleted relationship between ${name} ${customFieldName} and corresponding asset_type(s).`,
  await deleteInfo(db, linkingTableName, idField, idValue, name);

  return response;
}

export default deleteCustomField;
