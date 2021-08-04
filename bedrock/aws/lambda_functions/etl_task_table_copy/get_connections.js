const AWS = require('aws-sdk')
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

async function get_connections() {
  try {
    console.log('Getting connection file')
    const params = { Bucket: 'managed-data-assets', Key: 'run/bedrock_connections.json' } // test_connections_docker.json bedrock_connections.json
    const data = await s3.getObject(params).promise()
    const connections = JSON.parse(data.Body.toString('utf8'))

    return connections
  } catch (err) {
    throw ['S3 Bedrock Connection file error', err]
  }
}

module.exports = get_connections