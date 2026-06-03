const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { nickname, avatar } = event;

  try {
    const userRes = await db.collection('users').where({ _id: openid }).get();
    if (userRes.data.length === 0) {
      await db.collection('users').add({
        data: {
          _id: openid,
          nickname: nickname || '',
          avatar: avatar || '',
          height_cm: 0,
          weight_kg: 0,
          age: 0,
          family_id: '',
          created_at: db.serverDate()
        }
      });
      return { code: 0, isNew: true, openid: openid };
    }
    return { code: 0, isNew: false, openid: openid, user: userRes.data[0] };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
