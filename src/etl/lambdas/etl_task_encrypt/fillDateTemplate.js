function fillDateTemplate(template) {
  // Completes template with today's date in parts: YYYY, MM, DD,, HH, mm and/or SS
  let dateParts = {};
  const regex = /\$\{/g;
  const templateString = template.replace(regex, '${dateParts.');
  const today = new Date();

  const day = today.getUTCDate();
  dateParts.DD = (day > 9 ? '' : '0') + day;

  const month = today.getUTCMonth() + 1;
  dateParts.MM = (month > 9 ? '' : '0') + month;

  dateParts.YYYY = today.getUTCFullYear().toString();
  // dateParts.YY = YYYY.slice(2,)

  const hours = today.getUTCHours();
  dateParts.HH = (hours > 9 ? '' : '0') + hours;

  const mins = today.getUTCMinutes();
  dateParts.mm = (mins > 9 ? '' : '0') + mins;

  const secs = today.getUTCSeconds();
  dateParts.SS = (secs > 9 ? '' : '0') + secs;

  return template.replace('${YYYY}', dateParts.YYYY)
    .replace('${MM}', dateParts.MM).replace('${DD}', dateParts.DD)
    .replace('${HH}', dateParts.HH).replace('${mm}', dateParts.mm)
    .replace('${SS}', dateParts.SS);
}

export default fillDateTemplate;

// Example Usage:
// let template = "compsych_CityofAsheville_TEST_${YYYY}${MM}${DD}.csv"
// console.log(fillDateTemplate(template));
// let template2 = "CityofAsheville_CDL9693_${YYYY}${MM}${DD}_${HH}${mm}${SS}.txt"
// console.log(fillDateTemplate(template2));
