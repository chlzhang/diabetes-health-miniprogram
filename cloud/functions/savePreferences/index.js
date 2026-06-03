const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { preferences } = event;
  if (!preferences) return { code: -1, msg: '缺少 preferences 参数' };

  const data = {
    user_id: openid,
    dietary_restrictions: preferences.dietary_restrictions || [],
    exercise_limitations: preferences.exercise_limitations || [],
    updated_at: db.serverDate()
  };
  try {
    const existing = await db.collection('preferences').where({ user_id: openid }).limit(1).get();
    if (existing.data && existing.data.length > 0) {
      await db.collection('preferences').doc(existing.data[0]._id).update({ data: data });
    } else {
      await db.collection('preferences').add({ data: Object.assign({ created_at: db.serverDate() }, data) });
    }
    return { code: 0, ok: true };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
