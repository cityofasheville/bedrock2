/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function updateAsset(requestBody, pathElements, queryParams, connection) {
  const assetName = pathElements[1];
  const result = {
    error: false,
    message: `Successfully updated asset ${assetName}`,
    result: {},
  };

  const body = JSON.parse(requestBody);

  // Make sure that the asset name in the body, if there, matches the path
  if ('asset_name' in body && body.asset_name !== assetName) {
    result.error = true;
    result.message = `Asset name ${assetName} in path does not match asset name ${body.asset_name} in body`;
    return result;
  }

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      console.log(JSON.stringify(err));
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  // Verify that the asset exists
  let sql = 'SELECT * FROM bedrock.assets where asset_name like $1';

  let res = await client.query(sql, [assetName])
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  if (res.rowCount === 0) {
    result.error = true;
    result.message = `Asset ${assetName} does not exist`;
    await client.end();
  } else {
    let members = ['description', 'location', 'active'];
    try {
      await client.query('BEGIN');

      // Start with the base asset
      let cnt = 1;
      let args = [];
      sql = 'UPDATE assets SET ';
      let comma = '';
      for (let i = 0; i < members.length; i += 1) {
        if (members[i] in body) {
          sql += `${comma} ${members[i]} = $${cnt}`;
          comma = ',';
          cnt += 1;
          args.push(body[members[i]]);
          result.result[members[i]] = body[members[i]];
        }
      }
      sql += ` where asset_name = $${cnt}`;
      args.push(assetName);
      res = await client.query(sql, args)
        .catch((err) => {
          const errmsg = pgErrorCodes[err.code];
          throw new Error([`Postgres error: ${errmsg}`, err]);
        });

      // Now add any dependencies, always replacing existing with new
      if (('dependencies' in body)) {
        res = await client.query('DELETE FROM dependencies WHERE asset_name = $1', [assetName]);
        if (body.dependencies.length > 0) {
          for (let i = 0; i < body.dependencies.length; i += 1) {
            const dependency = body.dependencies[i];
            // eslint-disable-next-line no-await-in-loop
            res = await client.query(
              'INSERT INTO dependencies (asset_name, dependency) VALUES ($1, $2)',
              [assetName, dependency],
            )
              .catch((err) => {
                const errmsg = pgErrorCodes[err.code];
                throw new Error([`Postgres error inserting asset dependencies: ${errmsg}`, err]);
              });
          }
        }
        result.result.dependencies = body.dependencies;
      }

      // Now add any ETL information. Null run group means delete
      if (('etl_run_group' in body || 'etl_active' in body)) {
        if ('etl_run_group' in body && body.etl_run_group === null) { // Delete the ETL information
          await client.query('DELETE FROM etl where asset_name = $1', [assetName]);
          await client.query('DELETE FROM tasks where asset_name = $1', [assetName]);
        } else { // Update the ETL information
          members = ['etl_run_group', 'etl_active'];
          cnt = 1;
          args = [];
          sql = 'UPDATE etl SET ';
          comma = '';
          for (let i = 0; i < members.length; i += 1) {
            if (members[i] in body) {
              sql += `${comma} ${members[i].substring(4)} = $${cnt}`;
              comma = ',';
              cnt += 1;
              args.push(body[members[i]]);
              result.result[members[i]] = body[members[i]];
            }
          }
          sql += ` where asset_name = $${cnt}`;
          args.push(assetName);
          console.log(sql);
          await client.query(sql, args)
            .catch((err) => {
              const errmsg = pgErrorCodes[err.code];
              throw new Error([`Postgres error inserting asset etl info: ${errmsg}`, err]);
            });
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      result.error = true;
      result.message = e;
      await client.query('ROLLBACK');
    } finally {
      await client.end();
    }
  }
  return result;
}

module.exports = updateAsset;
