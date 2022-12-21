const { Client } = require('pg')
const getConnection = require('./getConnection')
const awsCronParser = require('aws-cron-parser');
const toposort = require('toposort');
let debug = false;

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

  // If BEDROCK_DB_HOST is not in the environment, assume normal bedrock DB
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
    )
    .catch(err => { // Just pass it on.
      throw err;
    });
  }
  return connection;
}

const pgErrorCodes = require("./pgErrorCodes")

async function readEtlList(connection, rungroups) {
  let etlList = [];
  if (rungroups.length > 0) {
    const client = new Client(connection);
    await client.connect()
    .catch((err) => {
      let errmsg = pgErrorCodes[err.code]
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
    let rgString = rungroups.reduce(
        (accumulator, currentValue) => {
          let sep = (accumulator !== '') ? ', ': ''
          return accumulator + sep + "'" + currentValue + "'"
        }, ''
    );
    let sql = `SELECT * FROM bedrock.etl where run_group in (${rgString}) and active = true;`;
    const res = await client.query(sql)
    .catch (err => {
      let errmsg = pgErrorCodes[err.code]
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
    etlList = res.rows;
    await client.end();
  }
  let assetMap = {};
  for (index in etlList) {
    const asset = etlList[index];
    assetMap[asset['asset_name']] = {
      'name': asset['asset_name'],
      'run_group': asset['run_group'],
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
    .catch (err => {
      let errmsg = pgErrorCodes[err.code]
      throw new Error([`Postgres error: ${errmsg}`, err]);
      }
    );
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
    .catch (err => {
      let errmsg = pgErrorCodes[err.code]
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
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

async function getRungroups(connection) {
  const client = new Client(connection);
  let sql = `SELECT run_group_name,	cron_string FROM bedrock.run_groups;`;
  await client.connect();
  return await client.query(sql)
  .then(res => {
    const rungroups = [];
    for (let i = 0; i < res.rowCount; ++i) {
      const cname = res.rows[i]['run_group_name'];
      const cstring = res.rows[i]['cron_string'];
      const cron = awsCronParser.parse(cstring);
      const minutes = 15;
      const ms = 1000 * 60 * minutes;
      let curTime = new Date(Math.round(new Date().getTime() / ms) * ms);
      let nextTime = new Date(curTime);
      const delta = minutes * 60 * 1000;
      nextTime.setTime(nextTime.getTime() + delta);
      let occurrence = awsCronParser.next(cron, curTime);
      if (occurrence.getTime() < nextTime.getTime()) {
        rungroups.push(cname);
      }
    }
    if (debug) console.log('Selected rungroups: ', rungroups);
    return Promise.resolve(rungroups);
  })
  .catch (err => {
    let errmsg = pgErrorCodes[err.code]
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

}

lambda_handler = async function (event, context) {
  let dbConnection = null;
  try {
    const runMap = await getConnectionObject()
    .then(async (connection) => {
      let rungroups = [event.rungroup];
      dbConnection = connection;
      if (event.rungroup === undefined) {
        rungroups = await getRungroups(dbConnection);
      }
      return Promise.resolve(rungroups);
    })
    .then(rungroups => {
      return readEtlList(dbConnection, rungroups)
    })
    .then(assetMap => readDependencies(dbConnection, assetMap))
    .then(assetMap => readTasks(dbConnection, assetMap))
    .then(assetMap => {
      const graph = [];
      const level = {};
      // Set up the array of dependencies and of initial levels
      for (a in assetMap) {
        let asset = assetMap[a];
        level[a] = 0;
        for (let i = 0; i < asset.depends.length; ++i) {
          graph.push([asset.depends[i], a]);
        }
      }

      let runs = [];
      if (graph.length > 0) {
        const sorted = toposort(graph);
        let maxLevel = 0;
        while (sorted.length > 0) {
          let a = sorted.shift();
          let asset = assetMap[a];
          for (let i = 0; i < asset.depends.length; ++i) {
            let depLevel = level[asset.depends[i]]
            if (level[a] <= depLevel) level[a] = depLevel + 1;
            if (level[a] > maxLevel) maxLevel = level[a];
          }
        }
        // Now gather into groups of runsets
        runs = new Array(maxLevel + 1);
        for (let i = 0; i<maxLevel + 1; ++i) runs[i] = [];
        for (a in level) runs[level[a]].push(assetMap[a]);
      }
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

      const finalResult = (formatRes(200, result));
      if (debug) console.log(JSON.stringify(finalResult));
      return Promise.resolve(finalResult);
    })
    .catch(err => {
      throw err;
    })
  }
  catch (err) {
    let res = formatRes(500, JSON.stringify(err, Object.getOwnPropertyNames(err)));
    if (debug) console.log('Error: ', res);
    return Promise.resolve(res);
  }
}
/* Uncomment next statement to run locally */
// debug = 1;
let event = {};
// event = {'rungroup':'daily'};
if (debug) {
  (async () => {
    await lambda_handler(event, context=null);
    process.exit();
  })();
}


module.exports = {
  lambda_handler
};
