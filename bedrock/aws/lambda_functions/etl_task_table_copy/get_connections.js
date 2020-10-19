var AWS = require("aws-sdk");
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

async function get_connections() {
    return {
        "localss1": {
            "type": "sqlserver",
            "host": "docker.for.mac.localhost",
            "port": 1433,
            "database": "ss1",
            "username": "sa",
            "password": "P@55w0rd"
        },
        "localpg1": {
            "type": "postgresql",
            "host": "docker.for.mac.localhost",
            "port": 5432,
            "database": "postgres",
            "username": "postgres",
            "password": "P@55w0rd"
        },
        "localpg2": {
            "type": "postgresql",
            "host": "docker.for.mac.localhost",
            "port": 5430,
            "database": "postgres",
            "username": "postgres",
            "password": "P@55w0rd"
        }
    }


    try{
        console.log("Getting connection file")
        const params = {Bucket: 'managed-data-assets', Key: 'run/bedrock_connections.json'}; // test_connections_docker.json bedrock_connections.json
        let data = await s3.getObject(params).promise();
        let connections = JSON.parse(data.Body.toString('utf8')); 

        return connections
    } catch (err) {
        throw ["S3 Bedrock Connection file error",err]
    }
}

module.exports = get_connections