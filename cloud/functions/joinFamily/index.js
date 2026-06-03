const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { code } = event;

  try {
    const userRes = await db.collection('users').doc(openid).get();
    if (userRes.data.family_id) {
      return { code: -2, msg: '你已在家庭组中' };
    }

    const familyRes = await db.collection('families').where({ invite_code: code }).get();
    if (familyRes.data.length === 0) {
      return { code: -3, msg: '邀请码无效' };
    }

    var family = familyRes.data[0];
    if (new Date(family.invite_expire) < new Date()) {
      return { code: -4, msg: '邀请码已过期' };
    }
    if (family.member_ids.length >= 8) {
      return { code: -5, msg: '家庭组已满' };
    }

    await db.collection('families').doc(family._id).update({
      data: { member_ids: _.push(openid) }
    });
    await db.collection('users').doc(openid).update({
      data: { family_id: family._id }
    });

    return { code: 0, familyId: family._id };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
