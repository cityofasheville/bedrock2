// https://stackoverflow.com/questions/53478200/is-there-any-way-to-catch-aws-lambda-timed-out-error-in-code-level/53478273
module.exports.myFunction = async (event) => {

  // your real task
  const task = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 200, message: 'Task finished.' }), 1000);
  })

  // add a new "task": timeout 
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 500, message: 'Task timed out.' }), context.getRemainingTimeInMillis() - 3 * 1000);
  })
  
  // start them synchronously
  const res = await Promise.race([task, timeout]);
  return res;
};