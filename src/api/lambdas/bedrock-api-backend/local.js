import { lambda_handler } from './handler.js';
let event = {
  requestContext: {
    http: {
      method: 'GET',
      path: '/rungroups',
    },
  },
};

(async function go() {
  let ret = await lambda_handler(event);
  console.log(JSON.stringify(ret,null,2));
})();