const { Transform } = require('stream')

const streamDebug = new Transform({
  transform (chunk, encoding, callback) {
    // console.log(chunk.toString())
    process.stdout.write(chunk.toString() + `
    `);
    this.push(chunk)
    callback()
  }
})

module.exports = streamDebug
