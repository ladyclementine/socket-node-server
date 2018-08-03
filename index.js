let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
var redis = require("redis"),
    client = redis.createClient();
    client.on('connect', function () {
        console.log('connected');
    });
    // handle incoming connections from clients
    io.sockets.on('connection', function(socket) {
        console.log(socket.connected)
       // join then specific room
        socket.on('room', function(room){
            var room_id =  room.room_id
            socket.join(room_id)
            console.log('id do canal', room.user_room + room.user_host_room, room_id)
            io.emit('callSpecificUser', {user_room:room.user_room, user_host_room:room.user_host_room, room_id:room_id})
        });
        socket.on('Enterroom', (room) => {
            console.log('Join no canal de id', room)
            socket.join(room)
        })
        socket.on('get-message-history', (data) =>{
            client.hgetall(`msgs_of_room_id_${data}`, function (err, object) {
                console.log(object);
                io.to(data).emit('message-history', object)
            });
        })
        socket.on('add-message', (message) => {
            console.log('messagem de', message.current_user, 'no canal id', message.room_info.room_id)
            console.log('mandando', message.text, 'para room', message.room_info.room_id )
            io.sockets.emit('messageToOutside',  {text: message.text, from: message.current_user, created: new Date()});
            client.hmset(`msgs_of_room_id_${message.room_info.room_id}`, "text", `${message.text}`, "from", `${message.current_user}`)
            client.hgetall(`msgs_of_room_id_${message.room_info.room_id}`, function (err, object) {
                console.log(object);
            });
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

