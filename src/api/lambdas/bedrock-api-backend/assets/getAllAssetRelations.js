/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]}`);
  }
}

async function readAssets(client, pathElements) {
  let res;
  const sql = `SELECT a.asset_name 
  FROM bedrock.assets a where a.asset_name like $1`;
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error(`PG error getting asset information: ${pgErrorCodes[error.code]}`);
  }
  return res;
}

async function readRelations(client, pathElements) {
  let res;
  const relations = {
    ancestors: {
      items: [],
      unique_items: [],
    },
    descendants: {
      items: [],
      unique_items: [],
    },
  };
  let sql = `
        WITH RECURSIVE subdependencies AS (
          SELECT asset_name, dependency FROM dependencies
          WHERE asset_name = $1
          UNION
            SELECT d.asset_name, d.dependency
            FROM dependencies d
            INNER JOIN subdependencies s ON s.dependency = d.asset_name
        ) SELECT * FROM subdependencies;
      `;
  let check = {};
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error(`PG error getting ancestor information: ${pgErrorCodes[error.code]}`);
  }

  for (let i = 0; i < res.rowCount; i += 1) {
    relations.ancestors.items.push(
      {
        asset_name: res.rows[i].asset_name,
        dependency: res.rows[i].dependency,
      },
    );
    if (!(res.rows[i].dependency in check)) {
      relations.ancestors.unique_items.push(res.rows[i].dependency);
      check[res.rows[i].dependency] = true;
    }
  }

  // Now the other direction
  sql = `
        WITH RECURSIVE subdependencies AS (
          SELECT asset_name, dependency FROM dependencies
          WHERE dependency = $1
          UNION
            SELECT d.asset_name, d.dependency
            FROM dependencies d
            INNER JOIN subdependencies s ON s.asset_name = d.dependency
        ) SELECT * FROM subdependencies;
      `;
  check = {};
  try {
    res = await client.query(sql, [pathElements[1]]);
  } catch (error) {
    throw new Error(`PG error getting descendent information: ${pgErrorCodes[error.code]}`);
  }
  for (let i = 0; i < res.rowCount; i += 1) {
    relations.descendants.items.push(
      {
        asset_name: res.rows[i].asset_name,
        dependency: res.rows[i].dependency,
      },
    );
    if (!(res.rows[i].asset_name in check)) {
      relations.descendants.unique_items.push(res.rows[i].asset_name);
      check[res.rows[i].asset_name] = true;
    }
  }
  return relations;
}

async function getAllAssetRelations(pathElements, queryParams, connection) {
  let client;
  let relations;
  let res;
  const result = {
    error: false,
    message: '',
    result: {
      ancestors: {
        items: [],
        unique_items: [],
      },
      descendants: {
        items: [],
        unique_items: [],
      },
    },
  };

  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  try {
    res = await readAssets(client, pathElements);
    if (res.rowCount === 0) {
      result.message = 'No assets found';
      return result;
    }
    relations = await readRelations(client, pathElements);
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    await client.end();
    return result;
  }

  await client.end();

  result.result.ancestors.items = relations.ancestors.items;
  result.result.ancestors.unique_items = relations.ancestors.unique_items;
  result.result.descendants.items = relations.descendants.items;
  result.result.descendants.unique_items = relations.descendants.unique_items;

  return result;
}

module.exports = getAllAssetRelations;
