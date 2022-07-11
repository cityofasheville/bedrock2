
function fillDateTemplate(template){
    // Completes template with today's date in parts: YYYY, MM, DD,, HH, mm and/or SS
    const regex = /\$\{/g
    let templateString = template.replace(regex,"${this.")
    let today = new Date();
    
    let day = today.getUTCDate()
    this.DD = (day>9 ? '' : '0') + day
    
    let month = today.getUTCMonth() + 1
    this.MM = (month>9 ? '' : '0') + month
    
    this.YYYY = today.getUTCFullYear().toString()
    // this.YY = YYYY.slice(2,)

    let hours = today.getUTCHours()
    this.HH = (hours>9 ? '' : '0') + hours

    let mins = today.getUTCMinutes()
    this.mm = (mins>9 ? '' : '0') + mins

    let secs = today.getUTCSeconds()
    this.SS = (secs>9 ? '' : '0') + secs

    return new Function("return `"+templateString +"`;").call(this);
}

module.exports = fillDateTemplate

// Example Usage:
// let template = "compsych_CityofAsheville_TEST_${YYYY}${MM}${DD}.csv"
// console.log(fillDateTemplate(template));
// let template2 = "CityofAsheville_CDL9693_${YYYY}${MM}${DD}_${HH}${mm}${SS}.txt"
// console.log(fillDateTemplate(template2));
