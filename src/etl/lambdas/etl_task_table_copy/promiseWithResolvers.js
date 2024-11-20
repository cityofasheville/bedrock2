// In Node 22, we will be able to use Promise.withResolvers() insted of this helper file.
// let { promise, resolve, reject } = Promise.withResolvers();

let resolve, reject;
const promise = new Promise((res, rej) => { // Promise constructor to return results of the stream
  resolve = res;
  reject = rej;
});

export { promise, resolve, reject };