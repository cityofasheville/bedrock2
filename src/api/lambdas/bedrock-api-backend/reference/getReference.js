/* eslint-disable no-console */
import pgpkg from 'pg';
const { Client } = pgpkg;
import pgErrorCodes from '../pgErrorCodes.js';
import getCustomFieldsInfo from '../common/getCustomFieldInfo.js';

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

async function getTaskType(client) {
  let sql = `SELECT unnest(enum_range(NULL::task_types)) as task_type;`;
  let res;
  let resultArray = []

  // We're only adding unique task types
  try {
    res = await client.query(sql, []);
    for (let i=0;i<res.rows.length;i++) {
      resultArray.push(res.rows[i]['task_type'])
    }
  } catch (error) {
    throw new Error(`PG error getting tasks information: ${pgErrorCodes[error.code]}`);
  }

  return resultArray;
}

async function getConnectionClass(client) {
  let sql = `SELECT unnest(enum_range(NULL::connections_classes)) as connection_class;`;
  let res;
  let resultArray = []

  // We're only adding unique task types
  try {
    res = await client.query(sql, []);
    for (let i=0;i<res.rows.length;i++) {
      resultArray.push(res.rows[i]['connection_class'])
    }
  } catch (error) {
    throw new Error(`PG error getting tasks information: ${pgErrorCodes[error.code]}`);
  }

  return resultArray;
}

async function getCustomFields(client) {
  let sql = `SELECT id, name FROM bedrock.asset_types`;
  let res;

  const resultMap = new Map();
  const types = [];

  try {
    res = await client.query(sql, []);
    res.rows.forEach(row => {
      types.push(row.id);
      const typeMap = new Map();
      typeMap.set('name', row.name);
      resultMap.set(row.id, typeMap);
    });
  } catch (error) {
    throw new Error(`PG error getting asset types: ${pgErrorCodes[error.code]}`);
  }
  for (type of types) {
    let customFields = await getCustomFieldsInfo(client, type);
    const typeMap = resultMap.get(type);
    typeMap.set('fields', Object.fromEntries(customFields.entries()));
  }
 
  for (let [id, itm] of resultMap) {
    resultMap[id] = Object.fromEntries(resultMap.get(id).entries());
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
  {table_name: 'tags', field_name: 'all'},
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

  // Tasks and connections class gets their own functions because we have to build the array differently
  try {
    result.result.task_type = await getTaskType(client);
    result.result.connection_class = await getConnectionClass(client);
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
  }

  // Custom fields also gets its own function because we're creating a map to return
  try {
    result.result.custom_fields = await getCustomFields(client);
    await client.end()
  } catch (error) {
    await client.end();
    result.error = true;
    result.message = error.message;
    return result;
  }

  return result;
}

export default getReference;
