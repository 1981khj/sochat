//require('nodetime').profile({stdout: true});
//require('nodetime').profile();
var port = process.env.PORT;
var express = require('express');
var Data = require('data');
var app = express.createServer();
var mongo = require("mongoskin");
var mongoUrl = "mongodb://admin:admin@ds031637.mongolab.com:31637/servicelog?auto_reconnect";

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //전역설정에 layout 템플릿을 재정의
  //기본레이아웃 안죽이면 못그려줘서 에러
  app.set("view options", {layout: false});
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  //스타일 정의
  //app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  //app.use(require('stylus').middleware({ src: __dirname + '/public', compress: true }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

//기본적인 에러 핸들러 설정(development)
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

//기본적인 에러 핸들러 설정(production)
app.configure('production', function(){
  app.use(express.errorHandler()); 
});

//Page Routing
/*app.get('/', function(req, res) {
    res.render('chat.jade');
});*/

app.get('/', function(req, res) {
    var db = mongo.db(mongoUrl);
    var messageCollection = db.collection("message");    
    var now =getNowDay();
    
    messageCollection.find({timestamp:{$gte:now}}).toArray(function(err, items) {
        if (err) throw err;
        
        res.render('messengerweb.jade',{items:items});
    });
});

app.get('/mobile', function(req, res) {
    res.render('mobile.jade');
});

app.get('/404', function(req, res) {
    res.render('404.jade');
});

app.get('/500', function(req, res) {
    res.render('500.jade', { error: "abc" });
});

/*app.error(function(err, req, res, next){
    res.render('500.jade', { error: err });
});*/

/**socket io 처리 영역*/
var io = require('socket.io').listen(app);
//var Chat = require('./chat');
//var DbHandler = require('./db');

var htUserList = new Data.Hash();

/* hash table example
 htUserList = { 
    '0': '김',
    '1': '형진',
    data: { '1417411703779493256': '김', '15115402251977004866': '형진' },
    keyOrder: [ '1417411703779493256', '15115402251977004866' ],
    length: 2 
}
*/

