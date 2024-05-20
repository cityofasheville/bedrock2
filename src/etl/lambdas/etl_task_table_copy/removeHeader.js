import { Transform } from 'stream';

function removeHeader() {
  let buff = '';
  let removed = false;
  return new Transform({
    transform(chunk, encoding, callback) {
      if (removed) {
        this.push(chunk);
      } else {
        buff += chunk.toString();
        if (buff.indexOf('\n') !== -1) {
          this.push(buff.slice(buff.indexOf('\n') + 1));
          removed = true;
        }
      }
      callback();
    },
  });
}

export default removeHeader;
