var AWS = require("aws-sdk");
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

async function get_db_defs() { // Q: how to access encrypted run/bedrock_connections.json?
    const params = {Bucket: 'managed-data-assets-dev', Key: 'run/test_connections.json'};
    let data = await s3.getObject(params).promise();
    let db_defs = JSON.parse(data.Body.toString('utf8')); 

    return db_defs
}

module.exports = get_db_defs