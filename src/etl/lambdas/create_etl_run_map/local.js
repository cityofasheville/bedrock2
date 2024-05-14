import { lambda_handler } from './handler.js';
let event = { rungroup: 'daily', debug: true };

await lambda_handler(event);

