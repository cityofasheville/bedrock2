/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';

const { Client } = pgpkg;

async function newClient(connection) {
  const client = new Client(connection);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`PG error connecting: ${pgErrorCodes[error.code]||error.code}`);
  }
}

async function readAsset(client, assetName) {
  let res;
  const sql = `SELECT a.asset_name 
  FROM bedrock.assets a where a.asset_name like $1`;
  try {
    res = await client.query(sql, [assetName]);
  } catch (error) {
    throw new Error(`PG error getting asset information: ${pgErrorCodes[error.code]||error.code}`);
  }
  return res;
}

async function readRelations(client, assetName) {
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
    res = await client.query(sql, [assetName]);
  } catch (error) {
    throw new Error(`PG error getting ancestor information: ${pgErrorCodes[error.code]||error.code}`);
  }

  for (let i = 0; i < res.rowCount; i += 1) {
    relations.ancestors.items.push(
      {
        asset_name: res.rows[i].asset_name,
        parent: res.rows[i].dependency,
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
    res = await client.query(sql, [assetName]);
  } catch (error) {
    throw new Error(`PG error getting descendent information: ${pgErrorCodes[error.code]||error.code}`);
  }
  for (let i = 0; i < res.rowCount; i += 1) {
    relations.descendants.items.push(
      {
        asset_name: res.rows[i].asset_name,
        parent: res.rows[i].dependency,
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
  const assetName = pathElements[1];
  let client;
  let relations;
  let res;
  const response = {
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
    response.error = true;
    response.message = error.message;
    return response;
  }

  try {
    res = await readAsset(client, assetName);
    if (res.rowCount === 0) {
      response.message = 'No assets found';
      return response;
    }
    relations = await readRelations(client, assetName);
    response.result.ancestors.items = relations.ancestors.items;
    response.result.ancestors.unique_items = relations.ancestors.unique_items;
    response.result.descendants.items = relations.descendants.items;
    response.result.descendants.unique_items = relations.descendants.unique_items;
  } catch (error) {
    response.error = true;
    response.message = error.message;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

export default getAllAssetRelations;
