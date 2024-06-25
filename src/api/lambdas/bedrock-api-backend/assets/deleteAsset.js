/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';
import { newClient, checkExistence, deleteInfo } from '../utilities/utilities.js';

async function handleDelete(tableNames, client, idField, idValue, name) {
  try {
    const promises = tableNames.map(async (table) => {
      // Perform asynchronous operation for each item
      const data = await deleteInfo(client, table, idField, idValue, name);
      return data;
    });

    // Wait for all promises to resolve concurrently
    const results = await Promise.all(promises);

    // Process the results
    console.log(results);
  } catch (error) {
    // Handle any errors that occurred during the asynchronous operations
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
  const tableNames = ['bedrock2.assets', 'bedrock2.custom_values', 'bedrock2.asset_tags', 'bedrock2.etl', 'bedrock2.dependencies', 'bedrock2.tasks'];
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
