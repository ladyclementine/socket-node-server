let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
    // handle incoming connections from clients
    io.sockets.on('connection', function(socket) {
        // console.log(io.sockets.connected)
       // join then specific room
        socket.on('room', function(room){
            io.emit('callSpecificUser', {user_room:room.user_room, user_host_room:room.user_host_room, room_id:socket.id})
        });
        socket.on('Enterroom', (room) => {
            socket.join(room)
        })
        socket.on('add-message', (message) => {
            console.log('message para', message.room_info.user_host_room)
            io.in(message.room_info.user_host_room).emit('message',  {text: message.text, from: message.current_user, created: new Date()});
        });
        socket.on('disconnect', function(){
            io.emit('users-changed', {user: socket.nickname, event: 'left'});   
        });
    });
var port = process.env.PORT || 3001;
 
http.listen(port, function(){
   console.log('listening in http://localhost:' + port);
});

