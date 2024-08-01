/* eslint-disable import/extensions */
/* eslint-disable no-console */
import pgpkg from 'pg';
import pgErrorCodes from '../pgErrorCodes.js';
import { checkExistence } from '../utilities/utilities.js';

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
  // this function queries the dependency_view , not the dependencies table.
  // this is done to capture any implied dependencies
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
          SELECT asset_id, asset_name, dependent_asset_id, dependency 
          FROM bedrock.dependency_view
          WHERE asset_id = $1
          UNION
          SELECT d.asset_id, d.asset_name, d.dependent_asset_id, d.dependency
          FROM bedrock.dependency_view d
          INNER JOIN subdependencies s ON s.dependent_asset_id = d.asset_id
      )
      SELECT subdependencies.asset_id, subdependencies.asset_name, subdependencies.dependent_asset_id, subdependencies.dependency, i.asset_type_id as asset_type, t.asset_type_id as dependent_asset_type
      FROM subdependencies
      LEFT JOIN bedrock.assets i ON subdependencies.asset_id = i.asset_id
      LEFT JOIN bedrock.assets t ON subdependencies.dependent_asset_id = t.asset_id
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
        asset_name: res.rows[i].asset_name,
        asset_type: res.rows[i].asset_type,
        parent: res.rows[i].dependent_asset_id,
        parent_name: res.rows[i].dependency,
        parent_asset_type: res.rows[i].dependent_asset_type
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
          SELECT asset_id, asset_name, dependent_asset_id, dependency FROM bedrock.dependency_view
          WHERE dependent_asset_id = $1
          UNION
            SELECT d.asset_id, d.asset_name, d.dependent_asset_id, d.dependency
            FROM bedrock.dependency_view d
            INNER JOIN subdependencies s ON s.asset_id = d.dependent_asset_id
        ) SELECT subdependencies.asset_id, subdependencies.asset_name, subdependencies.dependent_asset_id, subdependencies.dependency, i.asset_type_id as asset_type, t.asset_type_id as dependent_asset_type
        FROM subdependencies
        LEFT JOIN bedrock.assets i ON subdependencies.asset_id = i.asset_id
        LEFT JOIN bedrock.assets t ON subdependencies.dependent_asset_id = t.asset_id
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
        asset_name: res.rows[i].asset_name,
        asset_type: res.rows[i].asset_type,
        parent: res.rows[i].dependent_asset_id,
        parent_name: res.rows[i].dependency,
        parent_asset_type: res.rows[i].dependent_asset_type
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
  idField,
  name
) {
  let client;
  let relations;
  let res;
  const shouldExist = true;
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
    await checkExistence(client, 'bedrock.assets', idField, idValue, name, shouldExist)
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
    response.result = null;
    return response;
  } finally {
    await client.end();
  }
  return response;
}

export default getAllAssetRelations;