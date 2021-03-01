
(function (doc,win) {
    //font size
	var docEl = doc.documentElement;
	var resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize';
	var recalc = function () {
		var clientWidth = docEl.clientWidth;
		if (!clientWidth) return;
		docEl.style.fontSize = (clientWidth / 320 * 10).toFixed(1) + 'px';
	};
	recalc();
	if (!doc.addEventListener) return;
	win.addEventListener(resizeEvt, recalc, false);
    //nav show and hide
    /**  */
    var isReady=false; //判断onDOMReady方法是否已经被执行过
    var readyList= [];//把需要执行的方法先暂存在这个数组里
    var timer;//定时器句柄
  ready=function(fn)
  {
   if (isReady )
    fn.call( document);
   else
    readyList.push( function() { return fn.call(this);});
   return this;
  }
  
  var onDOMReady=function(){
   for(var i=0;i< readyList.length;i++)
   {
    readyList[i].apply(document);
   }
   readyList = null;
  }
  
  var bindReady = function(evt)
  {
   if(isReady) return;
   isReady=true;
   onDOMReady.call(window);
   if(document.removeEventListener)
   {
    document.removeEventListener("DOMContentLoaded", bindReady, false);
   }
   else if(document.attachEvent)
   {
    document.detachEvent("onreadystatechange", bindReady);
    if(window == window.top){
     clearInterval(timer);//事件发生后清除定时器
     timer = null;
    }
   }
  };
  
  if(document.addEventListener){
   document.addEventListener("DOMContentLoaded", bindReady, false);
  }
  else if(document.attachEvent)//非最顶级父窗口
  
  {
   document.attachEvent("onreadystatechange", function(){
    if((/loaded|complete/).test(document.readyState))
    bindReady();
   });
  
  if(window == window.top)//在应用有frameset或者iframe的页面时，parent是父窗口，top是最顶级父窗口（有的窗口中套了好几层frameset或者iframe)
  {
   timer = setInterval(function(){
    try
    {
     isReady||document.documentElement.doScroll('left');//在IE下用能否执行doScroll判断 dom是否加载完毕
    }
    catch(e)
    {
     return;
    }
    bindReady();
   },5);
  }
  }
  ready(function(){
 var menu_tag = document.getElementById("menu_tag");
        var nav_menu = document.getElementById("nav_menu");
        var header_main = document.getElementById("header_main");
        var header_mark = document.getElementById("header_mark");
        var falg = true;
        if(menu_tag){
            menu_tag.onclick = function(){
                if(falg){
                    nav_menu.style.display="block";
                    if(header_main){
                        header_main.className = 'header-main header-fixed';
                    }
                    falg=false;
                }else{
                    nav_menu.style.display="none";
                    if(header_main){
                        header_main.className = 'header-main';
                    }
                    falg=true;
                }
            }
        }
        if(header_mark){
            header_mark.onclick = function(){
                nav_menu.style.display="none";
                header_main.className = 'header-main';
                falg=true;
            }            
        }
});
    // window.onload = function(){
    //     var menu_tag = document.getElementById("menu_tag");
    //     var nav_menu = document.getElementById("nav_menu");
    //     var header_main = document.getElementById("header_main");
    //     var header_mark = document.getElementById("header_mark");
    //     var falg = true;
    //     if(menu_tag){
    //         menu_tag.onclick = function(){
    //             if(falg){
    //                 nav_menu.style.display="block";
    //                 if(header_main){
    //                     header_main.className = 'header-main header-fixed';
    //                 }
    //                 falg=false;
    //             }else{
    //                 nav_menu.style.display="none";
    //                 if(header_main){
    //                     header_main.className = 'header-main';
    //                 }
    //                 falg=true;
    //             }
    //         }
    //     }
    //     if(header_mark){
    //         header_mark.onclick = function(){
    //             nav_menu.style.display="none";
    //             header_main.className = 'header-main';
    //             falg=true;
    //         }            
    //     }

    // }
    //返回顶部
    window.onscroll = function () {
        var t = document.documentElement.scrollTop || document.body.scrollTop;
        var return_top = document.getElementById("return-top");
        if (return_top){
            if (t >= 600) {
                return_top.style.display = "inline";
            } else {
                return_top.style.display = "none";
            }
            return_top.onclick = function () {
                window.scrollTo(0, 1);
            }
        }
    }
})(document, window);
