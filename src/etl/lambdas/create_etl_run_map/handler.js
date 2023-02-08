/* eslint-disable no-console */
const { Client } = require('pg');
const awsCronParser = require('aws-cron-parser');
const toposort = require('toposort');
const getConnection = require('./getConnection');

const TIME_INTERVAL = 15; // Frequency - must match Eventbridge scheduler

let debug = false;

function formatRes(code, result) {
  return {
    statusCode: code,
    body: result,
  };
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
        (cpValue) => {
          connection = {
            host: cpValue.host,
            port: cpValue.port,
            user: cpValue.username,
            password: cpValue.password,
            database: cpValue.database,
            max: 10,
            idleTimeoutMillis: 10000,
          };
          return connection;
        },
      )
      .catch((err) => { // Just pass it on.
        throw err;
      });
  }
  return connection;
}

const pgErrorCodes = require('./pgErrorCodes');

async function readEtlList(connection, rungroups) {
  let etlList = [];
  if (rungroups.length > 0) {
    const client = new Client(connection);
    await client.connect()
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    const rgString = rungroups.reduce((accumulator, currentValue) => {
      const sep = (accumulator !== '') ? ', ' : '';
      return `${accumulator + sep}'${currentValue}'`;
    }, '');
    const sql = `SELECT * FROM bedrock.etl where run_group in (${rgString}) and active = true;`;
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    etlList = res.rows;
    await client.end();
  }

  const assetMap = {};
  const arr = Object.values(etlList);
  for (let i = 0; i < arr.length; i += 1) {
    const asset = arr[i];
    assetMap[asset.asset_name] = {
      name: asset.asset_name,
      run_group: asset.run_group,
      depends: [],
      etl_tasks: [],
    };
  }
  return Promise.resolve(assetMap);
}

async function readDependencies(connection, assetMap) {
  const client = new Client(connection);
  await client.connect();
  const arr = Object.entries(assetMap);
  for (let i = 0; i < arr.length; i += 1) {
    const asset = arr[i][1];
    const sql = `SELECT * FROM bedrock.dependencies where asset_name = '${arr[i][0]}';`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const d = res.rows[j];
      asset.depends.push(d.dependency);
    }
  }
  await client.end();
  return Promise.resolve(assetMap);
}

async function readTasks(connection, assetMap) {
  const client = new Client(connection);
  await client.connect();

  const arr = Object.entries(assetMap);
  for (let i = 0; i < arr.length; i += 1) {
    const asset = arr[i][1];
    const sql = `SELECT * FROM bedrock.tasks where asset_name = '${arr[i][0]}' order by seq_number;`;

    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = pgErrorCodes[err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const task = res.rows[j];
      let thisTask = {
        type: task.type,
        active: task.active,
      };
      if (task.type === 'table_copy' || task.type === 'file_copy') {
        thisTask.source_location = task.source;
        thisTask.target_location = task.target;
      } else if (task.type === 'sql') {
        thisTask.connection = task.target.connection;
        thisTask.sql_string = task.configuration;
      } else {
        thisTask = task.target; // Really just noop
      }
      asset.etl_tasks.push(thisTask);
    }
  }
  await client.end();
  return Promise.resolve(assetMap);
}

async function getRungroups(connection) {
  const client = new Client(connection);
  const sql = 'SELECT run_group_name, cron_string FROM bedrock.run_groups;';
  await client.connect();
  return client.query(sql)
    .then((res) => {
      const rungroups = [];
      for (let i = 0; i < res.rowCount; i += 1) {
        const cname = res.rows[i].run_group_name;
        const cstring = res.rows[i].cron_string;
        const cron = awsCronParser.parse(cstring);
        const minutes = TIME_INTERVAL;
        const ms = 1000 * 60 * minutes;
        const curTime = new Date();
        const latestPreviousTimeMS = (awsCronParser.prev(cron, curTime)).getTime();
        const endPreviousTimeSlot = latestPreviousTimeMS + ms;
        // See if current time falls within TIME_INTERVAL following the latest run time
        if (endPreviousTimeSlot >= curTime.getTime()) {
          rungroups.push(cname);
        }
      }
      if (debug) console.log('Selected rungroups: ', rungroups);
      return Promise.resolve(rungroups);
    })
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
}

// eslint-disable-next-line camelcase
const lambda_handler = async function x(event) {
  try {
    const dbConnection = await getConnectionObject();
    let rungroups = [event.rungroup];
    if (event.rungroup === 'UseCronStrings') {
      rungroups = await getRungroups(dbConnection);
    }
    let assetMap = await readEtlList(dbConnection, rungroups);
    assetMap = await readDependencies(dbConnection, assetMap);
    assetMap = await readTasks(dbConnection, assetMap);

    const graph = [];
    const level = {};
    // Set up the array of dependencies and of initial levels
    Object.entries(assetMap).forEach((e) => {
      const asset = e[1];
      level[e[0]] = 0;
      for (let i = 0; i < asset.depends.length; i += 1) {
        // Test here is in case nm depends on an asset that has no etl
        // job. The dependency information is then not relevant to the
        // etl run, though it might be important in an application such
        // as change management.
        if (asset.depends[i] in assetMap) {
          graph.push([asset.depends[i], e[0]]);
        }
      }
    });

    let runs = [];
    if (graph.length > 0) {
      const sorted = toposort(graph);
      let maxLevel = 0;
      while (sorted.length > 0) {
        const a = sorted.shift();
        const asset = assetMap[a];
        for (let i = 0; i < asset.depends.length; i += 1) {
          const depLevel = level[asset.depends[i]];
          if (level[a] <= depLevel) level[a] = depLevel + 1;
          if (level[a] > maxLevel) maxLevel = level[a];
        }
      }
      // Now gather into groups of runsets
      runs = new Array(maxLevel + 1);
      for (let i = 0; i < maxLevel + 1; i += 1) runs[i] = [];
      Object.keys(level).forEach((a) => runs[level[a]].push(assetMap[a]));
    } else {
      Object.values(assetMap).forEach((asset) => {
        runs.push([asset]);
      });
    }
    // And create the final run map
    let result = { RunSetIsGo: false };
    if (runs.length > 0) {
      result = {
        runsets: runs,
        RunSetIsGo: true,
        success: [],
        skipped: [],
        failure: [],
        results: null,
      };
    }

    const finalResult = (formatRes(200, result));
    if (debug) console.log(JSON.stringify(finalResult));
    return finalResult;
  } catch (err) {
    const res = formatRes(500, JSON.stringify(err, Object.getOwnPropertyNames(err)));
    if (debug) console.log('Error: ', res);
    return res;
  }
};
/* Set debug to true to run locally */
debug = false;
let event = {};
if (debug) {
  event = { rungroup: 'UseCronStrings' };
  (async () => {
    await lambda_handler(event);
    process.exit();
  })();
}

module.exports = {
  // eslint-disable-next-line camelcase
  lambda_handler,
};
