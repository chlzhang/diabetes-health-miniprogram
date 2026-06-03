const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { time_point, blood_sugar, note } = event;

  var status = 'normal';
  var standards = { fasting: { normal: 6.1, low: 3.9 }, post_meal: { normal: 7.8, low: 3.9 }, bedtime: { normal: 7.0, low: 3.9 } };
  var std = standards[time_point];
  if (std) {
    if (blood_sugar < std.low) status = 'low';
    else if (blood_sugar >= std.normal) status = 'high';
  }

  try {
    const result = await db.collection('blood_sugars').add({
      data: {
        user_id: openid,
        time_point: time_point,
        blood_sugar: blood_sugar,
        status: status,
        note: note || '',
        record_time: db.serverDate(),
        created_at: db.serverDate()
      }
    });
    return { code: 0, id: result._id, status: status };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
