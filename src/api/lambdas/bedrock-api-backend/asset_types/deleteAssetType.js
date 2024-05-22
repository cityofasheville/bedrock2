/* eslint-disable no-console */
import {
  newClient, checkExistence, deleteInfo,
} from '../utilities/utilities.js';

async function deleteAssetType(
  connection,
  idField,
  idValue,
  name,
  tableName,
) {
  const shouldExist = true;
  let client;

  const response = {
    error: false,
    message: `Successfully deleted ${name} ${idValue}`,
    result: null,
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    await checkExistence(client, tableName, idField, idValue, name, shouldExist);
    await client.query('BEGIN');
    await deleteInfo(client, tableName, idField, idValue, name);
    await deleteInfo(client, 'asset_type_custom_fields', 'asset_type_id', idValue, name);
    await client.query('COMMIT');
    await client.end();
  } catch (error) {
    await client.query('ROLLBACK');
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }
  return response;
}

export default deleteAssetType;
