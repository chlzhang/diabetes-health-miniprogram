const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function generateCode() {
  var code = '';
  for (var i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { name } = event;

  try {
    const userRes = await db.collection('users').doc(openid).get();
    if (userRes.data.family_id) {
      return { code: -2, msg: '你已在家庭组中' };
    }

    var inviteCode = generateCode();
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7);

    const familyRes = await db.collection('families').add({
      data: {
        name: name || '我的家庭',
        invite_code: inviteCode,
        invite_expire: expireDate,
        creator_id: openid,
        member_ids: [openid],
        created_at: db.serverDate()
      }
    });

    await db.collection('users').doc(openid).update({
      data: { family_id: familyRes._id }
    });

    return { code: 0, familyId: familyRes._id, inviteCode: inviteCode };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
