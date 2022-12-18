const { Client } = require('pg')
const pgSql = require('./pgSql')
const getConnection = require('./getConnection')
const toposort = require('toposort')
// const getSqlFromFile = require('./getSqlFromFile')

old_lambda_handler = async function (event, context) {
    const task = new Promise(resolve => {
        try {
            let etl = event.ETLJob.etl_tasks[event.TaskIndex]
            if (!etl.active) {
                resolve(formatRes(200, "Inactive: skipped"))
            } else {
                let sql = etl.sql_string;
                getConnection(etl.connection)
                    .then(connection => {
                        if (connection.type == 'postgresql') {
                            pgSql(connection, sql)
                                .then(result => {
                                    resolve(formatRes(200, result))
                                })
                        } else if (connection.type == 'sqlserver') {
                            ssSql(connection, sql)
                                .then(result => {
                                    resolve(formatRes(200, result))
                                })
                        } else {
                            throw ("Invalid DB Type")
                        }
                    })
            }
        }
        catch (err) {
            resolve(formatRes(500, err))
        }
    })

    // timeout task  
    let timeleft = context.getRemainingTimeInMillis() - 300;
    const timeout = new Promise((resolve) => {
        setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft / 1000)} seconds` }), timeleft);
    })
    // race the timeout task with the real task
    return Promise.race([task, timeout])
        .then((res) => {
            return res;
        });
}

function formatRes(code, result) {
    return {
        'statusCode': code,
        'body': {
            "lambda_output": result
        }
    }
}

async function getConnectionObject() {
  let connection = Promise.resolve({
    host: process.env.BEDROCK_DB_HOST || 'localhost',
    port: 5432,
    user: process.env.BEDROCK_DB_USER || 'bedrock',
    password: process.env.BEDROCK_DB_PASSWORD || 'test-bedrock',
    database: process.env.BEDROCK_DB_NAME || 'bedrock',
    max: 10,
    idleTimeoutMillis: 10000,
  });
  if (!('BEDROCK_DB_HOST' in process.env)) {
    return getConnection('nopubrecdb1/bedrock/bedrock_user')
    .then(
      function (cpValue) {
        connection = {
          host: cpValue.host,
          port: cpValue.port,
          user: cpValue.username,
          password: cpValue.password,
          database: cpValue.database,
          max: 10,
          idleTimeoutMillis: 10000,
        }
        return connection;
      }
    );
  }
  return connection;
}

async function readEtlList(connection, rungroup) {
  let etlList = [];
  try {
    const client = new Client(connection);
    await client.connect()
    .catch((err) => {
      const pgErrorCodes = require("./pgErrorCodes")
      let errmsg = pgErrorCodes[err.code]
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
    console.log('Run group is ', rungroup);
    let sql = `SELECT * FROM bedrock.etl where run_group = '${rungroup}' and active = true;`;
    const res = await client.query(sql)
    etlList = res.rows;
    await client.end()  
  }
  catch(err){
    console.log('Gotta error');
    console.log(err);
  }
  let assetMap = {}
    for (index in etlList) {
      const asset = etlList[index];
      assetMap[asset['asset_name']] = {
        'name': asset['asset_name'],
        'run_group': rungroup,
        'depends': [],
        'etl_tasks': [],
      };
    }
  return Promise.resolve(assetMap);
}

async function readDependencies(connection, assetMap) {
  const client = new Client(connection);
  await client.connect()
  for (nm in assetMap) {
    const asset = assetMap[nm];
    let sql = `SELECT * FROM bedrock.dependencies where asset_name = '${nm}';`;
    const res = await client.query(sql)
    for (let i=0; i< res.rowCount; ++i) {
      const d = res.rows[i];
      asset['depends'].push(d['dependency']);
    }
  }
  await client.end();
  return Promise.resolve(assetMap);
}

async function readTasks(connection, assetMap) {
  const client = new Client(connection);
  await client.connect()
  for (nm in assetMap) {
    const asset = assetMap[nm];
    let sql = `SELECT * FROM bedrock.tasks where asset_name = '${nm}' order by seq_number;`;
    const res = await client.query(sql)
    for (let i=0; i < res.rowCount; ++i) {
      const task = res.rows[i];
      let thisTask = {
        type: task['type'],
        active: task['active']
      };
      if (task['type'] === 'table_copy' || task['type'] == 'file_copy') {
        thisTask['source_location'] = task['source'];
        thisTask['target_location'] = task['target'];
      }
      else if (task['type'] === 'sql') {
        thisTask['connection'] = task['target']['connection'];
        thisTask['sql_string'] = task['configuration'];
      }
      else {
        thisTask = task['target']; // Really just noop
      }
      asset['etl_tasks'].push(thisTask);
    }
  }
  await client.end();
  return Promise.resolve(assetMap);
}

lambda_handler = async function (event, context) {
  let dbConnection = null;
  const runMap = await getConnectionObject()
  .then((connection) => {
    dbConnection = connection;
    return readEtlList(connection, event.rungroup)
  })
  .then(assetMap => readDependencies(dbConnection, assetMap))
  .then(assetMap => readTasks(dbConnection, assetMap))
  .then(assetMap => {
    const graph = [];
    const level = {};
    // Set up the array of dependencies and of initial levels
    for (a in assetMap) {
      level[a] = 0;
      graph.push(a);
    }
    let maxLevel = 0;
    while (graph.length > 0) {
      let a = graph.shift();
      let asset = assetMap[a];
      for (let i = 0; i < asset.depends.length; ++i) {
        let depLevel = level[asset.depends[i]]
        if (level[a] <= depLevel) level[a] = depLevel + 1;
        if (level[a] > maxLevel) maxLevel = level[a];
      }
    }
    // Now gather into groups of runsets
    let runs = new Array(maxLevel + 1);
    for (let i = 0; i<maxLevel + 1; ++i) runs[i] = [];
    for (a in level) runs[level[a]].push(assetMap[a]);
    // And create the final run map
    let result = { 'RunSetIsGo': false };
      if (runs.length > 0) {
        result = {
        'runsets': runs,
        'RunSetIsGo': true,
        'success': [],
        'skipped': [],
        'failure': [],
        'results': null,
      }
    };
    return result;
  })
  .catch(err => {
    console.log('Error in lambda_handler', err);
  })
  return runMap;
}

// Uncomment the below to run locally
/*
var event = {'rungroup':'daily'};
try {
  ret = lambda_handler(event, context=null);
}
catch (err) {
  console.log('Error calling lambda_handler: ', err);
}
*/

module.exports = {
  lambda_handler
};
