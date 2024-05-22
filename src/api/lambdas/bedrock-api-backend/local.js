// import { lambda_handler } from './handler.js';
const lambda_handler = require('./handler.js').lambda_handler;
let event = {
  requestContext: {
    http: {
      method: 'GET',
      path: '/assets',
    },
  },
};

(async function go() {
  let ret = await lambda_handler(event);
  console.log(JSON.stringify(ret,null,2));
})();