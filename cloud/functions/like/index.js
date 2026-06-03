const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { targetType, targetId } = event;

  try {
    var existing = await db.collection('likes').where({
      user_id: openid,
      target_type: targetType,
      target_id: targetId
    }).get();

    if (existing.data.length > 0) {
      return { code: -2, msg: '已点赞' };
    }

    await db.collection('likes').add({
      data: {
        user_id: openid,
        target_type: targetType,
        target_id: targetId,
        created_at: db.serverDate()
      }
    });
    return { code: 0 };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
