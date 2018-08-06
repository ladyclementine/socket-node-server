let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
const axios = require('axios');
var cors = require('cors')
var redis = require("redis"),
    client = redis.createClient();
    client.on('connect', function () {
        console.log('connected');
    });

    app.use(cors())
    // create an api/search route
    app.get('/api/chats', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8100');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        var chatList = []
        // Extract the query from url and trim trailing spaces
        const query = (req.query.query).trim();
        console.log(query)
        client.lrange(`chat_list_of_${query}`,  0, -1 , function (err, chats) {
            if(chats.length){
                for(var i = 0; i < chats.length; i++) {
                    var chatObj = JSON.parse(chats[i])
                    chatList.splice(-1, 0, chatObj);
                }
                console.log(chatList)
            }
            if(chatList){
                return res.status(200).json({chatList});
            } else {
                const resultJSON = `${query} não tem conversas.`
                return res.status(200).json({resultJSON});
            }
        });
    });

    io.sockets.on('connection', function(socket) {
       // join then specific room
        socket.on('room', function(room){
            var room_id =  room.room_id
            socket.join(room_id)
            var chat = {user_room:room.user_room, user_host_room:room.user_host_room, room_id:room_id}
            var chatStr = JSON.stringify(chat);
            client.LPUSH(`chat_list_of_${room.user_host_room}`, `${chatStr}`)
            client.LPUSH(`chat_list_of_${room.user_room}`, `${chatStr}`)
            io.emit('callUser', {user_room:room.user_room, user_host_room:room.user_host_room, room_id:room_id})
        });
        socket.on('enterRoom', (room) => {
            socket.join(room)
        })
        socket.on('get-message-history', (data) => {
            client.lrange(`msgs_of_room_id_${data}`,  0, -1 , function (err, str) {
                var list = []
                for(var i = 0; i < str.length; i++) {
                    console.log('msgs?', str[i]);
                    var obj = JSON.parse(str[i])
                    list.splice(-1, 0, obj);
                    socket.emit('message-history', list)
                }
            });
        })
        socket.on('add-message', (message) => {
            var messageObj = {text: message.text, from: message.current_user, created: new Date()}
            var str = JSON.stringify(messageObj);
            client.LPUSH(`msgs_of_room_id_${message.room_info.room_id}`, `${str}`)
            io.to(message.room_info.room_id).emit('message',  {text: message.text, from: message.current_user, created: new Date()});
        });
        socket.on('disconnect', function(){
            io.emit('users-changed', {user: socket.nickname, event: 'left'});   
        });
    });
var port = process.env.PORT || 3001;
 
http.listen(port, function(){
   console.log('listening in http://localhost:' + port);
});

