var AWS = require("aws-sdk")
var s3 = new AWS.S3({apiVersion: '2006-03-01'})

// Retrive SQL file from S3
async function get_sql_from_file(filepath) {
    try {
        console.log("Getting SQL file")
        const params = {Bucket: 'managed-data-assets', Key: filepath}
        let data = await s3.getObject(params).promise()
        let sql = data.Body.toString('utf8')

        return sql
    }
    catch(err) {
        throw [`S3 SQL file error: ${filepath}`,err]
    }
}
module.exports = get_sql_from_file