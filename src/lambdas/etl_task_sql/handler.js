const pgSql = require('./pgSql')
const ssSql = require('./ssSql')
const getConnection = require('./getConnection')
// const getSqlFromFile = require('./getSqlFromFile')

exports.lambda_handler = async function (event, context) {
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