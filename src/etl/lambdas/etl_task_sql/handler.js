const { getConnection } = require('bedrock_common');
const pgSql = require('./pgSql');
const ssSql = require('./ssSql');

function formatRes(code, result) {
  return {
    statusCode: code,
    body: {
      lambda_output: result,
    },
  };
}

exports.lambda_handler = async function x(event, context) {
  const task = new Promise((resolve) => {
    try {
      const etl = event.ETLJob.etl_tasks[event.TaskIndex];
      if (!etl.active) {
        resolve(formatRes(200, 'Inactive: skipped'));
      } else {
        const sql = etl.sql_string;
        getConnection(etl.connection)
          .then((connection) => {
            if (connection.type === 'postgresql') {
              pgSql(connection, sql)
                .then((result) => {
                  resolve(formatRes(200, result));
                });
            } else if (connection.type === 'sqlserver') {
              ssSql(connection, sql)
                .then((result) => {
                  resolve(formatRes(200, result));
                });
            } else {
              throw (new Error('Invalid DB Type'));
            }
          });
      }
    } catch (err) {
      resolve(formatRes(500, err));
    }
  });

  // timeout task
  const timeleft = context.getRemainingTimeInMillis() - 300;
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft / 1000)} seconds` }), timeleft);
  });
  // race the timeout task with the real task
  return Promise.race([task, timeout])
    .then((res) => res);
};
