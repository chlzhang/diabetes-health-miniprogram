var DEFAULT_DASHBOARD = {
  diet: { count: 0, level: 'ok' },
  exercise: { count: 0, minutes: 0, goal: 150 },
  bloodSugar: { count: 0, latest: null, latestStatus: 'normal' },
  family: [],
  streakDays: 0
};
var DEFAULT_FAMILY = { family: null, members: [] };
var DEFAULT_PROFILE = {
  nickName: '',
  avatarUrl: '',
  height_cm: 0,
  weight_kg: 0,
  age: 0,
  gender: '',
  activity_level: 'sedentary',
  health_goal: 'maintain'
};
var DEFAULT_PREFERENCES = {
  dietary_restrictions: [],
  exercise_limitations: []
};
var STORAGE_KEYS = {
  profile: 'profile_cache',
  preferences: 'preferences_cache',
  plan: 'plan_cache',
  planDate: 'plan_date',
  tracking: 'tracking_cache'
};

var callFunction = function (name, data, defaultResult) {
  var def = (defaultResult === undefined) ? null : defaultResult;
  var app = getApp();
  if (!app.globalData.cloudReady) {
    return Promise.resolve(def);
  }
  return wx.cloud.callFunction({
    name: name,
    data: data
  }).then(function (res) {
    return (res && res.result !== undefined) ? res.result : def;
  }).catch(function (err) {
    console.error('[Cloud]', name, err);
    return def;
  });
};

var readStorage = function (key, defaultValue) {
  try {
    var v = wx.getStorageSync(key);
    if (v === '' || v === null || v === undefined) return defaultValue;
    return v;
  } catch (e) {
    return defaultValue;
  }
};

var writeStorage = function (key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = {
  // ====== 原有接口 ======
  login: function () { return callFunction('login', {}, null); },
  getDashboard: function () { return callFunction('getDashboard', {}, DEFAULT_DASHBOARD); },
  addMeal: function (data) { return callFunction('addMeal', data, { ok: true }); },
  getMeals: function (date) { return callFunction('getMeals', { date: date }, []); },
  addExercise: function (data) { return callFunction('addExercise', data, { ok: true }); },
  getExercises: function (date) { return callFunction('getExercises', { date: date }, []); },
  addBloodSugar: function (data) { return callFunction('addBloodSugar', data, { ok: true }); },
  getBloodSugars: function (date) { return callFunction('getBloodSugars', { date: date }, []); },
  createFamily: function (name) { return callFunction('createFamily', { name: name }, { ok: true }); },
  joinFamily: function (code) { return callFunction('joinFamily', { code: code }, { ok: true }); },
  getFamilyMembers: function () { return callFunction('getFamilyMembers', {}, DEFAULT_FAMILY); },
  like: function (targetType, targetId) { return callFunction('like', { targetType: targetType, targetId: targetId }, { ok: true }); },

  // ====== 个性化推荐接口（云优先，本地兜底） ======
  getProfile: function () {
    var cached = readStorage(STORAGE_KEYS.profile, null);
    return callFunction('getProfile', {}, null).then(function (res) {
      if (res && res.profile) {
        writeStorage(STORAGE_KEYS.profile, res.profile);
        return res.profile;
      }
      return cached || DEFAULT_PROFILE;
    });
  },
  saveProfile: function (profile) {
    writeStorage(STORAGE_KEYS.profile, profile);
    return callFunction('saveProfile', { profile: profile }, { ok: true });
  },
  getPreferences: function () {
    var cached = readStorage(STORAGE_KEYS.preferences, null);
    return callFunction('getPreferences', {}, null).then(function (res) {
      if (res && res.preferences) {
        writeStorage(STORAGE_KEYS.preferences, res.preferences);
        return res.preferences;
      }
      return cached || DEFAULT_PREFERENCES;
    });
  },
  savePreferences: function (preferences) {
    writeStorage(STORAGE_KEYS.preferences, preferences);
    return callFunction('savePreferences', { preferences: preferences }, { ok: true });
  },
  getTracking: function () {
    return readStorage(STORAGE_KEYS.tracking, {
      dietAdherence: 0,
      exerciseAdherence: 0,
      dietDays: [],
      exerciseDays: [],
      streakDays: 0
    });
  },
  saveTracking: function (tracking) {
    writeStorage(STORAGE_KEYS.tracking, tracking);
  },

  // ====== LLM 驱动的智能接口 ======
  // 1) 综合分析（不调用 LLM，纯统计 + 跨模块关联）
  getAnalysis: function (module, userId, days) {
    return callFunction('aiAnalysis', { module: module, userId: userId, days: days || 7 }, { code: -1, data: null, message: '离线模式：AI 分析不可用' });
  },
  // 2) 智能方案生成（调用 LLM）
  getAIRecommend: function (type, userId, days) {
    return callFunction('aiRecommend', { type: type || 'comprehensive', userId: userId, days: days || 7 }, { code: -1, data: null, message: '离线模式：AI 推荐不可用' });
  },
  // 3) AI 对话
  chatWithAI: function (userId, message, history) {
    return callFunction('aiChat', { userId: userId, message: message, history: history || [] }, { code: -1, data: { reply: { reply: '离线模式：请配置云函数后端' } }, message: '离线模式' });
  },
  STORAGE_KEYS: STORAGE_KEYS
};
