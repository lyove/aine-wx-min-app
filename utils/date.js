var formatNumber = function (n) {
  n = n.toString();
  return n[1] ? n : '0' + n;
}

/** 
* Convert timestamp to date and time 
* number: input timestamp 
* format: return format; customizable, but must match the keys in formateArr 
*/
function formatDate(date, format) {
  var formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
  var newDate = new Date(date);
  var timeArr = [
    newDate.getFullYear(),
    formatNumber(newDate.getMonth() + 1),
    formatNumber(newDate.getDate()),
    formatNumber(newDate.getHours()),
    formatNumber(newDate.getMinutes()),
    formatNumber(newDate.getSeconds())
  ];
  for (var i = 0; i < timeArr.length; i++) {
    format = format.replace(formateArr[i], timeArr[i]);
  }
  return format;
}

export { formatDate };