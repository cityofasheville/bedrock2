/* eslint-disable no-console */
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const stream = require('stream');
const removeHeader = require('./removeHeader');

const s3Region = 'us-east-1';

function fillDateTemplate(template) {
  // Completes template with today's date in parts: YYYY, MM, DD,, HH, mm and/or SS
  // eg. filename_${YYYY} returns filename_2022
  // Warning! Dangerous eval in code, dont allow untrusted users.
  const regex = /\$\{/g;
  const templateString = template.replace(regex, '${this.');
  const today = new Date();

  const day = today.getUTCDate();
  this.DD = (day > 9 ? '' : '0') + day;

  const month = today.getUTCMonth() + 1;
  this.MM = (month > 9 ? '' : '0') + month;

  this.YYYY = today.getUTCFullYear().toString();
  // this.YY = YYYY.slice(2,)

  const hours = today.getUTCHours();
  this.HH = (hours > 9 ? '' : '0') + hours;

  const mins = today.getUTCMinutes();
  this.mm = (mins > 9 ? '' : '0') + mins;

  const secs = today.getUTCSeconds();
  this.SS = (secs > 9 ? '' : '0') + secs;

  // eslint-disable-next-line no-new-func
  return new Function(`return \`${templateString}\`;`).call(this);
}

async function getS3Stream(location) {
  try {
    const s3Client = new S3Client({ region: s3Region });
    const s3Key = location.path + fillDateTemplate(location.filename);
    const bucket = location.conn_info.s3_bucket;
    let s3stream;
    let promise;
    if (location.fromto === 'source_location') {
      promise = Promise.resolve();
      const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key }));
      s3stream = response.Body;
      if (location.removeheaders) {
        s3stream = s3stream.pipe(removeHeader());
      }
      console.log('Copy from S3 Bucket: ', bucket, s3Key);
    } else if (location.fromto === 'target_location') {
      s3stream = new stream.PassThrough();

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucket,
          Key: s3Key,
          Body: s3stream,
          ContentType: 'text/plain',
        },
      });
      promise = upload.done();
      console.log('Copy to S3 Bucket: ', bucket, s3Key);
    }
    return ({ stream: s3stream, promise });
  } catch (err) {
    console.log('err::', err);
    throw (new Error(err));
  }
}

module.exports = getS3Stream;
