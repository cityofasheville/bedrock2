var AWS = require("aws-sdk");
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

async function get_db_defs() {
    try{
        const params = {Bucket: 'managed-data-assets', Key: 'run/bedrock_connections.json'}; // 'run/test_connections_docker.json'
        let data = await s3.getObject(params).promise();
        let db_defs = JSON.parse(data.Body.toString('utf8')); 

        return db_defs
    } catch (err) {
        throw err
    }
}

module.exports = get_db_defs