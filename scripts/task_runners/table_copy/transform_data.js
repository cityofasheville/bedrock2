
const csv = require('csv');
const datefns = require('date-fns');

const parse_data = csv.parse()
const transform_data = csv.transform(function(data){ 
  return data 
})
const stringify_data = csv.stringify()

// const fix_data_types = csv.parse({ // correct the data types
//   bom: true,
//   columns: true,
//   cast: function(value, context){ 
//     if(context.column === "hours") {
//         return parseFloat(value);
//     } else if(context.column === "employeePayrollID" || context.column === 'payrollCode') {
//         return parseInt(value, 10);
//     } else if(context.column === "payRangeFrom") {
//         return datefns.parse(value, "yyyy-MM-dd", new Date());
//     } else if(context.column === 'from' || context.column === 'through') {
//         let datestr = `${value.slice(0,19)}`
//         return datefns.parse(datestr, "yyyy-MM-dd kk:mm:ss", new Date());
//     } else {
//         return value;
//     }
//   }
// });

// const choose_columns = csv.transform (function(data){ // choose and rename columns
//   return { 
//     source: '',
//     group: data.institutionAbbreviation, 
//     emp_id: data.employeePayrollID,
//     pay_code: data.payrollCode,
//     date_worked: data.payRangeFrom,
//     hours_worked: data.hours,
//     note: data.rosterNote, 
//     date_time_from: data.from, 
//     date_time_to: data.through
//   } 
// });

// const filter_bad_data = csv.transform (function(data, callback){ //reject bad data
//   if(
//     typeof(data.source) === "string" && 
//     typeof(data.group) === "string" && 
//     typeof(data.emp_id) === "number" && 
//     typeof(data.pay_code) === "number" && !isNaN(data.pay_code) &&
//     !isNaN(data.date_worked) &&
//     typeof(data.hours_worked) === "number" && 
//     typeof(data.note) === "string" && 
//     !isNaN(data.date_time_from) &&
//     !isNaN(data.date_time_to)
//     // Strings: typeof
//     // Numbers: typeof but also check for NaN
//     // Dates: date-fns will return NaN if invalid date
//     //Object.prototype.toString.call(data.date_time_to) === '[object Date]' && 
//   ) {
//       let retdata = [ 
//         data.source, 
//         data.group, 
//         data.emp_id, 
//         data.pay_code, 
//         data.date_worked, 
//         data.hours_worked, 
//         data.note, 
//         data.date_time_from, 
//         data.date_time_to 
//       ]
//       callback(null, retdata);
//     } else {
//       console.log('Rejected data: ',        
//       data.source, 
//       data.group, 
//       data.emp_id, 
//       data.pay_code, 
//       data.date_worked, 
//       data.hours_worked, 
//       data.note, 
//       data.date_time_from, 
//       data.date_time_to);
//       callback(null, null);
//     }

//   }, {
//     parallel: 20
// });

module.exports = {
  parse_data,
  transform_data,
  stringify_data
};
