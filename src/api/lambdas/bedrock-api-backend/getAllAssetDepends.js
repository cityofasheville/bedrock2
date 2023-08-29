/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function getAllAssetDepends(pathElements, queryParams, connection) {
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
    const sql = `SELECT a.*, e.run_group, e.active as etl_active, d.dependency
    FROM bedrock.assets a 
    left join bedrock.etl e on e.asset_name = a.asset_name
    left join bedrock.dependencies d on d.asset_name = a.asset_name
    where a.asset_name like $1`;

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
    const sql = `
      WITH RECURSIVE subdependencies AS (
        SELECT
          asset_name,
          dependency
        FROM
          dependencies
        WHERE
          asset_name = $1
        UNION
          SELECT
            d.asset_name,
            d.dependency
          FROM
            dependencies d
          INNER JOIN subdependencies s ON s.dependency = d.asset_name
      ) SELECT
        *
      FROM
        subdependencies;
    `;
    const depends = [];
    res = await client.query(sql, [pathElements[1]]);
    for (let i = 0; i < res.rowCount; i += 1) {
      depends.push(
        {
          asset_name: res.rows[i].asset_name,
          dependency: res.rows[i].dependency,
        },
      );
    }
    result.result = {
      items: depends,
    };
  }
  return result;
}

module.exports = getAllAssetDepends;
