import { createServer } from "http";
import { lambda_handler } from './handler.js';
import localtest from './localtest.json' with { type: "json" };

const host = 'localhost';
const port = 8000;

const requestListener = async function (req, res) {

  process.env.API_KEY = localtest.API_KEY;

  let event = {
    headers : {
      authorization: req.headers.authorization
    },
    requestContext: {
      http: {
        method: req.method,
        path: req.url
      }
    }
  };

  let ret = await lambda_handler(event);
  for(const header in ret.headers) {
    res.setHeader(header, ret.headers[header]);
  }
  res.writeHead(ret.statusCode);
  res.end(ret.body);
};

const server = createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
