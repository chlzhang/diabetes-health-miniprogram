var api = require("../../utils/api");
var util = require("../../utils/util");
var constants = require("../../utils/constants");

Page({
  data: {
    mealTypes: constants.MEAL_TYPES,
    activeType: "breakfast",
    mainFoodAmount: "",
    hasVegetable: false,
    hasProtein: false,
    hasSweetFood: false,
    hasSweetDrink: false,
    description: "",
    todayMeals: [],
    submitting: false
  },
  onLoad: function() { this.loadTodayMeals(); },
  switchType: function(e) { this.setData({activeType: e.currentTarget.dataset.type}); },
  onMainFoodInput: function(e) { this.setData({mainFoodAmount: e.detail.value}); },
  toggleVegetable: function() { this.setData({hasVegetable: !this.data.hasVegetable}); },
  toggleProtein: function() { this.setData({hasProtein: !this.data.hasProtein}); },
  toggleSweetFood: function() { this.setData({hasSweetFood: !this.data.hasSweetFood}); },
  toggleSweetDrink: function() { this.setData({hasSweetDrink: !this.data.hasSweetDrink}); },
  onDescInput: function(e) { this.setData({description: e.detail.value}); },
  submitMeal: function() {
    var that = this;
    if (!that.data.mainFoodAmount) { wx.showToast({title:"请填写主食量",icon:"none"}); return; }
    that.setData({submitting: true});
    api.addMeal({
      mealType: that.data.activeType,
      main_food_amount: parseInt(that.data.mainFoodAmount),
      has_vegetable: that.data.hasVegetable,
      has_protein: that.data.hasProtein,
      has_sweet_food: that.data.hasSweetFood,
      has_sweet_drink: that.data.hasSweetDrink,
      description: that.data.description
    }).then(function() {
      wx.showToast({title:"记录成功",icon:"success"});
      that.setData({mainFoodAmount:"",hasVegetable:false,hasProtein:false,hasSweetFood:false,hasSweetDrink:false,description:"",submitting:false});
      that.loadTodayMeals();
    }).catch(function() { that.setData({submitting: false}); });
  },
  loadTodayMeals: function() {
    var that = this;
    api.getMeals(util.formatDate(new Date())).then(function(res) { that.setData({todayMeals: res || []}); });
  }
});