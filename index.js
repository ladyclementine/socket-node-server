let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
    // handle incoming connections from clients
    io.sockets.on('connection', function(socket) {
        // console.log(io.sockets.connected)
       // join then specific room
        socket.on('room', function(room){
            console.log('room joined', room.user_room)

            io.emit('callSpecificUser', {user_room:room.user_room, user_host_room:room.user_host_room, room_id:socket.id})
        });
        socket.on('Enterroom', function(room) {
            socket.join(room)
        })
        socket.on('add-message', (message) => {
            console.log('retorno msg', message.room_info.user_room)
            io.in(message.room_info.user_room).emit('message',  {text: message.text, created: new Date()});
        });
        socket.on('disconnect', function(){
            io.emit('users-changed', {user: socket.nickname, event: 'left'});   
        });
    });
var port = process.env.PORT || 3001;
 
http.listen(port, function(){
   console.log('listening in http://localhost:' + port);
});

