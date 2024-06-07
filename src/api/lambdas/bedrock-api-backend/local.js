import { createServer } from "http";
import { lambda_handler } from './handler.js';

const host = 'localhost';
const port = 8000;

const requestListener = async function (req, res) {
  let event = {
    requestContext: {
      http: {
        method: req.method,
        path: req.url
      }
    }
  };
  let ret = await lambda_handler(event);
  res.setHeader("Content-Type", "application/json");
  res.writeHead(200);
  res.end(JSON.stringify(ret));
};

const server = createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
