const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { date } = event;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  try {
    const res = await db.collection('meals').where({
      user_id: openid,
      record_time: _.gte(dayStart).and(_.lt(dayEnd))
    }).orderBy('record_time', 'asc').get();
    return { code: 0, data: res.data };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
