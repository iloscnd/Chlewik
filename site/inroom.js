
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę, bo on dokleja z przodu url co mu zostało

var inrooms = new Map();

var routerFun = function(roomz,io){

    io.on('connection', function(socket) {
        console.log('connected in room');
        socket.on('getIn', function(rn) { //rn to na razie nazwa pokoju
            console.log("Jestem "+rn);
            //console.log(ses);
            //var name = ses.roomname;
            //var session = ses.session;
            var room = roomz.get(rn); 
            if (room == undefined) { console.log("OJEJ");  return;}
            var roomname = room.name;
            socket.join(roomname);
            room.people++;
            inrooms.set(socket,roomname);
            console.log(room.people==undefined);
            console.log(room.people);
            console.log(room.name==undefined);
            console.log(room.name);
            //console.log(name);
            //console.log(room);
            io.to(roomname).emit('sbd entered',room.people); //do wszystkich, się też czyli człeka wliczy i pokaże
        });
        socket.on('sbd entered', function(room) {
            socket.emit('sbd entered', room);
        });
        socket.on('disconnect', function() {
            var roomname = inrooms.get(socket); //było ses
            if (roomname == undefined) { console.log("OJEJKU"); return; }
            var room = roomz.get(roomname);
            room.people--;
            if(room.people == 0) {
                roomz.delete(roomname);
            }
            io.to(roomname).emit('sbd entered',room.people);
        }); 
    });
    
 /*dzieją się dziwne błędy z sesjami jak próbuję w chrome albo ogólnie w 2. przeglądarce*/
    


    router.all('/', (req,res) =>{
        var name = req.query.name;
        if(!req.session.entered)
        {
            res.redirect("/");
            return;
        }
        var r = roomz.get(name)
        if (r == undefined) { res.redirect('/rooms'); console.log("ojej"); return; }
        if (r.hasPwd) {
            var pwd = req.session.roomPwd;
            if (r.pwd != pwd) { res.redirect('/rooms'); return; }   //to wszystko powinien być ajax z roomView, no ale jak pytać o wpisane w pole które może nie istnieć... EDIT - nie wyświetlać pola, a istnieje
        }
        var model = {
            room : r,
            ses : req.session
        }
        console.log("!!!"+r.name);
        res.render('inroom.ejs', model);
    });


    return router;
}

module.exports = routerFun;