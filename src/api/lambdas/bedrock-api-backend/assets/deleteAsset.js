/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { checkExistence, deleteInfo } from '../utilities/utilities.js';

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

async function getRelationsInfo(client, idField, idValue, name, tableName, idColumn) {
  // Querying database to get information. Function can be used multiple times per method
  // if we need information from multiple tables
  const sql = `SELECT * FROM ${tableName} where ${idField} like $1`;
  let res;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error([`Postgres error: ${error}`]);
  }

  if (res.rowCount === 0) {
    return null
  }

  // get asset names. id column is either asset_id or descendent_asset_id depending on if we're 
  // looking at ancestors or descendants
  for (let i = 0; i < res.rows.length; i++) {
    const sql = `SELECT asset_name FROM bedrock.assets where asset_id like $1`;
    let result;
    try {
      result = await client.query(sql, [res.rows[i][idColumn]]);

    } catch (error) {
      throw new Error([`Postgres error: ${error}`]);
    }
    res.rows[i].asset_name = result.rows[0].asset_name
  }

  return res.rows;
}

function formatAncestors(ancestors) {
  return ancestors.map(obj => ({
    asset_id: obj.dependent_asset_id,
    asset_name: obj.asset_name
  }));
}

function formatDescendants(descendants) {
  return descendants.map(obj => ({
    asset_id: obj.asset_id,
    asset_name: obj.asset_name
  }));
}


async function deleteAsset(
  db,
  idField,
  idValue,
  name,
  tableName,
) {
  const shouldExist = true;
  const tableNames = ['bedrock.assets', 'bedrock.custom_values', 'bedrock.asset_tags', 'bedrock.tasks', 'bedrock.etl'];
  const dependencyTableName = 'bedrock.dependencies';
  const connectedData = 'dependent assets';
  const connectedDataIdField = 'dependent_asset_id';

  const response = {
    statusCode: 200,
    message: `Successfully deleted asset ${idValue}`,
  };

  await checkExistence(db, tableName, idField, idValue, name, shouldExist);

  let client;

  client = await db.newClient();
  await client.query('BEGIN');
  let ancestors = await getRelationsInfo(client, 'asset_id', idValue, name, 'bedrock.dependencies', 'dependent_asset_id');
  let descendants = await getRelationsInfo(client, 'dependent_asset_id', idValue, name, 'bedrock.dependencies', 'asset_id');

  // if either ancestors or descendants exists, we return info for them
  if (ancestors) {
    if (!response.result) response.result = {}
    response.result.ancestors = formatAncestors(ancestors);
    deleteInfo(client, 'bedrock.dependencies', 'asset_id', idValue, name)
  }

  if (descendants) {
    if (!response.result) response.result = {}
    response.result.descendants = formatDescendants(descendants);
    // if there are descendents, we must delete from the dependent_asset_id column in the dependencies table as well.
    deleteInfo(client, 'bedrock.dependencies', 'dependent_asset_id', idValue, name)
  }

  handleDelete(tableNames, client, idField, idValue, name);

  if (descendants || ancestors) {
    response.result.message = `Asset ${idValue} successfully deleted. The following relationships have been removed from the dependencies table.`
  }

  await client.query('COMMIT');

  return response;
}

export default deleteAsset;
