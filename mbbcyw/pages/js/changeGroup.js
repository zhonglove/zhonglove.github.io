$.fn.changeGroup = function (options) {
  var options = $.extend({
    eventType: "click",
    changeGroupCont: ".changeGroupCont",
    changeGroupBtn: ".changeGroupBtn",
    active: "active"
  }, options || {});
  return this.each(function () {
    var _this = $(this);
    var changeGroupIndex = 0;
    var changeGroupPages = _this.find(options.changeGroupCont).length;
    function changeGroupFun() {
      if (changeGroupIndex + 1 < changeGroupPages) {
        changeGroupIndex++;
      } else {
        changeGroupIndex = 0;
      }
      _this.find(options.changeGroupCont).eq(changeGroupIndex).addClass(options.active).siblings().removeClass(options.active);
    }
    _this.find(options.changeGroupBtn).bind(options.eventType, function () {
      changeGroupFun();
    });
    _this.find(options.changeGroupBtn).hover(function () {
      clearInterval(changeGroupTimer);
    }, function () {
      autoplay();
    });
    var changeGroupTimer = null;
    function autoplay() {
      changeGroupTimer = setInterval(function () {
        changeGroupFun();
      }, 18000);
    };
    autoplay();
  });
}