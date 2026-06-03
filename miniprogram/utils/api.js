var callFunction = function (name, data) {
  var app = getApp();
  if (!app.globalData.cloudReady) {
    console.warn('[Cloud] 云环境未就绪，跳过调用: ' + name);
    return Promise.resolve(null);
  }
  return wx.cloud.callFunction({
    name: name,
    data: data
  }).then(function (res) {
    return res.result;
  }).catch(function (err) {
    console.error('[Cloud]', name, err);
    return null;
  });
};

module.exports = {
  login: function () { return callFunction('login', {}); },
  getDashboard: function () { return callFunction('getDashboard', {}); },
  addMeal: function (data) { return callFunction('addMeal', data); },
  getMeals: function (date) { return callFunction('getMeals', { date: date }); },
  addExercise: function (data) { return callFunction('addExercise', data); },
  getExercises: function (date) { return callFunction('getExercises', { date: date }); },
  addBloodSugar: function (data) { return callFunction('addBloodSugar', data); },
  getBloodSugars: function (date) { return callFunction('getBloodSugars', { date: date }); },
  createFamily: function (name) { return callFunction('createFamily', { name: name }); },
  joinFamily: function (code) { return callFunction('joinFamily', { code: code }); },
  getFamilyMembers: function () { return callFunction('getFamilyMembers', {}); },
  like: function (targetType, targetId) { return callFunction('like', { targetType: targetType, targetId: targetId }); }
};
