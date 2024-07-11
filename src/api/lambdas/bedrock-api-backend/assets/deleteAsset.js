/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';
import { newClient, checkExistence, deleteInfo, checkBeforeDelete } from '../utilities/utilities.js';

async function handleDelete(tableNames, client, idField, idValue, name) {
  try {
    const promises = tableNames.map(async (table) => {
      // Perform asynchronous operation for each item
      const data = await deleteInfo(client, table, idField, idValue, name);
      return data;
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function deleteAsset(
  connection,
  idField,
  idValue,
  name,
  tableName,
) {
  let client;
  const shouldExist = true;
  const tableNames = ['bedrock.assets', 'bedrock.custom_values', 'bedrock.asset_tags', 'bedrock.dependencies', 'bedrock.tasks'];
  const dependencyTableName = 'bedrock.dependencies';
  const connectedData = 'dependent assets';
  const connectedDataIdField = 'dependent_asset_id';
  // no need for building a map object to send to the requester, as we only return the asset name.
  const response = {
    error: false,
    message: `Successfully deleted asset ${idValue}`,
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
    // the two ID fields in the next line seem to be switched, but they are correct- the naming convention in the
    //dependency table makes it a bit confusing (we want to check if asset is in the "dependent_asset_id colum",
    // not the "asset_id" column)
    await checkBeforeDelete(client, name, dependencyTableName, connectedDataIdField, idValue, connectedData, idField)
  } catch (error) {
    await client.end();
    response.error = true;
    response.message = error.message;
    return response;
  }

  await client.query('BEGIN');

  try {
    handleDelete(tableNames, client, idField, idValue, name);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    response.error = true;
    response.message = error.message;
  } finally {
    await client.end();
  }
  return response;
}

export default deleteAsset;
