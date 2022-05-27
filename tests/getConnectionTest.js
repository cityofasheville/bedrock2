var AWS = require('aws-sdk'),
    region = "us-east-1",
    secret;

function getConnection (secretName) {
    return new Promise((resolve,reject) => {
        if(secretName === 'test_pg1' || secretName === 'test_pg2') {resolve (testVals(secretName))}
        var client = new AWS.SecretsManager({
            region: region
        })
        client.getSecretValue({SecretId: secretName}, function(err, data) {
            if (err) {
                reject(`Connection string ${secretName} not found: ${err.code}` );
            }else{
                if ('SecretString' in data) {
                    secret = data.SecretString;
                    resolve(JSON.parse(secret))
                }
                else {
                    reject("Connection secret is binary, should be JSON")
                }
            }
        });        
    })
}

function testVals(secretName) {
    if(secretName === 'test_pg1') {
        return({
            type: 'postgresql',
            host: 'docker.for.mac.localhost',
            port: 5432,
            database: 'postgres',
            username: 'postgres',
            password: 'P@55w0rd'
          })            
    }
    if(secretName === 'test_pg2') {
        return({
            type: 'postgresql',
            host: 'docker.for.mac.localhost',
            port: 5430,
            database: 'postgres',
            username: 'postgres',
            password: 'P@55w0rd'
          })            
    }
}

// This allows module to be called directly from command line for testing
if (require.main === module) {
    getConnection('pubrecdb1/mdastore1/dbadmin')
    .then(conn=>{
        console.log(conn)
    })
    getConnection('test_pg1')
    .then(conn=>{
        console.log(conn)
    })
  }

module.exports = getConnection