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

async function readAsset(client, idValue, tableName) {
  let res;
  const sql = `SELECT a.asset_id
  FROM ${tableName} a where a.asset_id like $1`;
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting asset information: ${pgErrorCodes[error.code]||error.code}`);
  }
  return res;
}

async function readRelations(client, idValue) {
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
          SELECT asset_id, dependent_asset_id FROM bedrock.dependencies
          WHERE asset_id = $1
          UNION
            SELECT d.asset_id, d.dependent_asset_id
            FROM bedrock.dependencies d
            INNER JOIN subdependencies s ON s.dependent_asset_id = d.asset_id
        ) SELECT * FROM subdependencies;
      `;
  let check = {};
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting ancestor information: ${pgErrorCodes[error.code]||error.code}`);
  }

  for (let i = 0; i < res.rowCount; i += 1) {
    relations.ancestors.items.push(
      {
        asset_id: res.rows[i].asset_id,
        parent: res.rows[i].dependent_asset_id,
      },
    );
    if (!(res.rows[i].dependent_asset_id in check)) {
      relations.ancestors.unique_items.push(res.rows[i].dependent_asset_id);
      check[res.rows[i].dependent_asset_id] = true;
    }
  }

  // Now the other direction
  sql = `
        WITH RECURSIVE subdependencies AS (
          SELECT asset_id, dependent_asset_id FROM bedrock.dependencies
          WHERE dependent_asset_id = $1
          UNION
            SELECT d.asset_id, d.dependent_asset_id
            FROM bedrock.dependencies d
            INNER JOIN subdependencies s ON s.asset_id = d.dependent_asset_id
        ) SELECT * FROM subdependencies;
      `;
  check = {};
  try {
    res = await client.query(sql, [idValue]);
  } catch (error) {
    throw new Error(`PG error getting descendent information: ${pgErrorCodes[error.code]||error.code}`);
  }
  for (let i = 0; i < res.rowCount; i += 1) {
    relations.descendants.items.push(
      {
        asset_id: res.rows[i].asset_id,
        parent: res.rows[i].dependent_asset_id,
      },
    );
    if (!(res.rows[i].asset_id in check)) {
      relations.descendants.unique_items.push(res.rows[i].asset_id);
      check[res.rows[i].asset_id] = true;
    }
  }
  return relations;
}

async function getAllAssetRelations(
  connection,
  idValue,
  tableName,
) {
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
    res = await readAsset(client, idValue, tableName);
    if (res.rowCount === 0) {
      response.message = 'No assets found';
      return response;
    }
    relations = await readRelations(client, idValue);
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
