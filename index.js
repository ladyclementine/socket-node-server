let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

    function AlfaNumerica(){ 
        var letras = '0123456789abcdefghijklmnopqrstuvwxyz'; 
        var aleatorio = ''; 
        var tamanho=10; 
        for (var i = 0; i < tamanho; i++) { 
        var rnum = Math.floor(Math.random() * letras.length); 
        aleatorio += letras.substring(rnum, rnum + 1); 
        } 
        return aleatorio
    }
    // handle incoming connections from clients
    io.sockets.on('connection', function(socket) {
        // console.log(io.sockets.connected)
       // join then specific room
        socket.on('room', function(room){
            var room_id =  socket.id
            console.log(AlfaNumerica())
            socket.join(AlfaNumerica())
            io.emit('callSpecificUser', {user_room:room.user_room, user_host_room:room.user_host_room, room_id:room_id})
        });
        socket.on('Enterroom', (room) => {
            console.log('enter room', room)
            socket.join(room)
        })
        socket.on('add-message', (message) => {
            console.log('add-message', message.room_info.room_id)
            io.in(message.room_info.room_id).emit('message',  {text: message.text, from: message.current_user, created: new Date()});
        });
        socket.on('disconnect', function(){
            io.emit('users-changed', {user: socket.nickname, event: 'left'});   
        });
    });
var port = process.env.PORT || 3001;
 
http.listen(port, function(){
   console.log('listening in http://localhost:' + port);
});

