const moment= require('moment')


function getDaysInMonth(month, year) {
    var date = new Date(year, month, 1);
    var days = [];
    while (date.getMonth() === month) {
      const mydate = moment(new Date(date)).format("DD-MM-YYYY")
      days.push(mydate);
      date.setDate(date.getDate() + 1);
    }
    return days;
  }


module.exports = { getDaysInMonth }
