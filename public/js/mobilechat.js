(function($) {
    $(document).bind("mobileinit", function(){
        $.mobile.page.prototype.options.addBackBtn= true;
    });
    //var socket = io.connect('/');
    
    //for develop
    var socket = io.connect('http://sochat.hjkim.c9.io/');
    
    //for deploy
    //var socket = io.connect('http://p9chat.herokuapp.com/');
    var joined = false;

    // 서비스에 접속한 경우 자신의 대화명을 좌측 상단 아이콘 옆에 출력
    socket.on('joinok', function(nick) {
        joined = true;
        console.log("socket:::joinok");
		//$("ul", "#nickList").append("<li>" + nick + "</li>");
        $(".nick_name").text(nick);
        disableLoading();
        hiddenJoin();
        $("#firsttab").css('display','block');        
        $(".chat_tabs li").first().trigger("click");
        $(".btn_toggle a.on").show();
	});
    
    // 닉네임이 존재 할 경우
    socket.on('nickIsAlreadyExist', function(data) {
        console.log("socket:::nickIsAlreadyExist");
        console.log(data);
        alert("해당 대화명(" + data + ")은 이미 존재합니다. 다시 입력하세요");
        window.location.reload();
    });
    
    // 서비스에 접속하여 로그인시 대화명 체크 후 정상적으로 넘어온 경우
    socket.on('enterlog', function(logdata) {
        console.log("socket:::enterlog");
		//$("#messageLog>ul").append("<li class='fade_out_end'><strong>" + logdata + "</strong></li>");
        if(joined)
            notificationMsg(logdata+" 입장하였습니다.");
		//scrollToTop();
	});
    
    // 서비스를 종료할 경우 혹은 접속이 끊길 경우
    socket.on('exitlog', function(logdata) {
        console.log("socket:::exitlog");
        console.log(logdata);
        if(joined && logdata!=null)
            notificationMsg(logdata+" 퇴장하였습니다.");
	});
    
    /*socket.on('exit', function(logdata) {
        window.location.reload();
    });*/


    // 왼쪽에 사용자 리스트를 그려주는 기능
	socket.on('nicknames', function(data) {
        console.log("socket:::nicknames");
        console.log(data);
		var nicklist = $("ul", "#nickList");
        nicklist.empty();        
        
        var myNickName = $("span.nick_name").text();
        console.log(myNickName);
		for(var i in data) {			
            if(data[i]==$.trim(myNickName))
                nicklist.append("<li class='me'><a href='#'>"+ data[i] + "</li>");
            else
                nicklist.append("<li><a href='#'>"+ data[i] + "</li>");
		}
        
        setUserCount(data.length);
        
        contextMenu();
	});
    
    // 전체 방을 활성화 시키지는 않지만 대화는 해당 창에 출력이 되도록 한다.
    socket.on('publicmessage', function(logdata) {
        console.log("socket:::publicmessage");
        console.log(logdata);        
        var publicRoomMsgArea = $("#all",$("#contents")).find(">ul");
        publicRoomMsgArea.append("<li class='fade_out_end'><strong>" + logdata.from + ":</strong><span>"+logdata.msg+"</span><em>"+getCurrentDate()+"</em></li>");        
    	scrollToTop();
	});
    
    // 개인적인 메시지를 보낼 경우 대화명 대화방을 쓰도록 한다.
    // 현재 받은 방을 찾고 방이 없으면 만들고 방이 있으면 해당 방을 활성화 시킨후 메시지를 출력
    socket.on('privatemessage', function(logdata) {
        console.log("socket:::privatemessage");
        console.log(logdata);
        var roomId = "#"+logdata.roomid;
        var sCurrentRoomId = getCurrentRoomId();        
        
        if(!checkRoomExist(roomId)){            
            //해당 방이 존재하지 않으면 다시 생성하도록 
            makeTab(roomId.substring(1), logdata.from);
            makeTabContainer(roomId.substring(1));
            $(".chat_tabs li").last().trigger("click");
        }else{
            //해당 방이 존재하면 있는 방이 활성화 되도록 체크
            //현재 방이 활성화 방과 일치하는지 확인하고 아닐 경우 해당 방 인텍스로 클릭            
            if(sCurrentRoomId != roomId){
                notificationMsg(logdata.from+" 님과의 대화방으로 전환");
                var nRoomIndex = getRoomIndex(roomId);                
                $(".chat_tabs li").eq(nRoomIndex).trigger("click");
            }
            
        }        
        
        var privateRoomMsgArea = $("#contents").find(roomId).find(">ul");
        privateRoomMsgArea.append("<li class='fade_out_end'><strong>" + logdata.from + ":</strong><span>"+logdata.msg+"</span><em>"+getCurrentDate()+"</em></li>");    
        
        //$("#messageLog>ul").append("<li class='fade_out_end'><strong>" + logdata.nickname + ":</strong><span>"+logdata.message+"</span><em>"+getCurrentDate()+"</em></li>");
    	scrollToTop();
	});
    
    
    // 방을 만들도록 설정
    socket.on('makeChatRoom', function(data) {
        console.log("socket:::makeChatRoom");
        if(!($("#contents").find("#"+data.id).length>0)){            
            makeTab(data.id, data.name);
            makeTabContainer(data.id);
            $(".chat_tabs li").last().trigger("click");            
            notificationMsg(data.name+" 님과의 일대일 대화방을 생성");
        }
        
        //for mobile    
        if($("div.btn_toggle").is(':visible')){
            $("#chat_wrap").addClass("toggle_on");
        }
    });
    
    /*socket.on('messagelog', function(logdata) {
        console.log("socket:::messagelog");
        var date = new Date();
        var sDate = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes();    	
        $("#messageLog>ul").append("<li class='fade_out_end'><strong>" + logdata.nickname + ":</strong><span>"+logdata.message+"</span><em>"+sDate+"</em></li>");
		scrollToTop();
	});*/

    // 무엇때문에 작성하였는지 모름
    socket.on('nickis', function(data) {
        console.log("socket:::nickis");
        
	});
    
    
    $("#enter").click(function(){        
        alert("ab");
    });
        
    // 기본 서브밋 속성을 죽이기 
    $("#joinform").submit(function(){        
        return false;
    });
    
    // 입장하기 버튼을 클릭할 때
    $("#enter").on('click', function(){                
        controlJoin();
    });
    
    // 닉네임 텍스트 창에서 엔터키를 누를 때
    $("#nick_ipt").on('keypress', function(e){
        var keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode == '13'){            
		    controlJoin();
	    }	    
    });
    
    // 메시지를 클릭할 경우
    // 현재 활성화 된 대화창의 탭을 통해 전체인지 개인인지 판단해서 보내도록 하자
    // socket sendmsg
    $("#send").on({
    	click : function() {
			var msgArea = $("#msgArea");
			if(msgArea.val() == "") {
				alert('Message 을 입력해주세요.');
				msgArea.focus();
				return false;
			} else {                
				socket.emit('sendmsg', {msg:msgArea.val(), to: window.location.hash});
                //console.log(window.location.hash);
				msgArea.val("");                
			}

			return false;
		}
	});
    
    // 탭 컨트롤 하기 위해 이후 해쉬를 갖고 방을 이용하여 대화창을 만들려고 생각했다.
    // 현재는 그냥 탭을 활성화 시키고 해쉬값을 변경하는 정도
    // 탭내 버튼 태그나 탭클로즈 클래스를 누르면 탭창이 닫힌다.
    $("#header ul.chat_tabs").on({
        click : function(e){            
            console.log(e);
            if(e.target.tagName=="A" ||e.target.tagName == "LI"){                
                $(this).find("li.on").removeClass("on");
                var target = (e.target.tagName=="A")? $(e.target).parent() : $(e.target) ;                
                var targetHref = (e.target.tagName=="A")? $(e.target).attr("href") : $(e.target).find("a").attr("href") ;                
                
                target.addClass("on");
                enableTab(targetHref);
                //enableTab(targetHref.substring(1));
                //enableTab(targetHref.slice(1,targetHref.length));
                
                window.location.hash = targetHref;
                scrollToTop();
                //get tab index 
                //show current message box
            }
            
            
            if(e.target.tagName=="BUTTON" && e.target.className=="tab_close"){                
                var containerId = $(e.target).parent().find("a").attr("href");
                
                // 메시지 로그영역 지우기
                $("#contents").find(containerId).remove();
                
                // 상단 탭 지우기
                $(e.target).parent().remove();
                
                // 삭제 알림
                var containerName = $(e.target).parent().find("a").text()
                notificationMsg(containerName+" 님과의 일대일 대화방을 삭제");
                
                // 상단 탭 중에 가장 마지막꺼 클릭
                $(".chat_tabs li").last().trigger("click");
            }
            
            return false;
        }
    });
    
    /*$("#nickList ul li").live("click",function(){        
        if($(this).hasClass('me')){
            return false;
        }
        
        socket.emit('makePrivateRoom',$.trim($(this).text()));
        //자신의 방이 활성화 되는 것으로 사용 가능..
        return false;        
    });*/
    
    $("div.btn_toggle").on("click",function(e){
        console.log(e);
        console.log($(e.target).prop("class"));
        if($(e.target).prop("class")=="on"){
            $("#chat_wrap").addClass("toggle_on");
        }else{
            $("#chat_wrap").removeClass("toggle_on");
        }
        return false;
    });
        
    //우측 마우스시 컨텍스트메뉴 안나오도록 설정    
    /*$(document).bind("contextmenu",function(e){
        return false;
    });*/
    
    //좌우 마우스 이벤트 추가
    //$('.messageLog').swipe();
    //$('#chat_wrap').swipe();
    
    /*$("#nickList ul li").live("dblclick",function(){        
        if($(this).hasClass('me')){
            return false;
        }
        console.log("dblclick");
        socket.emit('makePrivateRoom',$.trim($(this).text()));
    });*/
    

    
    // 사용자의 대화명 입력 및 그에 따른 대화방 보이기를 컨트롤 한다. 
    // socket join
    function controlJoin(){
        var nick = $("#nick_ipt");
        
        if(checkNickName(nick.val())){
            socket.emit('join', nick.val());
            nick.val("");
            enableLoading();
        }else{
            nick.focus();
            alert('NickName 을 입력해 주세요.');
        }
        
        return false;
    }

    // 대화명 텍스트 입력 칸이 빈 공간인지 확인
    function checkNickName(sNickName){
        var isExistNickName = false;
        
        if(sNickName!="")
            isExistNickName = true;
            
        return isExistNickName;
    }
    
    // 대화명 입력 영역을 숨기기
    function hiddenJoin(){
        $("#join").css("display","none");
    }
	 
    // 글 입력시 대화창이 항상 아래로 보이도록 스크롤 이동
	function scrollToTop(){
		$('html, body').animate({
            scrollTop: $(document).height()
        }, 2000);
	}
    
    // 현재 일정을 반환, 서버에서 데이터를 받으려 했으나 
    // 그냥 클라이언트에서 일자가 찍히도록 함. 향후 서버로 대체 할 예정
    function getCurrentDate(){
        var date = new Date();        
        return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes();
    }
    
    // 사용자 리스트에서 마우스 오른쪽 메뉴를 누를 시 나오는 메뉴 리스트
    // 현재 채팅 방을 만드는 용으로 사용중
    // Socket makeRandomRoom
    function contextMenu(){
        $("#nickList ul li").contextMenu({
            menu: 'chatMenu'
        }, function(action, el, pos) {
        	
            if($(el).hasClass('me')){
                alert("자신과의 일대일 대화는 지원하지 않습니다.");
                return false;
            }
            
            socket.emit('makePrivateRoom',$.trim($(el).text()));
            //socket.emit('makeRandomRoom',$.trim($(el).text()));
            
            
            /*var sRoomName = randomString(8);
            makeTab(sRoomName);
            makeTabContainer(sRoomName);*/
            
            //$(".chat_tabs li").last().trigger("click");
            //make messagebox with randomstring
    	});
    }
    
    // 사용자의 입장, 퇴장을 알리는 알림 메시지
    function notificationMsg(msg){
        jQuery.noticeAdd({
            text: msg,
            stay: false
        });
    }
    
    // 메뉴 탭을 추가한다.
    function makeTab(id, name){
        $("#header ul.chat_tabs").append("<li><a href='#"+id+"'>"+name+"</a><button class='tab_close'>X</button></li>");
    }
    
    // 메뉴 탭의 추가에 따른 해당 메시지 영역을 추가
    function makeTabContainer(id){
        var roomDiv = "<div class='messageLog' id="+id+"><h2 class='blind'></h2><ul></ul></div>";
        
        $('#messageSend').before(roomDiv);
        //$("#messageLog").append(roomDiv);
        //$('.inner').before('<p>Test</p>');
        // 아랫부분 확인을 위해 임시 추가
        //console.log($("#contents").find("#messageLog"+id));
        //$("#contents").find("#messageLog"+id).text(id);
    }
    
    // 주어진 방명에 따라 탭을 활성화
    function enableTab(room){
        //var tabContainers = $('#messageLog > div');
        //tabContainers.hide().filter('#'+room).show();
        //$("#messageSend").fadeIn();
        //$("#messageSend").css("display","none").show("slideUp");
        var tabContainers = $(".messageLog");
        tabContainers.hide().filter(room).show();
        //tabContainers.hide().filter('#'+room).show();        
    }
    
    // 로딩 상태 활성화
    function enableLoading(){
        $.blockUI({ css: { 
            border: 'none', 
            padding: '15px', 
            backgroundColor: '#000', 
            '-webkit-border-radius': '10px', 
            '-moz-border-radius': '10px', 
            opacity: .5, 
            color: '#fff' 
        } }); 
    }
    
    // 로딩 상태 비활성화
    function disableLoading(){
        $.unblockUI();
    }
    
    function checkRoomExist(roomId){
        var welRoom = $('.chat_tabs a');
        var aRoom = $.makeArray(welRoom);
        console.log("roomId==============================");
        console.log(roomId);
        console.log(aRoom);
        
        var roomExist = false;
        
        $.each(aRoom, function(index, value) { 
            if($(value).attr("href")==roomId){
                roomExist = true;
                return false;
            }           
        });
        
        return roomExist;
    }
    
    function getCurrentRoomId(){
        return $("#header ul.chat_tabs").find("li.on a").attr("href");        
    }
    
    function getRoomIndex(roomId){
        var welRoom = $('.chat_tabs a');
        var aRoom = $.makeArray(welRoom);        
        
        var roomIdx = -1;
        
        $.each(aRoom, function(index, value) { 
            if($(value).attr("href")==roomId){
                roomIdx = index;
                return false;
            }           
        });
        
        return roomIdx;
    }
    
    function setUserCount(nNumber){
        /*Tinycon.setOptions({
            width: 7, // the width of the alert bubble
            height: 9, // the height of the alert bubble
            font: '10px arial', // a css string to use for the fontface (recommended to leave this)
            colour: '#ffffff', // the foreground font colour
            background: '#549A2F', // the alert bubble background colour
            fallback: true // should we fallback to a number in brackets for browsers that don't support canvas/dynamic favicons
        });*/
        Tinycon.setBubble(nNumber);
    }

    // 클라이언트 쪽에서 랜덤 값으로 방을 만들려고 넣어 두었으나, 이후 서버로 옮김
    function randomString(length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
        
        if (! length) {
            length = Math.floor(Math.random() * chars.length);
        }
        
        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }
})(jQuery);