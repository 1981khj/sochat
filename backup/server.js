//require('nodetime').profile({stdout: true});
require('nodetime').profile();
var port = process.env.PORT;
var express = require('express');
var Data = require('data');
var app = express.createServer();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //전역설정에 layout 템플릿을 재정의
  app.set("view options", {layout: false});     //기본레이아웃 안죽이면 못그려줘서 에러
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  //app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  //app.use(require('stylus').middleware({ src: __dirname + '/public', compress: true }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

//기본적인 에러 핸들러 설정
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

//
app.get('/', function(req, res) {
    res.render('chat.jade');
});

app.get('/404', function(req, res) {
    res.render('404.jade');
});

app.get('/500', function(req, res) {
    res.render('500.jade', { error: "abc" });
});

app.error(function(err, req, res, next){
    //console.log(err);
    res.render('500.jade', { error: err });
});

/**socket io 처리 영역*/
var io = require('socket.io').listen(app);
//var Chat = require('./chat');

var userlist = new Data.Hash();

io.configure('production', function(){
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.enable('browser client etag');
    io.set('log level', 1);
    io.set('close timeout', 1500);
    io.set('transports', [
        'websocket'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);
});

io.configure('development', function(){
    io.set('log level', 3);
    io.set('transports', [
        'websocket'
        //, 'flashsocket'
        //, 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);
});

io.sockets.on('connection', function(socket) {
    //console.log(userlist);
    socket.on('join', function(nick){
        console.log("join==================");
        var usernames = userlist.values();
        var usernamesExist = usernames.filter(function(element) {
            return (element === nick);
        });
        //console.log(usernamesExist);
        if (usernamesExist.length > 0) {
            io.sockets.socket(socket.id).emit('nickIsAlreadyExist', nick);
            return false;            
        } else {
            userlist.set(socket.id, nick);
            socket.nickname = nick;
            var nicklist = userlist.values();
            //console.log(userlist);
            //console.log(nicklist);
            io.sockets.socket(socket.id).emit('joinok', nick);
            io.sockets.emit('nicknames', nicklist);
            //io.sockets.emit('enterlog', userlist.get(socket.id));
            socket.broadcast.emit('enterlog',userlist.get(socket.id));
        }
    });
    
    socket.on('makeRandomRoom', function(toName){
        //console.log("makeRandomRoom");
        var sRoomName = Chat.makeRandomName(8);
        var usernames = userlist.values();
        var userIdx = usernames.indexOf(toName);
        var toId = userlist.key(userIdx);
        
        io.sockets.socket(socket.id).emit('makeChatRoom', sRoomName);
        io.sockets.socket(toId).emit('makeChatRoom', sRoomName);
	});
    
    socket.on('makePrivateRoom', function(toName){
        //console.log("makePrivateRoom");
        //console.log(toName);        
        //console.log(userlist.get(socket.id));
        
        var usernames = userlist.values();
        var userIdx = usernames.indexOf(toName);
        var toId = userlist.key(userIdx);
        var fromname = userlist.get(socket.id);
        io.sockets.socket(socket.id).emit('makeChatRoom', {id:toId , name:toName});
        io.sockets.socket(toId).emit('makeChatRoom', {id:socket.id , name:fromname});
        
        
        //var sRoomName = Chat.makeRandomName(8);
        //io.sockets.socket(socket.id).emit('makeChatRoom', sRoomName);
        //io.sockets.socket(toId).emit('makeChatRoom', sRoomName);
    });
    
    
    //Add Chat Message
    socket.on('sendmsg', function(data){        
        if(data.to=="#all"){
            //퍼블릭 메시지는 오직 전체방에만 뛰워지기 때문에 방은 보내지 않도록 처리
            //io.sockets.emit('publicmessage', {msg: data.msg, from: socket.nickname, toroom: data.to});
            io.sockets.emit('publicmessage', {from: socket.nickname, msg: data.msg});
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
        io.sockets.emit('exitlog', userlist.get(socket.id));
        
        userlist.del(socket.id);
        var nicklist = userlist.values();
        
        io.sockets.emit('nicknames', nicklist);
        //socket.emit('exit');
	});
});

if (!module.parent) {
  app.listen(port);
  console.log('Server is Running! listening on port '+port);
}