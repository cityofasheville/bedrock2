/* eslint-disable no-console */
const { Client } = require('pg');
const pgErrorCodes = require('./pgErrorCodes');

// eslint-disable-next-line no-unused-vars
async function getAsset(pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      console.log(JSON.stringify(err));
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  const sql = `SELECT * FROM bedrock.assets where asset_name like '${pathElements[1]}';`;
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  await client.end();
  if (res.rowCount === 0) {
    result.error = true;
    result.message = 'Asset not found';
  } else {
    [result.result] = res.rows;
  }
  return result;
}

async function addAsset(requestBody, pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: null,
  };
  const body = JSON.parse(requestBody);

  // Make sure that we have required information
  if (!('asset_name' in body)
   || !('description' in body)
   || !('location' in body)
   || !('active' in body)) {
    result.error = true;
    result.message = 'Asset lacks required property (one of asset_name, description, location, active)';
    result.result = body;
    return result;
  }
  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  const sql = `SELECT * FROM bedrock.assets where asset_name like '${pathElements[1]}';`;
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  await client.end();
  console.log('Now check row count');
  if (res.rowCount > 0) {
    result.error = true;
    result.message = 'Asset already exists';
    return result;
  }
  console.log('All good?');
  // write the add.
  return result;
}

// eslint-disable-next-line no-unused-vars
async function handleAssets(event, pathElements, queryParams, verb, connection) {
  let result = {
    error: false,
    message: '',
    result: null,
  };
  console.log('path length = ', pathElements.length);
  switch (pathElements.length) {
    // GET assets
    case 1:
      result.message = 'Get all assets not yet implemented';
      result.error = true;
      break;

    // VERB assets/{assetname}
    case 2:
      switch (verb) {
        case 'GET':
          console.log('GOTTA GET');
          result = await getAsset(pathElements, queryParams, connection);
          break;

        case 'POST':
          console.log('GOTTA POST');
          result = await addAsset(event.body, pathElements, queryParams, connection);
          break;

        case 'PUT':
          result.message = 'Update asset not implemented';
          result.error = true;
          break;

        case 'DELETE':
          result.message = 'Delete asset not implemented';
          result.error = true;
          break;

        default:
          result.message = `handleAssets: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    // GET/DELETE assets/{assetname}/tasks OR
    // GET assets/{assetname}/depends
    case 3:
      if (pathElements[2] === 'tasks') {
        if (verb === 'GET') {
          result.message = 'Get asset tasks not implemented';
          result.error = true;
        } else if (verb === 'DELETE') {
          result.message = 'Delete all asset tasks not implemented';
          result.error = true;
        }
      } else if (pathElements[2] === 'depends') {
        result.message = 'Get asset depends not implemented';
        result.error = true;
      } else {
        result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        result.error = true;
      }
      break;

    // POST/PUT/DELETE assets/{assetname}/tasks/{taskPosition} OR
    // GET /bedrock/assets/search/{searchString}
    case 4:
      if (pathElements[1] === 'search') {
        result.message = 'Assets search not implemented';
        result.error = true;
      } else if (pathElements[2] === 'tasks') {
        switch (verb) {
          case 'POST':
            result.message = 'Add asset task not implemented';
            result.error = true;
            break;

          case 'PUT':
            result.message = 'Update asset task not implemented';
            result.error = true;
            break;

          case 'DELETE':
            result.message = 'Delete asset task not implemented';
            result.error = true;
            break;

          default:
            result.message = `handleAssets: unknown verb ${verb}`;
            result.error = true;
            break;
        }
      } else {
        result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
        result.error = true;
      }
      break;

    default:
      result.message = `Unknown assets endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log('We have an error but do not know why!');
    console.log(result.message);
  }
  return result;
}

module.exports = handleAssets;
