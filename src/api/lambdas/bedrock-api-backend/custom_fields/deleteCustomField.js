/* eslint-disable import/extensions */
/* eslint-disable no-console */
import {
  newClient, checkExistence, deleteInfo,
} from '../utilities/utilities.js';

async function deleteCustomField(
  connection,
  idField,
  idValue,
  name,
  tableName,
) {
  const shouldExist = true;
  let client;
  let clientInitiated = false;
  // We're only deleting the relationships between CFs and asset_types, not the actual CFs. 
  // which is why we're using a different table name.
  const linkingTableName = 'bedrock.asset_type_custom_fields'

  const response = {
    error: false,
    message: `Successfully deleted relationship between ${name} ${idValue} and asset_types.`,
    result: null,
  };

  try {
    client = await newClient(connection);
    clientInitiated = true;
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    await deleteInfo(client, linkingTableName, idField, idValue, name);
    await client.end();
  } catch (error) {
    if (clientInitiated) {
      await client.end();
    }
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

export default deleteCustomField;
