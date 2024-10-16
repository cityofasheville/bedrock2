import pgpkg from 'pg';
const { Client } = pgpkg;
import { readFileSync } from 'fs';
import { getDBConnection } from 'bedrock_common';

let lambda_handler = async function (event, context) {
  process.env.BEDROCK_DB_PASSWORD = process.env.BEDROCK_DB_PASSWORD.replace(/"/g,"");
  const connection = await getDBConnection();

  let sqltemplate = readFileSync('./createNewBedrockDB.sql').toString();
  let sql = eval('`' + sqltemplate + '`');
  // console.log('The sql is ', sql);
  // console.log('The connection is ', connection);
  const client = new Client(connection);
  await client.connect()
  const res = await client.query(sql);

  await client.end()
  return res;
}

lambda_handler() 
