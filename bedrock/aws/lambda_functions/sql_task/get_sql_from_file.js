var AWS = require("aws-sdk")
var s3 = new AWS.S3({apiVersion: '2006-03-01'})

async function get_sql_from_file(filepath) {
    const params = {Bucket: 'managed-data-assets-dev', Key: filepath}
    let data = await s3.getObject(params).promise()
    let sql = data.Body.toString('utf8')

    return sql
}

module.exports = get_sql_from_file