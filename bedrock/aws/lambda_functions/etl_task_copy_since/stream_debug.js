const { Transform } = require('stream');

const stream_debug = new Transform({
  transform(chunk, encoding, callback) {
    console.log(chunk.toString())  
    this.push(chunk);
    callback();
  }
});

module.exports = stream_debug
