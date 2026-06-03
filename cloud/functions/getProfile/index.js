const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  try {
    const userRes = await db.collection('users').doc(openid).get();
    if (!userRes.data) {
      return { code: -1, msg: '用户不存在' };
    }
    const u = userRes.data;
    return {
      code: 0,
      profile: {
        height_cm: u.height_cm || 0,
        weight_kg: u.weight_kg || 0,
        age: u.age || 0,
        gender: u.gender || '',
        activity_level: u.activity_level || 'sedentary',
        health_goal: u.health_goal || 'maintain'
      }
    };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
