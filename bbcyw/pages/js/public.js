(function($){
	//自适应
	changewin = function(){
		changew();
		$(window).resize(function(){
			changew();
		});
		function changew(){
			var currWin_w = $(window).width();
			if(currWin_w>=1500){
				$("body").attr({"class":"page_1500"});
				return false;
			}else if(currWin_w<1500 && currWin_w>=1200 ){
				$("body").attr({"class":"page_1200"});
				return false;
			}else{
				$("body").attr({"class":"page_640"});
				return false;
			}
		}
	};
	/*导航*/
	$.fn.menuShow = function(options){
		var options = $.extend({
			menuList: ".menu-list",
			select: "select",
			contList: ".cont-list",
			menuListBox: ".menu-list-box",
		},options||{});
		return this.each(function(){
			var _this = $(this);
			var dataType = _this.attr("data-type");
			if(dataType == "false"){
				_this.find(options.menuListBox).removeClass(options.select);
				_this.hover(function(){
					_this.find(options.menuListBox).addClass(options.select);
				},function(){
					_this.find(options.menuListBox).removeClass(options.select);
				});
			}else{
				_this.find(options.menuListBox).addClass(options.select);
			}
			_this.hover(function(){},function(){
				_this.find(options.contList).removeClass(options.select);
				_this.find(options.menuList).removeClass(options.select);
			});
			_this.find(options.menuList).hover(function(){
				var _index = $(this).index();
				$(this).addClass(options.select).siblings(options.menuList).removeClass(options.select);
				_this.find(options.contList).eq(_index).addClass(options.select).siblings(options.contList).removeClass(options.select);
			});
		});
	};
	$.fn.navShow = function(options){
		var options = $.extend({
			navItem: ".nav-item",
			select: "select"
		},options||{});
		return this.each(function(){
			var _this = $(this);
			_this.find(options.navItem).mouseover(function(){
				$(this).addClass(options.select).siblings(options.navItem).removeClass(options.select);
			}).mouseout(function(){
				$(this).removeClass(options.select);
			});
		});
	};
	//
	$.fn.slider = function(options){
		var options = $.extend({
			imgList: ".img-list",
			btnList: ".btn-list",
			select: "select",
			sliderArrow: ".slider-arrow",
			sliderPrev: ".slider-prev",
			sliderNext: ".slider-next",
		},options||{});
		return this.each(function(){
			var _this = $(this);
			_this.find(options.imgList).eq(0).show().siblings(options.imgList).hide();
			var btnNum = _this.find(options.btnList).length;
			_this.find(options.btnList).hover(function(){
				clearInterval(timer);
				var _index = $(this).index();
				$(this).stop().addClass(options.select).siblings(options.btnList).removeClass(options.select);
				_this.find(options.imgList).eq(_index).stop().fadeIn(500).siblings(options.imgList).fadeOut(500);
			},function(){
				autoplay();
			});
			var _index = 0;
			var timer = null;
			function sliderNextFun() {
				_index++;
				if (_index < btnNum) {
					if (_index == (btnNum - 1)) { _index = -1; }
					_this.find(options.btnList).eq(_index).addClass(options.select).siblings(options.btnList).removeClass(options.select);
					_this.find(options.imgList).eq(_index).fadeIn(500).siblings(options.imgList).fadeOut(500);
				} else {
					_index = -1;
				}
			}
			function autoplay(){
			timer=setInterval(function(){
				sliderNextFun();
				},4000); 
			};
			autoplay();
			_this.find(options.sliderArrow).hover(function () {
				clearInterval(timer);
			}, function () {
				autoplay();
			});
			_this.find(options.sliderNext).click(function() {
				sliderNextFun();
			});
			_this.find(options.sliderPrev).click(function () {
				_index--;
				if (_index < 0){
					_index = btnNum - 1;
				}
				_this.find(options.btnList).eq(_index).addClass(options.select).siblings(options.btnList).removeClass(options.select);
				_this.find(options.imgList).eq(_index).fadeIn(500).siblings(options.imgList).fadeOut(500);
			});
			
		});
	};
	//动态
	liPlay = function(lh,speed,delay,el){
	  var ssyyinfo; 
	  var p=false; 
	  var o=document.getElementById(el); 
	  o.innerHTML+=o.innerHTML; 
	  o.onmouseover=function(){p=true;} 
	  o.onmouseout=function(){p=false} 
	  o.scrollTop = 0; 
	  function start(){ 
	    ssyyinfo = setInterval(scrolling,speed); 
	    if(!p){ o.scrollTop += 1;} 
	  }
	  function scrolling(){ 
	    if(o.scrollTop%lh!=0){ 
	      o.scrollTop += 1; 
	      if(o.scrollTop>=o.scrollHeight/2) o.scrollTop = 0; 
	    }else{ 
	      clearInterval(ssyyinfo); 
	      setTimeout(start,delay); 
	    } 
	  }
	  setTimeout(start,delay); 
	};
	//返回顶部
	$.fn.returnTop = function(options){
		var options = $.extend({
			eventType: "click",
			toolbarItem: ".toolbar-item"
		},options||{});
		return this.each(function(){
			var _this = $(this);
			$(window).scroll(function(){
				var sTop = $(document).scrollTop();
				if(sTop > 200){
					_this.find(options.toolbarItem).last().show();
				}else{
					_this.find(options.toolbarItem).last().hide();
				}
			});
			_this.find(options.toolbarItem).last().bind(options.eventType, function(){
				$('body,html').animate({
					scrollTop: 0,
				},500);
			});
		});
	};
	/*导航固定*/
	$.fn.fixedCont = function(options){
		var options = $.extend({
			eventType: "click",
			boxLeft: "#boxleft",
			outerPage: ".outer_page",
			totalPage: ".total-page",
			pagePrev: ".page-prev",
			pageNext: ".page-next",
			selectPage: ".select-page",
			zoomInButton: "#zoomInButton",
			zoomOutButton: "#zoomOutButton",
			frscreen: "#frscreen",
			boxRight: "#boxright",
			leftWidth: "left-width",
			fixed: "fixed"
		},options||{});
		return this.each(function(){
			var _this = $(this);
			var pageNum = $(options.boxLeft).find(options.outerPage).length;
			_this.find(options.totalPage).html("/"+pageNum);
			var selectPageVal=1;
			var fixedOffTop = _this.offset().top;
			$(window).scroll(function(){
				if(selectPageVal <= 1){
					$(options.pagePrev).attr("disabled", true);
					$(options.pageNext).attr("disabled",false);
				}
				var scrollTop = $(document).scrollTop();
				for(var i = 1; i <= pageNum; i++){
					var pageTop = $("#outer_page_" + i).offset().top;
					if(scrollTop > pageTop -100){
						selectPageVal= i;
					}
				}
				_this.find(options.selectPage).val(selectPageVal);
				if(scrollTop > fixedOffTop){
					_this.addClass(options.fixed);
				}else{
					_this.removeClass(options.fixed);
				}
			});
			_this.find(options.pagePrev).bind(options.eventType, function(){
				$(options.pageNext).attr("disabled",false);
				selectPageVal--;
				if(selectPageVal <= 1){
					$(options.pagePrev).attr("disabled", true);
				}
				pageMove();
			});
			_this.find(options.pageNext).bind(options.eventType, function(){
				$(options.pagePrev).attr("disabled", false);
				// $(".outer_page .inner_page").show();
				selectPageVal++;
				if(selectPageVal >= pageNum){
					$(options.pageNext).attr("disabled",true);
				}
				pageMove();
			});
			function pageMove(){
				_this.find(options.selectPage).val(selectPageVal);
				var top = $("#outer_page_" + selectPageVal).offset().top;
				$(window).scrollTop(top);
			};
			_this.find(options.zoomInButton).bind(options.eventType, function(){
				showHide();
			});
			_this.find(options.zoomOutButton).bind(options.eventType, function(){
				showHide();
			});
			_this.find(options.frscreen).bind(options.eventType, function(){
				showHide();
			});
			function showHide(){
				if($(options.boxRight).is(":hidden")){
					$(options.boxRight).show();
					$(options.boxLeft).removeClass(options.leftWidth);
					$(options.frscreen).html("&#xe826;");
				}else{
					$(options.boxRight).hide();
					$(options.boxLeft).addClass(options.leftWidth);
					$(options.frscreen).html("&#xe60e;");
				}
			};

		});
	};
	$.fn.tabSwitch = function(options){
		var options = $.extend({
			eventType: "hover",
			switchNav: ".switchNav",
			switchCont: ".switchCont",
			active: "active",
			switchMore: ".switchMore",
			activeMore: "active-more",
		},options||{});
		return this.each(function(){
			var _this = $(this);
			_this.on(options.eventType,options.switchNav,function(){
				_this.find(options.switchNav).bind(options.eventType, function(){
					var _index = $(this).index();
					$(this).addClass(options.active).siblings(options.switchNav).removeClass(options.active);
					_this.find(options.switchCont).eq(_index).addClass(options.active).siblings(options.switchCont).removeClass(options.active);
					_this.find(options.switchMore).eq(_index).addClass(options.activeMore).siblings(options.switchMore).removeClass(options.activeMore);
				});
			})
		});
	};
	$.fn.personalNav = function(options){
		var options = $.extend({
			eventType: "click",
			active: "select"
		},options||{});
		return this.each(function(){
			var _this = $(this);
			_this.bind(options.eventType, function(){
				var _index = $(this).index();
				_this.siblings().removeClass(options.active);
				_this.toggleClass(options.active);
			});
		});
	}
	$.fn.fixedHeader = function(options){
		var options = $.extend({
			headerFixedCont: ".header-fixed-cont",
			headerFixed: "header-fixed",
		},options||{});
		return this.each(function(){
			var _this = $(this);
			$(window).scroll(function(){
				var sTop = $(document).scrollTop();
				if(sTop > 200){
					_this.find(options.headerFixedCont).addClass(options.headerFixed);
				}else{
					_this.find(options.headerFixedCont).removeClass(options.headerFixed);
				}
			});
		});
	}
	$.fn.changeGroup = function(options){
		var options = $.extend({
			eventType: "click",
			changeGroupCont: ".changeGroupCont",
			changeGroupBtn: ".changeGroupBtn",
			active: "active"
		},options||{});
		return this.each(function(){
			var _this = $(this);
			var changeGroupIndex = 0;
			var changeGroupPages = _this.find(options.changeGroupCont).length;
			function changeGroupFun(){
				if(changeGroupIndex + 1 < changeGroupPages){
					changeGroupIndex++;
				}else{
					changeGroupIndex = 0;
				}
				_this.find(options.changeGroupCont).eq(changeGroupIndex).addClass(options.active).siblings().removeClass(options.active);
			}
			_this.find(options.changeGroupBtn).bind(options.eventType, function(){
				changeGroupFun();
			});
			_this.find(options.changeGroupBtn).hover(function(){
				clearInterval(changeGroupTimer);
			}, function(){
				autoplay();
			});
			var changeGroupTimer = null;
			function autoplay(){
			changeGroupTimer=setInterval(function(){
				changeGroupFun();
				},18000); 
			};
			autoplay();
		});
	}
	$.fn.loginModal = function (options) {
		var options = $.extend({
			eventType: "click",
			switch01: ".switch-01",
			switch02: ".switch-02",
			modal01: ".modal-01",
			modal02: ".modal-02",
			modal03: ".modal-03",
			freeLogin: ".free-login",
			loginShow: ".loginShow",
			registShow: ".registShow",
			modalClose: ".modal-close",
			modalShade: ".modal-shade"
		}, options || {});
		return this.each(function () {
			var _this = $(this);
			$(options.loginShow).bind(options.eventType, function () {
				_this.show();
				_this.find(options.modal01).hide();
				_this.find(options.modal03).hide();
				_this.find(options.modal02).show();
			})
			$(options.registShow).bind(options.eventType, function () {
				_this.show();
				_this.find(options.modal01).hide();
				_this.find(options.modal02).hide();
				_this.find(options.modal03).show();
			})
			_this.find(options.switch01).bind(options.eventType, function () {
				_this.find(options.modal01).hide();
				_this.find(options.modal03).hide();
				_this.find(options.modal02).show();
			})
			_this.find(options.switch02).bind(options.eventType, function () {
				_this.find(options.modal02).hide();
				_this.find(options.modal03).hide();
				_this.find(options.modal01).show();
			})
			_this.find(options.freeLogin).bind(options.eventType, function () {
				_this.find(options.modal01).hide();
				_this.find(options.modal02).hide();
				_this.find(options.modal03).show();
			});
			$(options.modalClose).bind(options.eventType, function () {
				_this.hide();
			})
			$(options.modalShade).bind(options.eventType, function () {
				_this.hide();
			})
			function loginShowFun() {
				console.log(1);
				// _this.find(options.modal02).hide();
				// _this.find(options.modal03).hide();
				// _this.find(options.modal01).show();
			};
			function registShowFun() {
				console.log(2);
				// _this.find(options.modal02).hide();
				// _this.find(options.modal03).hide();
				// _this.find(options.modal01).show();
			};
		});
	}
	$.fn.globalUploader = function(options){
		var options = $.extend({
			eventType: "click",
			batchShowBtn: ".batchShowBtn",
			titleWrap: ".title-wrap",
			batchDetails: ".batchDetails",
			checkboxAll: ".checkbox-all",
			fileList: ".file-list",
			btnUpdateAll: ".btn-update-all",
			iconfont: ".iconfont"
		},options||{});
		return this.each(function(){
			var _this = $(this);
            $(_this).on(options.eventType, options.batchShowBtn, function(){
				var batchDetailss = $(this).parent(options.titleWrap).siblings(options.batchDetails);
				if(batchDetailss.is(":hidden")){
					batchDetailss.show();
					$(this).find(options.iconfont).html("&#xe61b;");
				}else{
					batchDetailss.hide();
					$(this).find(options.iconfont).html("&#xe672;");
				}
			});
            $(_this).on(options.eventType, options.checkboxAll, function(){
				if(this.checked){
					$(_this).find(options.fileList + " :checkbox").prop("checked", true);
					//$(_this).find(options.btnUpdateAll).css({display: 'inline-block'});
				}else{
					$(_this).find(options.fileList + " :checkbox").prop("checked", false);
				//	$(_this).find(options.btnUpdateAll).css({display: 'none'});
				} 
				
			});
		});
	}
	/** 展开收起 */
	$.fn.toggleCont = function(options){
		var options = $.extend({
			eventType: "click",
			toggleBtn: ".toggleBtn",
			groupMain: ".group-main",
			active: 'clamp',
			groupMask: '.group-mask',
			showHeight: '200'
		},options||{});
		return this.each(function(){
			var _this = $(this);
			_this.on(options.eventType,options.toggleBtn,function(){
				var dataNum = $(this).attr('data-num');
				if(dataNum == 1){
					$(this).attr('data-num', 2);
					_this.find(options.toggleBtn).html('&#xe61b;');
					_this.find(options.groupMain).removeClass(options.active);
					_this.find(options.groupMask).hide();
				}else{
					$(this).attr('data-num', 1);
					_this.find(options.toggleBtn).html('&#xe634;');
					_this.find(options.groupMain).addClass(options.active);
					_this.find(options.groupMask).show();
				}
			})
			$(options.groupMain).each(function(n, v){
				var groupHeight = $(this).height();
				if(groupHeight < options.showHeight){
					_this.find(options.toggleBtn).hide();
					_this.find(options.groupMask).hide();
					_this.find(options.groupMain).removeClass(options.active);
					// $(this).next().hide();
					// $(this).find(options.answerMask).hide();
					// $(this).removeClass(options.clamp);
				}
			});
		});
	}
})(jQuery);




/*

$.fn.fixedCont = function(options){
	var options = $.extend({
		eventType: "hover",
	},options||{});
	return this.each(function(){
		var _this = $(this);

	});
}

*/

var win_width= window.innerWidth || document.documentElement.clientWidth;
if(win_width>=1500) var camera_margin=33;
if(win_width<1500) var camera_margin=0;

$(function(){
	var Windows_c = new changewin();
	$("#sort-box").menuShow();
	$("#nav-list").navShow();
	$("#userInfo").navShow();
	$("#toolbar").returnTop();
	$("#fixedHeaderBox").fixedHeader();
	$("#login-modal").loginModal();

});




