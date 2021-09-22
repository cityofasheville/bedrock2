// exports.lambda_handler = async (event, context) => {
exports.lambda_handler =  (event, context) => {
    let timeleft = context.getRemainingTimeInMillis() - 300;
    // timeout task  
    const timeout = new Promise((resolve) => {
      setTimeout(() => { 
        console.log("I'm timing out")
        resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft/1000)} seconds` }), timeleft 
      });
    })
  
    // the real task
    const task = new Promise((resolve) => {
      setTimeout(() => resolve({ statusCode: 200, message: 'Task finished.' }), 10000);
    })
    
    // race the timeout task with the real task
    // const res = await Promise.race([task, timeout]);
    // return res;

    return Promise.race([task, timeout])
    .then((res)=>{
        return res;
    });
  };