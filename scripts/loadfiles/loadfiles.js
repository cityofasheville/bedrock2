// A ONE TIME LOAD FROM DB to m-d-a
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { Client } = require('pg');
const toposort = require('toposort');
const fs = require('fs');

const { getDBConnection } = require('bedrock_common');

async function readEtlList(connection) {
  let etlList = [];

  const client = new Client(connection);
  await client.connect()
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  const sql = `SELECT * FROM bedrock.etl where active = true;`;
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
    const sql = `SELECT * FROM bedrock.dependencies where asset_name = '${arr[i][0]}';`;
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

async function readAsset(client, assetName) {
  const sql = `SELECT * FROM bedrock.assets where asset_name = '${assetName}';`;
  // eslint-disable-next-line no-await-in-loop
  const res = await client.query(sql)
    .catch((err) => {
      const errmsg = [err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  if (res.rowCount === 0) {
    throw new Error(`Asset ${assetName} not found`);
  }
  const assetData = res.rows[0];
  return assetData;
}

async function readTasks(connection, assetMap) {
  const client = new Client(connection);
  await client.connect();
  const arr = Object.entries(assetMap);

  for (let i = 0; i < arr.length; i += 1) {
    const assetName = arr[i][0];
    const asset = arr[i][1];
    const sql = `SELECT * FROM bedrock.tasks where asset_name = '${assetName}' order by seq_number;`;

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
        if (task?.source?.asset) { // source data is in asset location
          thisTask.source_etl = task.source;
          thisTask.source_assetData = await readAsset(client, task.source.asset);
        }
        if (task?.target?.asset) { // target data is in asset location
          thisTask.target_etl = task.target;
          thisTask.target_assetData = await readAsset(client, task.target.asset);
        }
      } else if (task.type === 'run_lambda' || task.type === 'encrypt') {
        thisTask = task.target;
        thisTask.assetData = await readAsset(client, task.asset_name);
      } else if (task.type === 'sql') {
        thisTask.assetData = await readAsset(client, task.asset_name);
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

////////////////////////////////////////////
function writeAsset(assetData, depends) {
  let name = assetData.asset_name;
  // create dir
  if (!fs.existsSync('assets/' + name)) {
    fs.mkdirSync('assets/' + name);
  }
  let assetcontent = {
    name: assetData.asset_name,
    active: assetData.active,
    description: assetData.description,
    location: assetData.location,
    depends: depends ? depends : [],
    tags: assetData.tags ? assetData.tags : [],
  };
  // merge exisitng file (fix dependencies when asset is both a target and a source)
  if (fs.existsSync('assets/' + name + '/' + name + '.json')) {
    let existing = JSON.parse(fs.readFileSync('assets/' + name + '/' + name + '.json'));
    assetcontent = { ...assetcontent, ...existing };
  }

  fs.writeFileSync('assets/' + name + '/' + name + '.json', JSON.stringify(assetcontent, null, 2));
}
////////////////////////////////////////////

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

    // clear assets dir
    fs.readdirSync('./assets').forEach(f => fs.rmSync(`./assets/${f}`, { recursive: true }));
    runs.forEach((topogrp) => {
      topogrp.forEach((asset) => {
        console.log(`Processing ${asset.name} :${JSON.stringify(asset)}`); // 
        let new_tasks = [];
        if (!fs.existsSync('assets/' + asset.name)) {
          fs.mkdirSync('assets/' + asset.name);
        }
        asset.etl_tasks.forEach((task) => {
          let new_task = {
            type: task.type,
            active: task.active,
          };
          if (task.type === 'table_copy' || task.type === 'file_copy') {
            new_task.source_location = task.source_etl;
            new_task.target_location = task.target_etl;
            new_tasks.push(new_task);
            //writeAsset(assetData, depends) 
            writeAsset(task.source_assetData, null);
            writeAsset(task.target_assetData, asset.depends);
          } else if (task.type === 'sql') {
            new_task = { ...task };
            delete new_task.assetData;
            new_tasks.push(new_task);
            writeAsset(task.assetData, asset.depends);
          } else if (task.type === 'encrypt' || task.type === 'run_lambda') {
            new_task = { ...task };
            delete new_task.assetData;
            new_tasks.push(new_task);
            writeAsset(task.assetData, asset.depends);
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
    console.log('Error: ', res);
    console.log(res);
  }
};

(async () => {
  await lambda_handler();
  process.exit();
})();
