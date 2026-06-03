const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const mealsRes = await db.collection('meals').where({
      user_id: openid,
      record_time: _.gte(today).and(_.lt(tomorrow))
    }).get();

    const exercisesRes = await db.collection('exercises').where({
      user_id: openid,
      record_time: _.gte(today).and(_.lt(tomorrow))
    }).get();

    const bsRes = await db.collection('blood_sugars').where({
      user_id: openid,
      record_time: _.gte(today).and(_.lt(tomorrow))
    }).get();

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);
    const weekExercises = await db.collection('exercises').where({
      user_id: openid,
      record_time: _.gte(weekStart).and(_.lt(tomorrow))
    }).get();

    let weekMinutes = 0;
    weekExercises.data.forEach(function(e) { weekMinutes += e.duration_min || 0; });

    return {
      code: 0,
      data: {
        meals: mealsRes.data,
        exercises: exercisesRes.data,
        bloodSugars: bsRes.data,
        weekExerciseMinutes: weekMinutes
      }
    };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
