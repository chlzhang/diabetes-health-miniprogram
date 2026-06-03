const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const userRes = await db.collection('users').doc(openid).get();
    var familyId = userRes.data.family_id;
    if (!familyId) {
      return { code: -2, msg: '未加入家庭组' };
    }

    const familyRes = await db.collection('families').doc(familyId).get();
    var memberIds = familyRes.data.member_ids;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    var members = [];
    for (var i = 0; i < memberIds.length; i++) {
      var mid = memberIds[i];
      try {
        var mRes = await db.collection('users').doc(mid).get();
        var m = mRes.data;
        var mealCount = (await db.collection('meals').where({ user_id: mid, record_time: _.gte(today).and(_.lt(tomorrow)) }).count()).total;
        var exCount = (await db.collection('exercises').where({ user_id: mid, record_time: _.gte(today).and(_.lt(tomorrow)) }).count()).total;
        var bsCount = (await db.collection('blood_sugars').where({ user_id: mid, record_time: _.gte(today).and(_.lt(tomorrow)) }).count()).total;
        members.push({
          openid: mid,
          nickname: m.nickname || '家人',
          avatar: m.avatar || '',
          todayMeals: mealCount,
          todayExercises: exCount,
          todayBloodSugars: bsCount
        });
      } catch (e) { }
    }

    return { code: 0, data: members, familyName: familyRes.data.name };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
