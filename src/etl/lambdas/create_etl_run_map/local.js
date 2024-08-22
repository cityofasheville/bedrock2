import { lambda_handler } from './handler.js';
import { readFile } from 'fs/promises';

let event = JSON.parse(await readFile("localtest.json", "utf8"));

let results = await lambda_handler(event);
console.log( JSON.stringify(results, null, 2) );
