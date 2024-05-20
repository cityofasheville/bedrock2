/* eslint-disable no-console */
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';
import removeHeader from './removeHeader.js';

const s3Region = 'us-east-1';

function fillDateTemplate(template) {
  // Completes template with today's date in parts: YYYY, MM, DD,, HH, mm and/or SS
  let dateParts = {};
  const regex = /\$\{/g;
  const templateString = template.replace(regex, '${dateParts.');
  const today = new Date();

  const day = today.getUTCDate();
  dateParts.DD = (day > 9 ? '' : '0') + day;

  const month = today.getUTCMonth() + 1;
  dateParts.MM = (month > 9 ? '' : '0') + month;

  dateParts.YYYY = today.getUTCFullYear().toString();
  // dateParts.YY = YYYY.slice(2,)

  const hours = today.getUTCHours();
  dateParts.HH = (hours > 9 ? '' : '0') + hours;

  const mins = today.getUTCMinutes();
  dateParts.mm = (mins > 9 ? '' : '0') + mins;

  const secs = today.getUTCSeconds();
  dateParts.SS = (secs > 9 ? '' : '0') + secs;

  return template.replace('${YYYY}', dateParts.YYYY)
    .replace('${MM}', dateParts.MM).replace('${DD}', dateParts.DD)
    .replace('${HH}', dateParts.HH).replace('${mm}', dateParts.mm)
    .replace('${SS}', dateParts.SS);
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
      s3stream = new PassThrough();

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

export default getS3Stream;
