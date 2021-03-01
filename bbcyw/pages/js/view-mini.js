function GotoPage(_pageindex) {
    Viewer._GotoPage(_pageindex)
}
function flashDebug(_O0llOl) {
    $("#_l1OllO").prepend(_O0llOl + "<br/>")
}
function HeaderLoaded(pageIndex) {
    var _O0llO0 = Viewer._mhls[pageIndex - 1];
    if (_O0llO0 == 0) {
        Viewer._mhls[pageIndex - 1] = 1;
        Viewer._GetCurrentPageIndex();
        Viewer._setZoomScreen();
        Viewer._setButtonScreen()
    }
}
function initPage() {
    Viewer.InitPage()
}
function initWidth() {
    Viewer.initWidth()
}
var errorIf = false;
$(document).ready(function () {
    $('#readshop').css({
        position: "fixed",
        width: "100%",
        zIndex: "999999",
        bottom: 0
    });
    Viewer.Init()
});
$(window).resize(function () {
    Viewer.Resize()
});
var Viewer = function () { }; (function () {
    Viewer._CurrentPageIndex = 1;
    Viewer._pageCount = 5;
    Viewer._011lll = 0;
    Viewer._lllOl1 = 0;
    Viewer._dfsp = 0;
    Viewer._10l0O0 = 0;
    Viewer._l110l1 = 5;
    Viewer._mark = 0;
    Viewer._zoomRate2 = 1;
    Viewer._zoomArray = new Array(1, 0, 0, 0, 0);
    Viewer._Zoom2 = new Array(0, 1, 0, 0, 0, 0);
    Viewer.ADSArray = new Array();
    Viewer.ADArray = new Array("", "", "", "", "");
    Viewer._1OO1Ol = 0;
    Viewer._OlO101 = new Array();
    Viewer._00000O = 0;
    Viewer._10O0Ol = 0;
    Viewer._adpagecount = 2;
    Viewer._11110O = 0;
    Viewer._O00Ol0 = false;
    Viewer.urlroot = "www.studylead.com";
    Viewer.swfViewerUrl = "css/view/FP_v2.swf";
    Viewer._SwfWidth = 700;
    Viewer._SwfWidth_real = 500;
    Viewer._0OllO1 = 0;
    Viewer._01OO11 = false;
    Viewer._mhs = 0;
    Viewer._PageArray = null;
    Viewer._mhls = null;
    Viewer._mpebt = null;
    Viewer._isNoIE = false;
    Viewer._mhost = "";
    Viewer._mhost = "";
    Viewer._mimgH = "";
    Viewer._OO1l1O = 0;
    Viewer._l101O1 = 0;
    Viewer._llllll = !-[1, ] && !window.XMLHttpRequest;
    Viewer._O0lOl1 = 0;
    Viewer._isfrscreen = false;
    Viewer._boxrightWidth = 0;
    Viewer._O1lll1 = false;
    Viewer.Para1 = "";
    Viewer.sw = "";
    Viewer.sh = "";
    Viewer.stp = 1;
    Viewer._lmt = 1;
    Viewer._lmtext = "";
    Viewer.realheight = 0;
    Viewer.$ = function (id) {
        return document.getElementById(id)
    };
    Viewer.$C = function (id) {
        return document.createElement(id)
    };
    Viewer.getHours = function () {
        var localTime = new Date();
        var _1llO11 = parseInt(localTime.getTime()) + parseInt(Viewer._l101O1);
        var Timer = new Date(_1llO11);
        var hours = Timer.getHours();
        return hours
    };
    Viewer.getcookie = function (key) {
        var _l0OO1l = "";
        var _l10l11 = document.cookie.split('; ');
        for (var i = 0,
        l = _l10l11.length; i < l; i++) {
            var _01OlOO = _l10l11[i].split('=');
            if (_01OlOO[0] == key) {
                if (_01OlOO.length > 1) {
                    _l0OO1l = unescape(_01OlOO[1])
                }
            }
        }
        return _l0OO1l
    };
    Viewer.setcookie = function (key, _010O11, _l01O1O) {
        Viewer.setcookie0(key);
        var key = escape(key);
        var _010O11 = escape(_010O11);
        _10lO0O = "/";
        _10lO0O = _10lO0O == "" ? "" : ";path=" + _10lO0O;
        if (_l01O1O > 0) {
            var _Ol1110 = new Date();
            var _lO00O0 = _l01O1O * 3600 * 1000;
            _Ol1110.setTime(_Ol1110.getTime() + _lO00O0);
            document.cookie = key + "=" + _010O11 + _10lO0O + "; expires=" + _Ol1110.toGMTString()
        } else {
            document.cookie = key + "=" + _010O11 + _10lO0O
        }
    };
    Viewer.setcookie0 = function (key) {
        var date = new Date();
        date.setTime(date.getTime() - 1);
        document.cookie = key + "=;expires=" + date.toGMTString()
    };
    Viewer.InitSwfWidth = function () {
        Viewer._SwfWidth = $("#boxleft").width()
    };
    Viewer.initWidth = function () {
        var _111OOO = "mm";
        Viewer._SwfWidth_real = minwidth;
        document.write('<style>.mainpart{margin:auto;width:1130px;}.header .search .stext{width:220px;padding:0 5px;background-position:left 0;}.commonbox1 .box{padding:10px 0px; height:164px;width:710px;}</style>');
        var arr = adarray.split(',');
        for (var i = 0; i < arr.length; i++) {
            Viewer.ADSArray[i] = arr[i]
        }
    };
    Viewer._zoomAdd = function () {
        if (Viewer._isfrscreen) {
            if (Viewer._11110O >= Viewer._Zoom2.length - 1) {
                return
            }
        } else {
            if (Viewer._11110O >= Viewer._zoomArray.length - 1) {
                return
            }
        }
        Viewer._11110O++;
        Viewer._ChangeSwfScreen();
        Viewer._setZoomScreen()
    };
    Viewer._zoomDown = function () {
        if (Viewer._11110O > 0) {
            Viewer._11110O--;
            Viewer._ChangeSwfScreen()
        }
        Viewer._setZoomScreen()
    };
    Viewer._ChangeSwfScreen = function () {
        var _swfwidth = Viewer._SwfWidth;
        if (Viewer._isfrscreen) {
            _swfwidth += Viewer._boxrightWidth
        }
        var _1l1l00 = 0;
        var _Oll001 = 0;
        if (Viewer._isfrscreen) {
            Viewer._zoomRate2 = Viewer._Zoom2[Viewer._11110O]
        } else {
            Viewer._zoomRate2 = Viewer._zoomArray[Viewer._11110O]
        }
        Viewer._zoomRate2 = 1;
        var _PageHeight2_1 = _swfwidth * Viewer._zoomRate2;
        _Oll001 = _PageHeight2_1 - $("#outer_page_1").width();
        var _PageHeight2_2 = Viewer.sh * (_PageHeight2_1 / Viewer.sw) * Viewer._zoomRate2;
        if (Viewer.realheight > 0) _PageHeight2_2 = Viewer.realheight;
        else Viewer.realheight = _PageHeight2_2;
        $("div .inner_page").each(function () {
            var _pageindex = parseInt(this.id.split("_")[1]);
            if (_pageindex <= Viewer._CurrentPageIndex) {
                _1l1l00 += _PageHeight2_2 - $(this).height()
            }
            $(this).width(_PageHeight2_1);
            $(this).height(_PageHeight2_2)
        });
        $("div .inner_page div").each(function () {
            var _pageindex = parseInt(this.id.split("_")[1]);
            if (_pageindex <= Viewer._CurrentPageIndex) {
                _1l1l00 += _PageHeight2_2 - $(this).height()
            }
            $(this).width(_PageHeight2_1);
            $(this).height(_PageHeight2_2)
        });
        var _0l1O0O = $("#mainpart").width() + _Oll001;
        $("#mainpart").width(_0l1O0O);
        Viewer._011lll = new Date().getTime() + 200;
        var _01l0Ol = $(window).scrollTop() + _1l1l00;
        if (_01l0Ol > 0 && $(window).scrollTop() > 60) {
            Viewer._GotoPage(Viewer._CurrentPageIndex)
        }
        Viewer._Resize();
        setTimeout("Viewer._ResizeSwf1()", 100)
    };
    Viewer._ResizeSwf1 = function () {
        return;
        $("div .inner_page").each(function () {
            var _pageindex2 = parseInt(this.id.split("_")[1]);
            Viewer._ResizeSwf(_pageindex2 - 1)
        });
        $("div .inner_page div").each(function () {
            var _pageindex2 = parseInt(this.id.split("_")[1]);
            Viewer._ResizeSwf(_pageindex2 - 1)
        });
        if (Viewer._mark == 0) {
            Viewer._mark = 1;
            var _0Oll1O = Viewer.stp == 0 ? Viewer.getcookie("Page_" + product_code) : Viewer.stp;
            if (_0Oll1O != "" && _0Oll1O > 0) {
                Viewer._GotoPage(_0Oll1O)
            }
        }
    };
    Viewer._ResizeSwf = function (pn) {
        if (document.getElementById("pageflash_" + pn)) {
            try {
                document.getElementById("pageflash_" + pn).AdjustWidth()
            } catch (e) { }
        }
    };
    Viewer._setZoomScreen = function () {
        Viewer._GetCurrentPageIndex();
        if (Viewer._11110O == 0) {
            $("#zoomOutButton").attr("disabled", true);
            $("#zoomOutButton").removeClass("zooms");
            $("#zoomOutButton").addClass("no-zooms")
        } else {
            $("#zoomOutButton").attr("disabled", false);
            $("#zoomOutButton").removeClass("no-zooms");
            $("#zoomOutButton").addClass("zooms")
        }
        if (Viewer._isfrscreen) {
            if (Viewer._11110O == 1) {
                $("#zoomInButton").attr("disabled", true);
                $("#zoomInButton").removeClass("zoomb");
                $("#zoomInButton").addClass("no-zoomb")
            } else {
                $("#zoomInButton").attr("disabled", false);
                $("#zoomInButton").removeClass("no-zoomb");
                $("#zoomInButton").addClass("zoomb")
            }
        } else {
            if (Viewer._11110O == 1) {
                $("#zoomInButton").attr("disabled", true);
                $("#zoomInButton").removeClass("zoomb");
                $("#zoomInButton").addClass("no-zoomb")
            } else {
                $("#zoomInButton").attr("disabled", false);
                $("#zoomInButton").removeClass("no-zoomb");
                $("#zoomInButton").addClass("zoomb")
            }
        }
    };
    Viewer._setButtonScreen = function () {
        if (Viewer._CurrentPageIndex == 1) {
            $("#prePageButton").attr("disabled", true);
            $("#prePageButton").removeClass("prevsmall");
            $("#prePageButton").addClass("no-prev")
        } else {
            $("#prePageButton").attr("disabled", false);
            $("#prePageButton").removeClass("no-prev");
            $("#prePageButton").addClass("prevsmall")
        }
        if (Viewer._CurrentPageIndex == Viewer._pageCount) {
            $("#nextPageButton").attr("disabled", true);
            $("#nextPageButton").removeClass("nextsmall");
            $("#nextPageButton").addClass("no-next")
        } else {
            $("#nextPageButton").attr("disabled", false);
            $("#nextPageButton").removeClass("no-next");
            $("#nextPageButton").addClass("nextsmall")
        }
    };
    Viewer._PrePage = function () {
        Viewer._GotoPage(Viewer._CurrentPageIndex - 1)
    };
    Viewer._NextPage = function () {
        Viewer._GotoPage(Viewer._CurrentPageIndex + 1)
    };
    Viewer._GotoPage = function (_pageindex) {
        if (_pageindex < 1) {
            _pageindex = 1
        }
        if (_pageindex > Viewer._pageCount) {
            _pageindex = Viewer._pageCount
        }
        if (leftfilecount > 0 && defaultShowPage2 < _pageindex) {
            showmorepage()
        }
        Viewer._011lll = new Date().getTime() + 200;
        Viewer._LoadSwfpage(_pageindex, 1);
        var top = $("#outer_page_" + _pageindex).offset().top;
        if (!$("#header").is(":hidden")) {
            $(window).scrollTop(top)
        } else {
            $(window).scrollTop(top)
        }
    };
    Viewer.getPageHeight = function (_pageindex) {
        return Viewer.sh
    };
    Viewer.Resize = function () {
        Viewer._Resize()
    };
    Viewer._AddAdInfo = function (_OOl0lO, _1lOOOO, _pageindex, _PageHeight2_2, adindex) {
        if (_OOl0lO == "") return "";
        var _Olll1O = '<div class="addiv" style="float:auto;text-align:center;" id="ad_' + _pageindex + '" adloaded="' + _1lOOOO + '" link="' + adindex + '">';
        _Olll1O += '<iframe style="padding-top:10px;" id="ad_iframe_' + _pageindex + '" width="900px" src="ad.aspx?id=' + _OOl0lO + '" height="110" frameborder="0" scrolling="no"></iframe>';
        _Olll1O += '</div>';
        return _Olll1O
    };
    Viewer._00O0OO = 3;
    Viewer._Ol01l0 = false;
    Viewer._00110l = false;
    Viewer._0OO01l = 318;
    Viewer._01O0Ol = 220;
    Viewer._lO00l0 = false;
    Viewer._CurY2 = 0;
    Viewer._O010O0 = 0;
    Viewer._CurY = 0;
    Viewer._Resize = function () {
        if (!Viewer._llllll) {
            if (!Viewer._Ol01l0) {
                return
            }
            setTimeout("Viewer._ResizeSwf1()", 100);
            var pn = document.getElementById("pageNumInput").value;
            if (BookMarkPage != pn) document.getElementById("bookmark").className = "mark";
            else document.getElementById("bookmark").className = "mark1";
            var Y = $(this).scrollTop();
            var Y_Div = $("#pageContainer").height() + 150;
            var _O0l100 = $(document).height() - 1100;
            var boxright_h = $("#boxright").height();
            var box3_h = $("#box3").height();
            var relatebox_h = $("#relatebox").height();
            var left_h = boxright_h - box3_h - relatebox_h - 20;
            var left_h2 = boxright_h - relatebox_h - 10;
            var left_y = Y_Div - Y;
            if (left_y < left_h2) {
                $("#relatebox0").hide();
                $("#relatebox").hide();
                //$('#boxright').css({
                //    position: "fixed",
                //    left: $("#boxleft").offset().left + $("#boxleft").width() + 10,
                //    top: "43px"
                //})
            } else if (left_y < left_h) {
                $("#relatebox0").hide();
                $("#relatebox").hide();
                $('#box3').hide();
                //$('#boxright').css({
                //    position: "fixed",
                //    left: $("#boxleft").offset().left + $("#boxleft").width() + 10,
                //    top: "43px"
                //})
            } else {
                if (Y < 300) $("#relatebox0").show();
                else $("#relatebox0").hide();
                $("#relatebox").show();
                $('#box3').show();
                //$('#boxright').css({
                //    position: "fixed",
                //    left: $("#boxleft").offset().left + $("#boxleft").width() + 10,
                //    top: "43px"
                //})
            }
            Viewer._CurY = Y;
            if (Y < Viewer._01O0Ol && $('#boxright').css("position") == "fixed") {
                //$('#boxright').css({
                //    position: "static",
                //    left: "0",
                //    top: "0"
                //})
            }
            if (Y > 196 && $('#readshop').css("position") != "fixed") {
                $('#readshop').css({
                    position: "fixed",
                    width: "100%",
                    zIndex: "999"
                });
                //$('#boxright').css({
                //    top: "43px"
                //})
            } else if (Y <= 196 && $('#readshop').css("position") == "fixed") {
                $('#readshop').css({
                    // position: "static",
                    zIndex: "1"
                })
            }
        }
        if (Viewer._llllll) {
            var Y = $(this).scrollTop();
            if (Y > 233) {
                $('#box3').hide();
                var _010Oll = $('#boxright').height();
                var _lOOO1O = $(".activelist").offset().top - 11;
                if (Y + _010Oll >= _lOOO1O) {
                    var _OO0O00 = -(Y + _010Oll - _lOOO1O);
                    //$('#boxright').css({
                    //    position: "absolute",
                    //    left: $("#boxleft").offset().left + $("#boxleft").width() + 10,
                    //    top: (Y + _OO0O00) + "px"
                    //})
                } else {
                    //$('#boxright').css({
                    //    position: "absolute",
                    //    left: $("#boxleft").offset().left + $("#boxleft").width() + 10,
                    //    top: (Y + 45) + "px"
                    //})
                }
            } else {
                //$('#boxright').css({
                //    position: "absolute",
                //    left: $("#boxleft").offset().left + $("#boxleft").width() + 10,
                //    top: "98px"
                //});
                $('#box3').show()
            }
        }
    };
    Viewer.InitPage = function () {
        Viewer._pageCount = mtp;
        Viewer._product_code = product_code;
        Viewer._mhs = mhs;
        Viewer._mhls = mhls;
        Viewer._mfvs = mfvs;
        Viewer.stp = stp;
        Viewer._lmt = lmt;
        Viewer._lmtext = lmtext;
        Viewer.sw = sw;
        Viewer.ADArray = adarray;
        Viewer.sh = sh;
        Viewer._adpagecount = adpagecount;
        Viewer.urlroot = url_root;
        Viewer.swfViewerUrl = url_root + Viewer.swfViewerUrl;
        Viewer._dfsp = defaultShowPage;
        window.setTimeout(function () {
            Viewer.InitSwfWidth();
            Viewer._isNoIE = navigator.userAgent.indexOf('Firefox') >= 0 || navigator.userAgent.indexOf('Chrome') >= 0 || navigator.userAgent.indexOf('Safari') >= 0;
            for (var i = 1; i <= Viewer._pageCount; i++) {
                Viewer._Addpage(i);
                if (i == 1) {
                    $("#outer_page_1").before(Viewer._AddAdInfo(Viewer.ADSArray[0], 1, 1, 106, 0));
                    $("#outer_page_1").after(Viewer._AddAdInfo(Viewer.ADSArray[0], 1, 1, 106, 0))
                }
                if (Viewer._dfsp > 0 && i >= Viewer._dfsp) break
            }
            HeaderLoaded(1);
            Viewer.InitAD();
            var _0Oll1O = Viewer.stp == 0 ? Viewer.getcookie("Page_" + product_code) : Viewer.stp;
            if (BookMarkPage > 1) _0Oll1O = BookMarkPage;
            if (_0Oll1O != "" && _0Oll1O > 0) {
                Viewer._GotoPage(_0Oll1O)
            } else {
                $("div .outer_page").each(function () {
                    if ($(window).height() > $(this).offset().top) {
                        var _pageindex = parseInt(this.id.split("_")[2]);
                        Viewer._LoadSwfpage(_pageindex, 1)
                    }
                })
            }
        },
        100)
    };
    Viewer.InitAD = function () {
        if (Viewer.ADSArray.length == 0) return;
        Viewer._Ol01l0 = true;
        Viewer._Resize();
        for (var _idx = 2; _idx <= Viewer._pageCount; _idx++) {
            var _OO0O00 = 0;
            if (_idx % Viewer._adpagecount == 0) {
                if (Viewer._1OO1Ol < Viewer.ADSArray.length - 1) {
                    Viewer._1OO1Ol++;
                    if (Viewer._1OO1Ol > (Viewer.ADSArray.length - 2)) Viewer._1OO1Ol = 0;
                    $("#outer_page_" + _idx).before(Viewer._AddAdInfo(Viewer.ADSArray[Viewer._1OO1Ol], _OO0O00, _idx, 106, Viewer._1OO1Ol))
                }
            }
        }
        $("#outer_page_" + Viewer._pageCount).after(Viewer._AddAdInfo(Viewer.ADSArray[Viewer.ADSArray.length - 1], 1, Viewer._pageCount + 1, 90, Viewer.ADSArray.length - 1))
    };
    Viewer.InitAD_left = function () {
        if (Viewer.ADSArray.length == 0) return;
        Viewer._Ol01l0 = true;
        Viewer._Resize();
        for (var _idx = Viewer._dfsp; _idx <= Viewer._pageCount; _idx++) {
            var _OO0O00 = 0;
            if (_idx % Viewer._adpagecount == 0) {
                if (Viewer._1OO1Ol < Viewer.ADSArray.length - 1) {
                    Viewer._1OO1Ol++;
                    if (Viewer._1OO1Ol > (Viewer.ADSArray.length - 2)) Viewer._1OO1Ol = 0;
                    if (_idx > 2)
                    {
                        $("#outer_page_" + _idx).before(Viewer._AddAdInfo(Viewer.ADSArray[Viewer._1OO1Ol], _OO0O00, _idx, 106, Viewer._1OO1Ol))
                    } 
                }
            }
        }
        $("#outer_page_" + Viewer._pageCount).after(Viewer._AddAdInfo(Viewer.ADSArray[Viewer.ADSArray.length - 1], 1, Viewer._pageCount + 1, 90, Viewer.ADSArray.length - 1))
    };
    Viewer._SetPageTopInfo = function () {
        if (!Viewer._O1lll1) {
            var _pageindex = 0;
            var _00OOl0 = 200000;
            var _0l1lO1 = $(window).height() / 2 + $(window).scrollTop();
            $("div .outer_page").each(function () {
                var _O0lOO1 = parseInt(this.id.split("_")[2]);
                var _ll0O10 = Viewer.getPageHeight(_O0lOO1);
                var _ll011l = parseInt($(this).offset().top) + _ll0O10 / 2;
                var _001111 = _0l1lO1 - _ll011l;
                if (_001111 < 0) _001111 = -_001111;
                if (_001111 < _00OOl0) {
                    _00OOl0 = _001111;
                    _pageindex = _O0lOO1
                }
            });
            $("#currentPageSpan").html(_pageindex);
            Viewer._CurrentPageIndex = _pageindex;
            $("#pageNumInput").val(_pageindex);
            Viewer._setButtonScreen();
            Viewer._O1lll1 = false
        }
    };
    Viewer.Init = function () {
        Viewer._boxrightWidth = $("#boxright").width() + 10;
        var _boxleftWidth = $("#boxleft").width();
        var _zoomleft = (screen.width - 40 - Viewer._boxrightWidth) / _boxleftWidth;
        var _swfRagehw = Viewer._SwfWidth_real / _boxleftWidth;
        var _0lO11O = 1;
        var _000Ol1 = (_zoomleft - ((_zoomleft - 1) * 0.75)).toFixed(2);
        var _l1lO1l = (_zoomleft - ((_zoomleft - 1) * 0.5)).toFixed(2);
        var _OO0010 = (_zoomleft - ((_zoomleft - 1) * 0.25)).toFixed(2);
        var _00lOO0 = _zoomleft.toFixed(2);
        Viewer._zoomArray[0] = _0lO11O;
        Viewer._zoomArray[1] = _000Ol1;
        Viewer._zoomArray[2] = _l1lO1l;
        Viewer._zoomArray[3] = _OO0010;
        Viewer._zoomArray[4] = _00lOO0;
        var _Screen_swfwidth = (screen.width - 40) / (_boxleftWidth + Viewer._boxrightWidth);
        var _Swf_screenwidth = Viewer._SwfWidth_real / (_boxleftWidth + Viewer._boxrightWidth);
        var _0O1000 = _Swf_screenwidth.toFixed(2);
        var _1l00O0 = 1;
        var _l101OO = (_Screen_swfwidth - ((_Screen_swfwidth - 1) * 0.75)).toFixed(2);
        var _O0ll1l = (_Screen_swfwidth - ((_Screen_swfwidth - 1) * 0.5)).toFixed(2);
        var _l0lO00 = (_Screen_swfwidth - ((_Screen_swfwidth - 1) * 0.25)).toFixed(2);
        var _l0O0O0 = _Screen_swfwidth.toFixed(2);
        Viewer._Zoom2[0] = _0O1000;
        Viewer._Zoom2[1] = _1l00O0;
        Viewer._Zoom2[2] = _l101OO;
        Viewer._Zoom2[3] = _O0ll1l;
        Viewer._Zoom2[4] = _l0lO00;
        Viewer._Zoom2[5] = _l0O0O0;
        if (screen.width <= 1024) {
            Viewer._zoomArray = new Array(1);
            Viewer._zoomArray[0] = _0lO11O;
            Viewer._Zoom2 = new Array(1, 0);
            Viewer._Zoom2[0] = _0O1000;
            Viewer._Zoom2[1] = _1l00O0
        }
        $("#frscreen").click(function () {
            if ($("#boxright").is(":hidden")) {
                $("#boxright").show();
                $("#box1").show();
                $("#frscreen").removeClass().addClass("fullscreen").attr("title", "全屏显示");
                $("#boxleft").removeClass().addClass("boxleft");
                Viewer._11110O = 0;
                Viewer._setZoomScreen();
                Viewer._isfrscreen = false;
                Viewer._ChangeSwfScreen(1)
            } else {
                $("#boxright").hide();
                $("#box1").hide();
                $("#frscreen").removeClass().addClass("escscreen").attr("title", "恢复窗口");
                $("#boxleft").removeClass().addClass("boxleft1");
                Viewer._11110O = 1;
                Viewer._setZoomScreen();
                Viewer._isfrscreen = true;
                Viewer._ChangeSwfScreen(1)
            }
        });
        $(window).bind("scroll",
        function (event) {
            var nowTime = new Date().getTime();
            if (Viewer._011lll < nowTime) {
                Viewer._011lll = nowTime;
                if (!Viewer._O00Ol0) {
                    Viewer._lllOl1 = window.setInterval(Viewer._GetCurrentPageIndex, 200);
                    Viewer._O00Ol0 = true
                }
                Viewer._SetPageTopInfo()
            }
            Viewer._Resize()
        });
        $("#zoomInButton").click(function () {
            if ($("#boxright").is(":hidden")) {
                $("#boxright").show();
                $("#box1").show();
                $("#frscreen").removeClass().addClass("fullscreen").attr("title", "全屏显示");
                $("#boxleft").removeClass().addClass("boxleft");
                Viewer._11110O = 0;
                Viewer._setZoomScreen();
                Viewer._isfrscreen = false;
                Viewer._ChangeSwfScreen(1)
            } else {
                $("#boxright").hide();
                $("#box1").hide();
                $("#frscreen").removeClass().addClass("escscreen").attr("title", "恢复窗口");
                $("#boxleft").removeClass().addClass("boxleft1");
                Viewer._11110O = 1;
                Viewer._setZoomScreen();
                Viewer._isfrscreen = true;
                Viewer._ChangeSwfScreen(1)
            }
        });
        $("#zoomOutButton").click(function () {
            if ($("#boxright").is(":hidden")) {
                $("#boxright").show();
                $("#box1").show();
                $("#frscreen").removeClass().addClass("fullscreen").attr("title", "全屏显示");
                $("#boxleft").removeClass().addClass("boxleft");
                Viewer._11110O = 0;
                Viewer._setZoomScreen();
                Viewer._isfrscreen = false;
                Viewer._ChangeSwfScreen(1)
            } else {
                $("#boxright").hide();
                $("#box1").hide();
                $("#frscreen").removeClass().addClass("escscreen").attr("title", "恢复窗口");
                $("#boxleft").removeClass().addClass("boxleft1");
                Viewer._11110O = 1;
                Viewer._setZoomScreen();
                Viewer._isfrscreen = true;
                Viewer._ChangeSwfScreen(1)
            }
        });
        $("#prePageButton").click(function () {
            Viewer._PrePage();
            this.blur()
        });
        $("#nextPageButton").click(function () {
            Viewer._NextPage();
            this.blur()
        });
        $("#soapFrame").height(360);
        var params = {
            "XOffset": 0,
            "YOffset": 0,
            "width": 200,
            "fontColor": "#000",
            "fontColorHI": "#FFF",
            "fontSize": "13px",
            "fontFamily": "宋体",
            "borderColor": "gray",
            "bgcolorHI": "#03c",
            "sugSubmit": false
        }
    };
    Viewer.GetObject = function (movieName) {
        if (navigator.appName.indexOf("Microsoft") != -1) {
            return window[movieName]
        } else {
            return document[movieName]
        }
    };
    Viewer._GetCurrentPageIndex = function () {
        var _10OllO = new Date().getTime();
        if (_10OllO - Viewer._011lll > 100) {
            var _pageindex = 0;
            var _00OOl0 = 200000;
            var _0l1lO1 = $(window).height() / 2 + $(window).scrollTop();
            $("div .outer_page").each(function () {
                var _O0lOO1 = parseInt(this.id.split("_")[2]);
                var _ll0O10 = Viewer.getPageHeight(_O0lOO1);
                var _ll011l = parseInt($(this).offset().top) + _ll0O10 / 2;
                var _001111 = _0l1lO1 - _ll011l;
                if (_001111 < 0) _001111 = -_001111;
                if (_001111 < _00OOl0) {
                    _00OOl0 = _001111;
                    _pageindex = _O0lOO1
                }
            });
            Viewer._LoadSwfpage(_pageindex, 1);
            if (Viewer._lllOl1 > 0) {
                window.clearInterval(Viewer._lllOl1);
                Viewer._lllOl1 = 0;
                Viewer._O00Ol0 = false
            }
        }
    };
    Viewer._O01111 = function (_pageindex) {
        if (_pageindex == 1) {
            return 0
        }
        var pageIndex = (_pageindex - 1) % Viewer._l110l1;
        if (pageIndex == 0) pageIndex = Viewer._l110l1;
        return pageIndex
    };
    Viewer._ll1l1O = function (_pageindex) {
        return Viewer._mhost
    };
    Viewer._LoadSwfpage = function (_pageindex, type) {
        _pageindex = parseInt(_pageindex);
        if (_pageindex > Viewer._pageCount || _pageindex < 1) return;
        var _PageHeight_1 = 1;
        if (Viewer._dfsp > 0 && Viewer._dfsp < _pageindex) return;
        var _O0llO0 = Viewer._mhls[_pageindex - 1];
        var _l1O0lO = Viewer._mfvs[_PageHeight_1 - 1];
        if (_pageindex > 1 && _O0llO0 == 0 && _l1O0lO == 1) {
            return
        }
        Viewer._mfvs[_PageHeight_1 - 1] = 1;
        if (type == 1) {
            $("#currentPageSpan").html(_pageindex);
            Viewer._CurrentPageIndex = _pageindex;
            $("#pageNumInput").val(_pageindex);
            Viewer._LoadSwfpage(_pageindex - 2, 0);
            Viewer._LoadSwfpage(_pageindex - 1, 0);
            Viewer._LoadSwfpage(_pageindex + 1, 0);
            Viewer._LoadSwfpage(_pageindex + 2, 0);
            Viewer._setButtonScreen();
            Viewer.setcookie("Page_" + product_code, _pageindex, 30 * 24)
        }
        try {
            if ($("#page_" + _pageindex).html().length > 200) {
                return
            }
        } catch (e) { }
        var imgurl = document.getElementById("dp").value + _pageindex + ".gif";
        if (Viewer._isNoIE) { }
        var _OO1Ol0 = $("#pageflash_" + _pageindex);
        if (_OO1Ol0 && _OO1Ol0.length < 1) {
            var _swfwidth = Viewer._SwfWidth;
            if (Viewer._isfrscreen) {
                _swfwidth += Viewer._boxrightWidth
            }
            var _PageHeight2_1 = Viewer.sw;
            var _PageHeight2_2 = Math.round(Viewer.sh * ((_swfwidth + 0.00) / _PageHeight2_1));
            var _1OlOll = Viewer.$C("div");
            _1OlOll.id = "pageflash_" + _pageindex;
            _1OlOll.name = "pageflash_" + _pageindex;
            document.getElementById("page_" + _pageindex).appendChild(_1OlOll);
            if (Viewer.realheight > 0) _PageHeight2_2 = Viewer.realheight;
            else Viewer.realheight = _PageHeight2_2;
            $("#pageflash_" + _pageindex).css('line-height', _PageHeight2_2);
            $("#pageflash_" + _pageindex).css('height', _PageHeight2_2);
            $("#pageflash_" + _pageindex).css('width', _swfwidth);
            if (Viewer._lmt >= _pageindex) {
                _1OlOll.innerHTML = "<img src='" + imgurl + "' alt='' ondragstart='return false;'/>"
            } else {
                _1OlOll.innerHTML = Viewer._lmtext
            }
        }
    };
    Viewer._0ll1Ol = function (_pageindex, _OO1Ol0, pageIndex, _PageHeight_1, _O0l0O1, _1OllO1, _O1Ol00) {
        if (_O1Ol00 > 4) {
            return
        }
        try {
            Viewer.GetObject("pageflash_" + pageIndex)._O0O0O00(_PageHeight_1, _O0l0O1, _1OllO1);
            $("#page_" + _pageindex).append(_OO1Ol0)
        } catch (e) {
            window.setTimeout(function () {
                Viewer._0ll1Ol(_pageindex, _OO1Ol0, pageIndex, _PageHeight_1, _O0l0O1, _1OllO1, parseInt(_O1Ol00) + 1)
            },
            500)
        }
    };
    Viewer._00O111 = function (_lOl00l, _0OlO10) {
        if (_lOl00l == _0OlO10) return true;
        var _OOOll1 = true;
        var _lO00Ol = Viewer.sw;
        var _l1011l = Viewer.sh;
        for (var _idx = _lOl00l + 1; _idx <= _0OlO10; _idx++) {
            var _O010ll = Viewer.sw;
            var _O11l01 = Viewer.sh;
            if (_O010ll != _lO00Ol || _O11l01 != _l1011l) {
                _OOOll1 = false;
                break
            }
        }
        return _OOOll1
    };
    Viewer._Addpage = function (_pageindex) {
        if (Viewer._SwfWidth < minwidth) Viewer._SwfWidth = minwidth;
        var _PageHeight2_1 = Viewer.sw;
        var _PageHeight2_2 = Math.round(Viewer.sh * ((Viewer._SwfWidth + 0.01) / _PageHeight2_1));
        var _loadingImgUrl = "images/page-loading.gif";
        if (_pageindex == 1) {
            var _lOlO1l = 1024 * 1024;
            var _0OlO10 = 0;
            if (Viewer._mhs >= _lOlO1l && Viewer._mhs < _lOlO1l * 2) {
                _0OlO10 = 1
            } else if (Viewer._mhs >= _lOlO1l * 2 && Viewer._mhs < _lOlO1l * 3) {
                _0OlO10 = 2
            } else if (Viewer._mhs >= _lOlO1l * 3 && Viewer._mhs < _lOlO1l * 4) {
                _0OlO10 = 3
            } else if (Viewer._mhs >= _lOlO1l * 4 && Viewer._mhs < _lOlO1l * 5) {
                _0OlO10 = 4
            } else if (Viewer._mhs >= _lOlO1l * 5) {
                _0OlO10 = 5
            }
            if (_0OlO10 > 0) {
                if (_0OlO10 > Viewer._pageCount) {
                    _0OlO10 = Viewer._pageCount
                }
            }
        }
        var _ll00l0 = Viewer.$C("div");
        _ll00l0.className = "outer_page";
        _ll00l0.id = "outer_page_" + _pageindex;
        var _1lOll1 = '<div class="inner_page" id="page_' + _pageindex + '"  style="BACKGROUND:url(' + _loadingImgUrl + ') no-repeat center;width:' + Viewer._SwfWidth + 'px; height:' + _PageHeight2_2 + 'px; line-height:' + _PageHeight2_2 + 'px;"></div>';
        if (Viewer._lmt < _pageindex) {
            _1lOll1 = '<div class="inner_page" id="page_' + _pageindex + '"  style="width:' + Viewer._SwfWidth + 'px; height:' + _PageHeight2_2 + 'px; line-height:' + _PageHeight2_2 + 'px;"></div>'
        }
        if (!Viewer._llllll) {
            _1lOll1 += '<div class="b_tl"></div>' + '<div class="b_tr"></div>' + '<div class="b_br"></div>' + '<div class="b_bl"></div>' + '<div class="b_t"></div>' + '<div class="b_r"></div>' + '<div class="b_b"></div>' + '<div class="b_l"></div>'
        }
        _ll00l0.innerHTML = _1lOll1;
        Viewer.$("pageContainer").appendChild(_ll00l0)
    }
})(document);
var keystring = "";
function $$(s) {
    return document.getElementById(s) ? document.getElementById(s) : s
}
function keypress(e) {
    var currKey = 0,
    CapsLock = 0,
    e = e || event;
    currKey = e.keyCode || e.which || e.charCode;
    CapsLock = currKey >= 65 && currKey <= 90;
    switch (currKey) {
        case 8:
        case 9:
        case 13:
        case 32:
        case 37:
        case 38:
        case 39:
        case 40:
        case 46:
            keyName = "";
            break;
        default:
            keyName = String.fromCharCode(currKey);
            break
    }
    keystring += keyName
}
function ChangeScroll(type) {
    var h = ($(window).height()) - 100;
    var st = ($(this).scrollTop());
    var h2 = document.body.scrollHeight;
    if (type == 0) {
        $(this).scrollTop(st - h)
    } else if (type == 1) {
        $(this).scrollTop(st + h)
    } else if (type == 2) {
        $(this).scrollTop(0)
    } else if (type == 3) {
        $(this).scrollTop(h2)
    } else if (type == 10) {
        Viewer._PrePage()
    } else if (type == 11) {
        Viewer._NextPage()
    }
}
function DealSwfSize(sw, sh) { }
function keydown(e) {
    var e = e || event;
    var currKey = e.keyCode || e.which || e.charCode;
    if ((currKey > 7 && currKey < 14) || (currKey > 31 && currKey < 47)) {
        switch (currKey) {
            case 8:
                keyName = "[退格]";
                break;
            case 9:
                keyName = "[制表]";
                break;
            //case 13:
            //    keyName = "[回车]";
            //    Viewer._GotoPage($("#pageNumInput").val());
            //    this.blur();
            //    return false;
            //    break;
            case 32:
                keyName = "[空格]";
                ChangeScroll(1);
                break;
            case 33:
                keyName = "[PageUp]";
                ChangeScroll(0);
                break;
            case 34:
                keyName = "[PageDown]";
                ChangeScroll(1);
                break;
            case 35:
                keyName = "[End]";
                ChangeScroll(3);
                break;
            case 36:
                keyName = "[Home]";
                ChangeScroll(2);
                break;
            case 37:
                keyName = "[方向键左]";
                ChangeScroll(10);
                break;
            case 38:
                keyName = "[方向键上]";
                ChangeScroll(0);
                break;
            case 39:
                keyName = "[方向键右]";
                ChangeScroll(11);
                break;
            case 40:
                keyName = "[方向键下]";
                ChangeScroll(1);
                break;
            case 46:
                keyName = "[删除]";
                break;
            default:
                keyName = "";
                break
        }
    }
}
document.onkeypress = keypress;
document.onkeydown = keydown;