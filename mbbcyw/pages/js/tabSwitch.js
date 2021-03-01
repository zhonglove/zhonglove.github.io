$.fn.tabSwitch = function (options) {
  var options = $.extend({
    eventType: "hover",
    switchNav: ".switchNav",
    switchCont: ".switchCont",
    active: "active"
  }, options || {});
  return this.each(function () {
    var _this = $(this);
    _this.find(options.switchNav).bind(options.eventType, function () {
      var _index = $(this).index();
      $(this).addClass(options.active).siblings(options.switchNav).removeClass(options.active);
      _this.find(options.switchCont).eq(_index).addClass(options.active).siblings(options.switchCont).removeClass(options.active);
    });
  });
};