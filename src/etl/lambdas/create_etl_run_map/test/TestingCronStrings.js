/* eslint-disable no-console */
// Testing random times with cron logic

const awsCronParser = require('aws-cron-parser');

const TIME_INTERVAL = 15; // Frequency - must match Eventbridge scheduler

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// deployed version
for (let i = 0; i < 5; i += 1) {
  let curTime;
  if (i === 0) curTime = new Date(2023, 1, 7, 11, 15, 0, 0); // test if exactly on 1/4 hr
  else curTime = randomDate(new Date(2023, 1, 7), new Date(2023, 1, 8));
  const cstringArr = ['00 * * * ? *', '15 * * * ? *', '30 * * * ? *', '45 * * * ? *'];
  cstringArr.forEach((cstring) => {
    const cron = awsCronParser.parse(cstring);
    const minutes = TIME_INTERVAL;
    const ms = 1000 * 60 * minutes;
    // const curTime = new Date();
    const prevOccurenceMS = (awsCronParser.prev(cron, curTime)).getTime();
    const nextOccurrenceMS = prevOccurenceMS + ms;

    if (nextOccurrenceMS >= curTime.getTime()) {
      console.log('yes', cstring, new Date(prevOccurenceMS).toLocaleString(), curTime.toLocaleString(), new Date(nextOccurrenceMS).toLocaleString());
    } else {
      console.log('no-', cstring, new Date(prevOccurenceMS).toLocaleString(), curTime.toLocaleString(), new Date(nextOccurrenceMS).toLocaleString());
    }
  });
  console.log('====================');
}

// myDate.getTime() => myepoch
// new Date(myepoch) => myDate

// previous version - not correct
for (let i = 0; i < 5; i += 1) {
  let testTime;
  if (i === 0) testTime = new Date(2023, 1, 7, 11, 15, 0, 0); // test if exactly on 1/4 hr
  else testTime = randomDate(new Date(2023, 1, 7), new Date(2023, 1, 8));
  const cstringArr = ['00 * * * ? *', '15 * * * ? *', '30 * * * ? *', '45 * * * ? *'];
  cstringArr.forEach((cstring) => {
    const cron = awsCronParser.parse(cstring);
    const minutes = TIME_INTERVAL;
    const ms = 1000 * 60 * minutes;
    const curTime = new Date(Math.round(testTime.getTime() / ms) * ms);
    const nextTime = new Date(curTime);
    const delta = minutes * 60 * 1000;
    nextTime.setTime(nextTime.getTime() + delta);
    const occurrence = awsCronParser.next(cron, curTime);
    if (occurrence.getTime() < nextTime.getTime()) {
      console.log('yes', cstring, curTime.toLocaleString());
    } else {
      console.log('no-', cstring, curTime.toLocaleString());
    }
  });
  console.log('====================');
}

// FAILED ATTEMPT TO ROUND
// function timestr(date) {
//   const str = date.toLocaleString();
//   return ` - ${str.substring(str.indexOf(' ') + 1)}`;
// }
// for (let i = 0; i < 6; i += 1) {
//   const testtime = randomDate(new Date(2023, 1, 7), new Date(2023, 1, 8));
//   const cstringArr = ['00 * * * ? *', '15 * * * ? *', '30 * * * ? *', '45 * * * ? *'];
//   cstringArr.forEach((cstring) => {
//     const cron = awsCronParser.parse(cstring);
//     const minutes = TIME_INTERVAL;
//     const deltaMS = 1000 * 60 * minutes;
//     const minusHalfMS = testtime.getTime() - (deltaMS / 2.0);
//     const minusHalfRounded = new Date(Math.round(minusHalfMS / deltaMS) * deltaMS);
//     const nextOccurrence = (awsCronParser.next(cron, minusHalfRounded));
//     const prevOccurence = new Date(nextOccurrence.getTime() - deltaMS);
//     if (prevOccurence.getTime() <= testtime.getTime()) {
//       console.log('yes', cstring, timestr(testtime), timestr(minusHalfRounded),
//       timestr(nextOccurrence), timestr(prevOccurence));
//     } else {
//       console.log('nop', cstring, timestr(testtime), timestr(minusHalfRounded),
//       timestr(nextOccurrence), timestr(prevOccurence));
//     }
//   });
//   console.log('====================');
// }