//기본적인 소켓 환경 설정(production)
io.configure('production', function(){
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.enable('browser client etag');
    io.set('log level', 1);    
    io.set('transports', [
        'websocket'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);
});

//기본적인 소켓 환경 설정(development)
io.configure('development', function(){
    io.set('log level', 0);
    io.set('transports', [
        'websocket'
        //, 'flashsocket'
        //, 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);
});

io.sockets.on('connection', function(socket) {    
    socket.on('join', function(nick){
        
        // 현재 전체 접속자
        var aUserNames = htUserList.values();
        
        // 현재 전체 접속자에 해당 이름을 필터링
        var aUsernamesExist = aUserNames.filter(function(element) {
            return (element === nick);
        });
        
        // 해당 이름이 있으면 중복 됨을 알리고 없으면 접속처리 진행
        if (aUsernamesExist.length > 0) {
            io.sockets.socket(socket.id).emit('nickIsAlreadyExist', nick);
            return false;
        } else {
            //socket.io를 키값으로 값은 닉네임(nick)으로 
            //socket.io : nick
            htUserList.set(socket.id, nick);
            
            // socket 이름 추가
            socket.nickname = nick;
            
            // 현재 전체 접속자
            aUserNames = htUserList.values();
            
            
            // 본인에게 접속 완료 알림
            // io.sockets.socket(socket.id).emit('joinok', nick);
            socket.emit('joinok', nick);
            
            // 모든 접속자에게 전체 접속자 리스트 갱신
            io.sockets.emit('nicknames', aUserNames);
            
            // 다른 접속자에게 접속함을 알림
            socket.broadcast.emit('enterlog',htUserList.get(socket.id));
        }
	});
    
    socket.on('setNickname', function(nick){
        console.log("setNickname");
        htUserList.set(socket.id, nick);            
        // socket 이름 추가
        socket.nickname = nick;
    });
    
    /* 현재 사용하시 않음
    socket.on('makeRandomRoom', function(toName){
        var sRoomName = Chat.makeRandomName(8);
        var usernames = htUserList.values();
        var userIdx = usernames.indexOf(toName);
        var toId = htUserList.key(userIdx);
        
        io.sockets.socket(socket.id).emit('makeChatRoom', sRoomName);
        io.sockets.socket(toId).emit('makeChatRoom', sRoomName);
	});
    */
    
    socket.on('makePrivateRoom', function(toName){
        var aUserNames = htUserList.values();
        var nUserIdx = aUserNames.indexOf(toName);
        
        //상대방 Socket ID Number
        var nToId = htUserList.key(nUserIdx);
        
        //본인의 이름
        var sFromName = htUserList.get(socket.id);
                
        //본인의 채팅방 생성
        //io.sockets.socket(socket.id).emit('makeChatRoom', {id:toId , name:toName});
        socket.emit('makeChatRoom', {id:nToId , name:toName});
        
        //상대방 채팅방 생성
        io.sockets.socket(nToId).emit('makeChatRoom', {id:socket.id , name:sFromName});
        
        //채팅방 생성
        //var sRoomName = Chat.makeRandomName(8);
        //io.sockets.socket(socket.id).emit('makeChatRoom', sRoomName);
        //io.sockets.socket(toId).emit('makeChatRoom', sRoomName);
    });
    
    
    //Add Chat Message
    socket.on('sendmsg', function(data){        
        if(data.to=="#all"){
            //퍼블릭 메시지는 오직 전체방에만 뛰워지기 때문에 방은 보내지 않도록 처리
            //io.sockets.emit('publicmessage', {msg: data.msg, from: socket.nickname, toroom: data.to});
            //DbHandler.saveMessage({from: socket.nickname, msg: data.msg});            
            var sDateTime = convertDate();
            var db = mongo.db(mongoUrl);
	        var messageCollection = db.collection("message");            
            
            io.sockets.emit('publicmessage', {from: socket.nickname, msg: data.msg});
            messageCollection.insert({from: socket.nickname, msg: data.msg, timestamp:sDateTime});
            
            console.log(htUserList.values());
        }else{
            var sendToId = data.to.substring(1);
            
            // 대화창이 본인이냐 상대이냐에 따라 달라야 한다.
            // 향후 룸기능을 도입하면 이렇게 두번 메시지 전달할 이유는 없을 듯 하다.
            // 메시지의 경우는 그러하나 역시 초반에 방을 만들고 해당 방을 상대방에게 알릴 경우 private 메시지는 필요하다.
            
            // 상대방에게 메시지 전달
            io.sockets.socket(sendToId).emit('privatemessage', {roomid: socket.id, from: socket.nickname, msg: data.msg});
            //io.sockets.socket(sendToId).emit('privatemessage', {from: socket.nickname, toroom: data.to, msg: data.msg, id: socket.id});
            
            // 본인에게 메시지 전달
            socket.emit('privatemessage', {roomid: sendToId, from: socket.nickname, msg: data.msg});
        }
        //all
        //socket.emit('sendmsg', {msg:msgArea.val(), to: window.location.hash});
        //io.sockets.emit('messagelog', {nickname : socket.nickname, message : msg, datetime : new Date().toLocaleString()});        
	});

	socket.on('disconnect', function(){
        //다른 사용자에게 본인이 나감을 알림
        //io.sockets.emit('exitlog', htUserList.get(socket.id));
        socket.broadcast.emit('exitlog',htUserList.get(socket.id));
        
        //본인의 값을 삭제
        htUserList.del(socket.id);
        
        //전체 접속자
        var aUserNames = htUserList.values();
        
        //모든 접속자에게 전체 접속자 리스트 갱신
        io.sockets.emit('nicknames', aUserNames);
	});
});

function convertDate(){
    var date = new Date();
    var aDay = [];
    var aTime = [];
    aDay.push(date.getUTCFullYear());
    aDay.push(date.getUTCMonth()+1);
    aDay.push(date.getUTCDate());
    aTime.push(date.getUTCHours());
    aTime.push(date.getUTCMinutes());
               
    return aDay.join('-')+" "+aTime.join(':');
}

function getNowDay(){
    var date = new Date();
    var aDay = [];
    var aTime = [];
    aDay.push(date.getUTCFullYear());
    aDay.push(date.getUTCMonth()+1);
    aDay.push(date.getUTCDate());    
               
    return aDay.join('-');
}

if (!module.parent) {
  app.listen(port);
  console.log('Server is Running! listening on port '+port);
}