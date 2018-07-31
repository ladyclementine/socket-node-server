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
       // join then specific room
        socket.on('room', function(room){
            var room_id =  room.room_id
            socket.join(room_id)
            console.log('id do canal', room.user_room + room.user_host_room, room_id)
            io.emit('callSpecificUser', {user_room:room.user_room, user_host_room:room.user_host_room, room_id:room_id})
        });
        socket.on('Enterroom', (room) => {
            io.in(room).clients((err , clients) => {
                console.log(clients)
                // clients will be array of socket ids , currently available in given room
            });
            console.log('Join no canal de id', room)
            socket.join(room)
        })
        socket.on('add-message', (message) => {
            console.log('messagem de', message.current_user, 'no canal id', message.room_info.room_id)
            console.log('mandando', message.text, 'para room', message.room_info.room_id )
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

