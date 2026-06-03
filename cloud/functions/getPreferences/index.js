const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  try {
    const res = await db.collection('preferences').where({ user_id: openid }).limit(1).get();
    if (res.data && res.data.length > 0) {
      const p = res.data[0];
      return {
        code: 0,
        preferences: {
          dietary_restrictions: p.dietary_restrictions || [],
          exercise_limitations: p.exercise_limitations || []
        }
      };
    }
    return { code: 0, preferences: { dietary_restrictions: [], exercise_limitations: [] } };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
