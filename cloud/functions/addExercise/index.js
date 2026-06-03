const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { sport_type, duration_min, intensity, calories, note } = event;

  try {
    const result = await db.collection('exercises').add({
      data: {
        user_id: openid,
        sport_type: sport_type,
        duration_min: duration_min,
        intensity: intensity,
        calories: calories || 0,
        note: note || '',
        record_time: db.serverDate(),
        created_at: db.serverDate()
      }
    });
    return { code: 0, id: result._id };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
