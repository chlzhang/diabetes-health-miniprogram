const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { profile } = event;
  if (!profile) return { code: -1, msg: '缺少 profile 参数' };

  try {
    // 检查用户是否存在
    let userRes;
    try {
      userRes = await db.collection('users').doc(openid).get();
    } catch (e) {
      userRes = null;
    }
    const data = {
      height_cm: Number(profile.height_cm) || 0,
      weight_kg: Number(profile.weight_kg) || 0,
      age: Number(profile.age) || 0,
      gender: profile.gender || '',
      activity_level: profile.activity_level || 'sedentary',
      health_goal: profile.health_goal || 'maintain',
      updated_at: db.serverDate()
    };
    if (!userRes || !userRes.data) {
      // 用户不存在，创建
      await db.collection('users').add({
        data: Object.assign({ _id: openid, created_at: db.serverDate() }, data)
      });
    } else {
      await db.collection('users').doc(openid).update({ data: data });
    }
    return { code: 0, ok: true };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
