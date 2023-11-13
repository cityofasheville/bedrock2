/* eslint-disable no-console */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: 'us-east-1' });

// Retrive SQL file from S3
async function getSqlFromFile(filepath) {
  try {
    console.log('Getting SQL file');
    const params = { Bucket: 'managed-data-assets', Key: filepath };
    const downloadCommand = new GetObjectCommand(params);
    const { Body } = await s3Client.send(downloadCommand);
    const sql = Body.toString('utf8');
    console.log(sql);
    return sql;
  } catch (err) {
    throw (new Error(`S3 SQL file error: ${filepath}`, err));
  }
}

module.exports = getSqlFromFile;
