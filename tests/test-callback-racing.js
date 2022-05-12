
// Testing my WORKAROUND, of using a callback but still racing promises

exports.lambda_handler = function (event, context, callback) {
    // context.callbackWaitsForEmptyEventLoop = false
    const fixedms = 30000 //set to same as actual timeout, should be able to use func in prod
    const tasktimeleft = getRandomInt(fixedms*2)
    const timeoutleft = fixedms - 3000 //WORKS!! with 3 seconds BUT NOT WITH 1 second !?!?!?!? Can we assume that race/callbacks take a little while.. make it 5 to be safe?
    console.log(tasktimeleft)

    const task = new Promise(resolve => {
        setTimeout(() => resolve({
            statusCode: 200,
            message: `Lambda returned after ${tasktimeleft} ms`
        }), tasktimeleft)
    })

    // timeout task
    const timeout = new Promise((resolve) => {
        setTimeout(() => resolve({
            statusCode: 500,
            message: `Lambda timed out after ${timeoutleft} ms`
        }), timeoutleft)
    })

    // race the timeout task with the real task
    Promise.race([task, timeout])
        .then(
            res => { callback(null, res) },
            err => { callback(null, err) }
        )
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }