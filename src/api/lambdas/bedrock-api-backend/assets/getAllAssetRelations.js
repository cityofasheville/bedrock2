/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('../pgErrorCodes');

async function getAllAssetRelations(pathElements, queryParams, connection) {
  let res;
  const result = {
    error: false,
    message: '',
    result: {},
  };

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      result.error = true;
      result.message = `PG error connecting: ${pgErrorCodes[err.code]}`;
    });

  if (!result.error) {
    const sql = `SELECT a.asset_name
    FROM bedrock.assets a where a.asset_name like $1`;

    res = await client.query(sql, [pathElements[1]])
      .catch((err) => {
        result.error = true;
        result.message = `PG error getting asset information: ${pgErrorCodes[err.code]}`;
      });
  }

  if (result.error) {
    result.result = null;
    return result;
  }

  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
  } else {
    result.result = {
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
    res = await client.query(sql, [pathElements[1]]);
    for (let i = 0; i < res.rowCount; i += 1) {
      result.result.ancestors.items.push(
        {
          asset_name: res.rows[i].asset_name,
          dependency: res.rows[i].dependency,
        },
      );
      if (!(res.rows[i].dependency in check)) {
        result.result.ancestors.unique_items.push(res.rows[i].dependency);
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
    res = await client.query(sql, [pathElements[1]]);
    for (let i = 0; i < res.rowCount; i += 1) {
      result.result.descendants.items.push(
        {
          asset_name: res.rows[i].asset_name,
          dependency: res.rows[i].dependency,
        },
      );
      if (!(res.rows[i].asset_name in check)) {
        result.result.descendants.unique_items.push(res.rows[i].asset_name);
        check[res.rows[i].asset_name] = true;
      }
    }
  }
  return result;
}

module.exports = getAllAssetRelations;
