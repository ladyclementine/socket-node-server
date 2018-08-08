let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
// const axios = require('axios');
var cors = require('cors')
var redis = require("redis"),
    client = redis.createClient();
    client.on('connect', function () {
        console.log('connected');
    });

    app.use(cors())
    var notificationList = []
    // pega a lista de chats de um usuário
    app.get('/api/chats', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8100');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        var chatList = []
        const query = (req.query.query).trim();
        console.log('chats of', query)
        client.lrange(`chat_list_of_${query}`,  0, -1 , function (err, chats) {
            if(chats.length){
                for(var i = 0; i < chats.length; i++) {
                    var chatObj = JSON.parse(chats[i])
                    chatList.splice(-1, 0, chatObj);
                }
            }
            if(chatList){
                return res.status(200).json({chatList});
            } else {
                const resultJSON = `${query} não tem conversas.`
                return res.status(200).json({resultJSON});
            }
        });
    });
    //pega o histórico de mensagens de determinado room_id
    app.get('/api/chat-history', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8100');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        const query = (req.query.query).trim();
        console.log('historico do room id', query)
        var list = []
        client.lrange(`msgs_of_room_id_${query}`,  0, -1 , function (err, str) {
            for(var i = 0; i < str.length; i++) {
                // console.log('msgs?', str[i]);
                var obj = JSON.parse(str[i])
                list.splice(-1, 0, obj);
                // socket.emit('message-history', list)
            }
            return res.status(200).json({list});
        });
    });
    // lista de alertas de mensagens
    app.get('/api/message-alert', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8100');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        const query = (req.query.query).trim();
        if(notificationList.includes(query)){
            var index = notificationList.indexOf(query);
            if (index > -1) {
                notificationList.splice(index, 1);
            }
            return res.status(200).json({has_message:true});

        } else {
            return res.status(200).json({has_message:false});
        }
    });
    // fluxo do socket io
    io.sockets.on('connection', function(socket) {
        socket.on('room', function(room){
            var room_id =  room.room_id
            socket.join(room_id)
            var chat = {user_room:room.user_room, user_host_room:room.user_host_room, room_id:room_id}
            var chatStr = JSON.stringify(chat);
            // adiciona uma lista de chat para cada usuário envolvido
            client.LPUSH(`chat_list_of_${room.user_host_room}`, `${chatStr}`)
            client.LPUSH(`chat_list_of_${room.user_room}`, `${chatStr}`)
            io.emit('callUser', {user_room:room.user_room, user_host_room:room.user_host_room, room_id:room_id})
        });
        socket.on('enterRoom', (room) => {
            socket.join(room)
        })
        // socket.on('get-message-history', (data) => {
        //     client.lrange(`msgs_of_room_id_${data}`,  0, -1 , function (err, str) {
        //         var list = []
        //         for(var i = 0; i < str.length; i++) {
        //             // console.log('msgs?', str[i]);
        //             var obj = JSON.parse(str[i])
        //             list.splice(-1, 0, obj);
        //             socket.emit('message-history', list)
        //         }
        //     });
        // })
        socket.on('add-message', (message) => {
            var connectedUsersLen = io.sockets.adapter.rooms[`${message.room_info.room_id}`].length
            console.log('userLength', connectedUsersLen)
            var messageObj = {text: message.text, from: message.current_user, created: new Date()}
            var str = JSON.stringify(messageObj);
            client.LPUSH(`msgs_of_room_id_${message.room_info.room_id}`, `${str}`)
            if(connectedUsersLen == 1 ){
                if(message.current_user !== message.room_info.user_room ){
                    console.log(`avisa pro ${message.room_info.user_room} que tem mensagem nova`)
                    var notification = message.room_info.user_room 
                    notificationList.push( notification )
                } else if(message.current_user == message.room_info.user_room){
                    console.log(`avisa pro ${message.room_info.user_host_room} que tem mensagem nova`)
                    var notification =  message.room_info.user_host_room 
                    notificationList.push( notification )
                }
            }
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

