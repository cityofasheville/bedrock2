import { lambda_handler } from './handler.js';
import { readFile } from 'fs/promises';

let event = JSON.parse(await readFile("localtest.json", "utf8"));

let context = {
  getRemainingTimeInMillis: () => 900_000
}
console.log( await lambda_handler(event, context));
