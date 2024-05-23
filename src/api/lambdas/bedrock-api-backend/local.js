import { lambda_handler } from './handler.js';
let event = {
  requestContext: {
    http: {
      method: 'GET',
      path: '/run_groups',
    },
  },
};

(async function go() {
  let ret = await lambda_handler(event);
  console.log(JSON.stringify(ret,null,2));
})();