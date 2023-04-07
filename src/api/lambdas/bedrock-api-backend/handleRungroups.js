/* eslint-disable no-console */
const { Client } = require("pg");
const pgErrorCodes = require("./pgErrorCodes");

async function getRungroupsList(
  domainName,
  pathElements,
  queryParams,
  connection
) {
  let offset = 0;
  let count = 25;
  let total = -1;
  let where = " where";
  let qPrefix = "?";
  let qParams = "";
  const result = {
    error: false,
    message: "",
    result: null,
  };
  const client = new Client(connection);
  await client.connect().catch((err) => {
    console.log(JSON.stringify(err));
    const errmsg = pgErrorCodes[err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

  // Override start, count, or offset, if set in query
  if ("offset" in queryParams) {
    offset = queryParams.offset;
  }
  if ("count" in queryParams) {
    count = queryParams.count;
    qParams += `${qPrefix}count=${count}`;
    qPrefix = "&";
  }

  // Read the DB
  const sqlParams = [];
  let sql2 = "";
  if ("pattern" in queryParams) {
    const { pattern } = queryParams;
    sql2 += `${where} run_group_name like $1`;
    where = " ";
    sqlParams.push(`%${queryParams.pattern}%`);
    qParams += `${qPrefix}pattern=${pattern}`;
    qPrefix = "&";
  }
  if ("period" in queryParams) {
    qParams += `${qPrefix}period=${queryParams.period}`;
    qPrefix = "&";
    result.message += "Query parameter period not yet implemented. ";
  }
  let sql = `SELECT count(*) FROM bedrock.run_groups  ${sql2}`;
  console.log("run sql1 = ", sql);
  let res = await client.query(sql, sqlParams).catch((err) => {
    const errmsg = pgErrorCodes[err.code];
    console.log(err, errmsg);
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

  if (res.rowCount === 0) {
    throw new Error("No results for count call in getRungroupsList");
  } else {
    total = Number(res.rows[0].count);
  }

  sql = `SELECT * FROM bedrock.run_groups ${sql2}`;
  sql += " order by run_group_name asc";
  sql += ` offset ${offset} limit ${count} `;
  console.log("run sql2 = ", sql);

  res = await client.query(sql, sqlParams).catch((err) => {
    const errmsg = pgErrorCodes[err.code];
    console.log(err, errmsg);
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });
  await client.end();

  if (res.rowCount === 0) {
    result.error = true;
    result.message += "Rungroup not found";
  } else {
    let url = null;
    if (offset + res.rowCount < total) {
      const newOffset = parseInt(offset, 10) + res.rowCount;
      url = `https://${domainName}/${pathElements.join("/")}${qParams}`;
      url += `${qPrefix}offset=${newOffset.toString()}`;
    }
    result.result = {
      items: res.rows,
      offset,
      count: res.rowCount,
      total,
      url,
    };
  }
  return result;
}

async function getRungroup(pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: "",
    result: null,
  };

  const client = new Client(connection);
  await client.connect().catch((err) => {
    console.log(JSON.stringify(err));
    const errmsg = pgErrorCodes[err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

  const sql = "SELECT * FROM bedrock.run_groups where run_group_name like $1";

  const res = await client.query(sql, [pathElements[1]]).catch((err) => {
    const errmsg = pgErrorCodes[err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });
  await client.end();
  if (res.rowCount === 0) {
    result.error = true;
    result.message = "Rungroup not found";
  } else {
    [result.result] = res.rows;
  }
  return result;
}

async function addRungroup(requestBody, pathElements, queryParams, connection) {
  const result = {
    error: false,
    message: "",
    result: null,
  };
  const body = JSON.parse(requestBody);

  // Make sure that we have required information
  if (!("run_group_name" in body) || !("cron_string" in body)) {
    result.error = true;
    result.message =
      "Rungroup lacks required property (one of run_group_name or cron_string)";
    result.result = body;
    return result;
  }
  if (pathElements[1] !== body.run_group_name) {
    result.error = true;
    result.message = `Rungroup name ${pathElements[1]} in path does not match asset name ${body.run_group_name} in body`;
    return result;
  }

  const client = new Client(connection);
  await client.connect().catch((err) => {
    const errmsg = pgErrorCodes[err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });

  const sql = "SELECT * FROM bedrock.run_groups where run_group_name like $1";
  let res = await client.query(sql, [pathElements[1]]).catch((err) => {
    const errmsg = pgErrorCodes[err.code];
    throw new Error([`Postgres error: ${errmsg}`, err]);
  });
  if (res.rowCount > 0) {
    result.error = true;
    result.message = "Rungroup already exists";
    await client.end();
    return result;
  }

  res = await client
    .query(
      "INSERT INTO run_groups (run_group_name, cron_string) VALUES($1, $2)",
      [body.run_group_name, body.cron_string]
    )
    .catch((err) => {
      const errmsg = pgErrorCodes[err.code];
      throw new Error([`Postgres error: ${errmsg}`, err]);
    });
  await client.end();
  if (res.rowCount !== 1) {
    result.error = true;
    result.message = "Unknown error inserting new asset";
    return result;
  }
  result.result = {
    run_group_name: body.run_group_name,
    crong_string: body.cron_string,
  };

  return result;
}

// eslint-disable-next-line no-unused-vars
async function handleRungroups(
  event,
  pathElements,
  queryParams,
  verb,
  connection
) {
  let result = {
    error: false,
    message: "",
    result: null,
  };

  switch (pathElements.length) {
    // GET rungroups
    case 1:
      console.log("Calling getRungroupList");
      result = await getRungroupsList(
        event.requestContext.domainName,
        pathElements,
        queryParams,
        connection
      );
      console.log("Back from getRungroupList");
      break;

    // VERB rungroups/{rungroupname}
    case 2:
      switch (verb) {
        case "GET":
          result = await getRungroup(pathElements, queryParams, connection);
          break;

        case "POST":
        case "POST":
          result = await addRungroup(
            event.body,
            pathElements,
            queryParams,
            connection
          );
          break;

        case "PUT":
          result.message = "Update rungroup not implemented";
          result.error = true;
          break;

        case "DELETE":
          result.message = "Delete rungroup not implemented";
          result.error = true;
          break;

        default:
          result.message = `handleRungroups: unknown verb ${verb}`;
          result.error = true;
          break;
      }
      break;

    default:
      result.message = `Unknown rungroups endpoint: [${pathElements.join()}]`;
      result.error = true;
      break;
  }
  if (result.error) {
    console.log("We have an error but do not know why!");
    console.log(result.message);
  }
  return result;
}

module.exports = handleRungroups;
