var AWS = require("aws-sdk");
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

function get_db_defs() {
    return new Promise(async (resolve, reject) => {
        try { 
            const params = {Bucket: 'managed-data-assets-dev', Key: 'run/test_connections.json'}
            let data = await s3.getObject(params).promise()
            let db_defs = JSON.parse(data.Body.toString('utf8'));

            resolve( db_defs )
        } catch (error) {
            console.log(error)
            reject()
        }
    })
}

module.exports = get_db_defs
