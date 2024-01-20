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

async function getInfo(client, info) {
  let sql = `SELECT * FROM bedrock.${info.table_name}`;
  let res;
  let resultArray = []

  if (info.field_name != 'all') {
    sql += ` order by ${info.field_name} asc`;
  }


  try {
    res = await client.query(sql, []);
    // Either build the array of strings if you just need one field, 
    // or just add the entire res.rows if you need all fields
    if (info.field_name != 'all') {
      for (let i=0;i<res.rows.length;i++) {
        resultArray.push(res.rows[i][info.field_name])
      }
    } else {
      resultArray = res.rows
    }
  } catch (error) {
    throw new Error(`PG error getting ${info.table_name} information: ${pgErrorCodes[error.code]}`);
  }

  return resultArray;
}

async function getTasks(client) {
  let sql = `SELECT * FROM bedrock.tasks`;
  let res;
  let resultArray = []

  // We're only adding unique task types
  try {
    res = await client.query(sql, []);
    for (let i=0;i<res.rows.length;i++) {
      if (!(resultArray.includes(res.rows[i].type))) {
        resultArray.push(res.rows[i].type)
      }
    }
  } catch (error) {
    throw new Error(`PG error getting tasks information: ${pgErrorCodes[error.code]}`);
  }

  return resultArray;
}

async function getCustomFields(client) {
  let sql = `SELECT * FROM bedrock.custom_fields`;
  let res;
  const resultMap = {};

  try {
    res = await client.query(sql, []);

    res.rows.forEach(item => {
      const { asset_type, field_name, field_type } = item;
      if (!resultMap[asset_type]) {
          resultMap[asset_type] = [
              {
                  "field_name": field_name,
                  "field_type": field_type
              }
          ];
      } else {
          resultMap[asset_type].push({
              "field_name": field_name,
              "field_type": field_type
          });
      }
  });
  } catch (error) {
    throw new Error(`PG error getting custom_fields information: ${pgErrorCodes[error.code]}`);
  }

  return resultMap;
}

async function getReference(domainName, pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: '',
    result: {}
  };

  let client;

  // if you want to add info from a new another table, and need either a single column
  // or all the columns, just add it to this array
  queryInfo = [
  {table_name: 'run_groups', field_name: 'run_group_name'},
  {table_name: 'tags', field_name: 'tag_name'},
  {table_name: 'connections', field_name: 'all'},
  {table_name: 'owners', field_name: 'all'},
]

// get a new client
  try {
    client = await newClient(connection);
  } catch (error) {
    result.error = true;
    result.message = error.message;
    return result;
  }

  // loop through queryInfo array, adding info for each table listed in the array
  for (let i=0;i<queryInfo.length; i++) {
    try {
      result.result[queryInfo[i].table_name] = await getInfo(client, queryInfo[i]);
    } catch (error) {
      await client.end();
      result.error = true;
      result.message = error.message;
      return result;
    }
  }

  // Tasks gets its own function because we have to build the array differently
  try {
    result.result.tasks = await getTasks(client);
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
  }

  // Custom fields also gets its own function because we're creating a map to return
  try {
    result.result.custom_fields = await getCustomFields(client);
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
  }

  return result;
}

module.exports = getReference;
