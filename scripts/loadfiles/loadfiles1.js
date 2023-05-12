// A ONE TIME LOAD FROM DB to m-d-a

/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const toposort = require('toposort');
const fs = require('fs');

const TIME_INTERVAL = 15; // Frequency - must match Eventbridge scheduler

let debug = true;

const { getDBConnection } = require('./bedrock_NOGITHUB');



async function readEtlList(connection) {
  let etlList = [];

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });

  const sql = `SELECT * FROM bedrock.zloop_etl where  active = true;`; //asset_name = 'ad_info.lib' and
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  etlList = res.rows;
  await client.end();


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
    const sql = `SELECT * FROM bedrock.zloop_dependencies where asset_name = '${arr[i][0]}';`;
    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
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

async function readLocationFromAsset(client, assetName) {
  // final target data is in asset location
  const sql = `SELECT location FROM bedrock.zloop_assets where asset_name = '${assetName}';`;
  // eslint-disable-next-line no-await-in-loop
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  if (res.rowCount === 0) {
    throw new Error(`Asset ${assetName} not found`);
  }
  const locData = res.rows[0].location;
  return locData;
}

async function readTasks(connection, assetMap) {
  const client = new Client(connection);
  await client.connect();
  const arr = Object.entries(assetMap);

  for (let i = 0; i < arr.length; i += 1) {
    const assetName = arr[i][0];
    const asset = arr[i][1];
    const sql = `SELECT * FROM bedrock.zloop_tasks where asset_name = '${assetName}' order by seq_number;`;

    // eslint-disable-next-line no-await-in-loop
    const res = await client.query(sql)
      .catch((err) => {
        const errmsg = [err.code];
        throw new Error([`Postgres error: ${errmsg}`, err]);
      });
    for (let j = 0; j < res.rowCount; j += 1) {
      const task = res.rows[j];
      let thisTask = {
        type: task.type,
        active: task.active,
      };

      if (task.type === 'table_copy' || task.type === 'file_copy') {
        let sourceLoc;
        let targetLoc;
        if (task?.source?.asset) { // source data is in asset location
          sourceLoc = await readLocationFromAsset(client, task.source.asset);
        }
        if (task?.target?.asset) { // target data is in asset location
          targetLoc = await readLocationFromAsset(client, task.target.asset);
        }
        thisTask.source_location = { ...task.source, ...sourceLoc };
        thisTask.target_location = { ...task.target, ...targetLoc };
      } else if (task.type === 'run_lambda' || task.type === 'encrypt') {
        thisTask = task.target;
        thisTask.assetLoc = await readLocationFromAsset(client, task.asset_name);
      } else if (task.type === 'sql') {
        thisTask.assetLoc = await readLocationFromAsset(client, task.asset_name);
        thisTask.connection = task.target.connection;
        thisTask.sql_string = task.configuration;
      } else {
        thisTask.source_location = task.source;
        thisTask.target_location = task.target;
      }
      asset.etl_tasks.push(thisTask);
    }
  }
  await client.end();
  return Promise.resolve(assetMap);
}


// eslint-disable-next-line camelcase
const lambda_handler = async function x() {
  try {
    const dbConnection = await getDBConnection();

    let assetMap = await readEtlList(dbConnection);
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

    // console.log(JSON.stringify(runs,null,2));
    // clear assets dir
    fs.readdirSync('./assets').forEach(f => fs.rmSync(`./assets/${f}`,{recursive: true}));
    runs.forEach((topogrp) => {
      topogrp.forEach((asset) => {
        let new_tasks = [];
        if (!fs.existsSync('assets/' + asset.name)) {
          fs.mkdirSync('assets/' + asset.name);
        }
        asset.etl_tasks.forEach((task) => {
          let new_task = { ...task };
          if (task.type === 'table_copy' || task.type === 'file_copy') {
            new_task.source_location = { 'asset': task.source_location.asset };
            new_task.target_location = { 'asset': task.target_location.asset };
            new_tasks.push(new_task);
            writeAsset(task.source_location.asset, task.source_location, null);
            writeAsset(task.target_location.asset, task.target_location, asset.depends);
          } else if (task.type === 'sql') {
            delete new_task.assetLoc;
            new_tasks.push(new_task);
            writeAsset(asset.name, task.assetLoc, asset.depends);
          } else if (task.type === 'encrypt' || task.type === 'run_lambda') {
            delete new_task.assetLoc;
            new_tasks.push(new_task);
            writeAsset(asset.name, task.assetLoc, asset.depends);
          }
        })
        const etlcontent = {
          'name': asset.name,
          'run_group': asset.run_group,
          'tasks': new_tasks,
        }
        fs.writeFileSync('assets/' + asset.name + '/' + asset.name + '.ETL.json', JSON.stringify(etlcontent, null, 2));
      })
    })
  } catch (err) {
    const res = JSON.stringify(err, Object.getOwnPropertyNames(err));
    if (debug) console.log('Error: ', res);
    console.log(res);
  }
};

////////////////////////////////////////////
function writeAsset(name, location, depends) {
  // console.log(JSON.stringify(location,null,2));
  // create dir
  if (!fs.existsSync('assets/' + name)) {
    fs.mkdirSync('assets/' + name);
  }
  let assetcontent = {
    'name': name,
    'active': true,
    'description': '',
    'location': location,
    'depends': depends ? depends : [],
    'tags': [],
  };
  // merge exisitng file (fix dependencies when asset is both a target and a source)
  if (fs.existsSync('assets/' + name + '/' + name + '.json')) {
    let existing = JSON.parse(fs.readFileSync('assets/' + name + '/' + name + '.json'));
    assetcontent = { ...assetcontent, ...existing };
  }

  fs.writeFileSync('assets/' + name + '/' + name + '.json', JSON.stringify(assetcontent, null, 2));
}
////////////////////////////////////////////

/* Set debug to true to run locally */
debug = true;
if (debug) {
  (async () => {
    await lambda_handler();
    process.exit();
  })();
}

module.exports = {
  // eslint-disable-next-line camelcase
  lambda_handler,
};
