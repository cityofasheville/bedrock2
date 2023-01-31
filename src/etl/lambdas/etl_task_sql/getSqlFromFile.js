/* eslint-disable no-console */
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// Retrive SQL file from S3
async function getSqlFromFile(filepath) {
  try {
    console.log('Getting SQL file');
    const params = { Bucket: 'managed-data-assets', Key: filepath };
    const data = await s3.getObject(params).promise();
    const sql = data.Body.toString('utf8');

    return sql;
  } catch (err) {
    throw (new Error(`S3 SQL file error: ${filepath}`, err));
  }
}
module.exports = getSqlFromFile;
