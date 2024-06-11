import { lambda_handler } from './handler.js';
// let event = { run_group: 'vxsmart_balances', debug: true };
let event = { one_asset: 'permit_tasks.lib', debug: true };

await lambda_handler(event);

