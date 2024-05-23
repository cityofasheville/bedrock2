import { lambda_handler } from './handler.js';
let event = { run_group: 'daily', debug: true };

await lambda_handler(event);

