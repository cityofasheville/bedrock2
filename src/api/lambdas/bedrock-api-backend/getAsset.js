/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

async function newClient(connection) {
  const result = {
    error: false,
    message: '',
    result: {},
  };
  const client = new Client(connection);
  await client.connect().catch((err) => {
    result.error = true;
    result.message = `PG error connecting: ${pgErrorCodes[err.code]}`;
  });
  return { client, result };
}

async function readAsset(result, client, pathElements) {
  let res;
  const sql = `SELECT a.*, e.run_group, e.active as etl_active, d.dependency
    FROM bedrock.assets a 
    left join bedrock.etl e on e.asset_name = a.asset_name
    left join bedrock.dependencies d on d.asset_name = a.asset_name
    where a.asset_name like $1`;
  res = await client.query(sql, [pathElements[1]]).catch((err) => {
    result.error = true;
    result.message = `PG error getting asset information: ${
      pgErrorCodes[err.code]
    }`;
  });
  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
  }
  return { result, res };
}

async function packageAsset(result, res, client, queryParams, pathElements) {
  let fields = null;
  const available = [
    'description',
    'location',
    'active',
    'owner_id',
    'notes',
    'tags',
    'dependencies',
    'etl_run_group',
    'etl_active',
  ];
  // Use fields from the query if they're present, otherwise use all available fields
  if ('fields' in queryParams) {
    fields = queryParams.fields.replace('[', '').replace(']', '').split(',');
  } else {
    fields = [...available];
  }
  //after assigning fields, call addInfo and addTags to add that data
  // is there a better name than add? package again? naming things is the worst
  const { result: updatedResult, res: updatedRes } = await addInfo(
    result,
    res,
    fields,
    available,
  );
  if (fields === null || fields.includes('tags')) {
    const finalResult = await addTags(
      updatedResult,
      updatedRes,
      client,
      pathElements,
    );
    return finalResult;
  }
  let finalResult = result;
  return finalResult;
}

async function addInfo(result, res, fields, available) {
  result.result = {
    asset_name: res.rows[0].asset_name,
  };
  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (const itm of fields) {
    if (available.includes(itm)) {
      if (itm === 'dependencies') {
        result.result.dependencies = [];
        for (let i = 0; i < res.rowCount; i += 1) {
          if (res.rows[i].dependency !== null) {
            result.result.dependencies.push(res.rows[i].dependency);
          }
        }
      } else if (itm === 'etl_run_group') {
        result.result[itm] = res.rows[0].run_group;
      } else if (itm === 'tags') {
        result.result[itm] = [];
      } else {
        result.result[itm] = res.rows[0][itm];
      }
    }
  }
  return { result, res };
}

async function addTags(result, res, client, pathElements) {
  // Now get tags
  res = await client
    .query('SELECT * from bedrock.asset_tags where asset_name like $1', [
      pathElements[1],
    ])
    .catch((err) => {
      result.error = true;
      result.message = `PG error getting asset_tags: ${pgErrorCodes[err.code]}`;
      result.result = null;
    });
  if (!result.error && res.rowCount > 0) {
    for (let i = 0; i < res.rowCount; i += 1) {
      if (res.rows[i].tag_name !== null) {
        result.result.tags.push(res.rows[i].tag_name);
      }
    }
  }
  await client.end();
  return result;
}

async function getAsset(pathElements, queryParams, connection) {
  const { client, result } = await newClient(connection);

  if (result.error) {
    result.result = null;
    return result;
  }
  // Here's where I start renaming the results variable after passing it into
  // each function.
  // feels kind of silly to me, but unsure of other options
  const { result: resultFromReadAsset, res } = await readAsset(
    result,
    client,
    pathElements,
  );

  if (resultFromReadAsset.error) {
    resultFromReadAsset.result = null;
    return resultFromReadAsset;
  }

  const finalResult = await packageAsset(
    resultFromReadAsset,
    res,
    client,
    queryParams,
    pathElements,
  );

  if (finalResult.error) {
    finalResult.result = null;
    return finalResult;
  }

  return finalResult;
}

module.exports = getAsset;
