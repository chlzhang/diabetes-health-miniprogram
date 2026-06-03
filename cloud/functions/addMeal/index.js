const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { meal_type, description, main_food, main_food_amount, has_vegetable, has_protein, has_sweet_food, has_sweet_drink, photo_url } = event;

  var health_level = 'warn';
  if (main_food_amount <= 150 && has_vegetable && has_protein && !has_sweet_food && !has_sweet_drink) {
    health_level = 'good';
  } else if (main_food_amount <= 200 && (has_vegetable || has_protein)) {
    health_level = 'ok';
  }

  try {
    const result = await db.collection('meals').add({
      data: {
        user_id: openid,
        meal_type: meal_type,
        description: description || '',
        main_food: main_food || '',
        main_food_amount: main_food_amount || 0,
        has_vegetable: has_vegetable || false,
        has_protein: has_protein || false,
        has_sweet_food: has_sweet_food || false,
        has_sweet_drink: has_sweet_drink || false,
        photo_url: photo_url || '',
        health_level: health_level,
        record_time: db.serverDate(),
        created_at: db.serverDate()
      }
    });
    return { code: 0, id: result._id };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
};
