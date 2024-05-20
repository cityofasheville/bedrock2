import { Transform } from 'stream';

const streamDebug = new Transform({
  transform(chunk, encoding, callback) {
    // console.log(chunk.toString())
    process.stdout.write(`${chunk.toString()}
    `);
    this.push(chunk);
    callback();
  },
});

export default streamDebug;
