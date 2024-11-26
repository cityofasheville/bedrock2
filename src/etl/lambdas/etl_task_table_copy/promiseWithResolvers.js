// In Node 22, we will be able to use Promise.withResolvers() instead of this helper file.
// let { promise, resolve, reject } = Promise.withResolvers();

function createPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
export { createPromise };