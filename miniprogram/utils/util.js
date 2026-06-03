var formatTime = function (date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':');
};

var formatDate = function (date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return [year, month, day].map(formatNumber).join('-');
};

var formatNumber = function (n) {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

var getWeekStart = function (date) {
  var d = new Date(date);
  var day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return formatDate(d);
};

var calcCalories = function (met, weightKg, durationMin) {
  return Math.round(met * weightKg * (durationMin / 60));
};

var getHealthLevel = function (data) {
  if (data.main_food_amount <= 150 && data.has_vegetable && data.has_protein && !data.has_sweet_food && !data.has_sweet_drink) {
    return 'good';
  }
  if (data.main_food_amount <= 200 && (data.has_vegetable || data.has_protein)) {
    return 'ok';
  }
  return 'warn';
};

var getBloodSugarStatus = function (value, timePoint) {
  var constants = require('./constants');
  var std = constants.BLOOD_SUGAR_STANDARDS[timePoint];
  if (!std) return 'normal';
  if (value < std.low) return 'low';
  if (value >= std.normal) return 'high';
  return 'normal';
};

module.exports = {
  formatTime: formatTime,
  formatDate: formatDate,
  formatNumber: formatNumber,
  getWeekStart: getWeekStart,
  calcCalories: calcCalories,
  getHealthLevel: getHealthLevel,
  getBloodSugarStatus: getBloodSugarStatus
};
