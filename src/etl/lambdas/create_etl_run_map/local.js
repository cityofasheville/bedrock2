/* eslint-disable import/extensions */
// eslint-disable-next-line camelcase
import { lambda_handler } from './handler.js';

// const event = { run_group: 'vxsmart_balances', debug: true };
const event = { one_asset: 'ad_info.lib', debug: true };

await lambda_handler(event);
