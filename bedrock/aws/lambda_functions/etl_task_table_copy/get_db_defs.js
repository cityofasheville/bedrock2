var AWS = require("aws-sdk");
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

async function get_db_defs() {
    try{
        console.log("Getting connection file")
        const params = {Bucket: 'managed-data-assets', Key: 'run/bedrock_connections.json'}; // test_connections_docker.json bedrock_connections.json
        let data = await s3.getObject(params).promise();
        let db_defs = JSON.parse(data.Body.toString('utf8')); 

        return db_defs
    } catch (err) {
        throw ["S3 Bedrock Connection file error",err]
    }
}

module.exports = get_db_defs