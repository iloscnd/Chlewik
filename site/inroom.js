
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę, bo on dokleja z przodu url co mu zostało


var routerFun = function(roomz,userz, guestz,io,id){

    //trzeba roomz, więc w routerFun
    //sprawdzenie poziomu uprawnień - 
    //starczy sprawdzić najgłębszy, bo przekierujemy na '/' a ono przekieruje najglębiej gdzie wolno i być powinien
    //i tak by starczyło, bo je przechodzi po kolei
    //!!! można by też sprawdzać po kolei od najpłytszego i przekierowywać na poprzedni, wtedy mniej zapytań
        /// no więc tu jest pewien problem, bo trzeba sprawdzać w funkcjach niżej i tak, czy się nazwa pokoju też zgadza - ew. nazwę czytać z sesji i tyle
    
    router.use('/', (req,res,next) => {

        if(req.session.legit.roomEntered && roomz.get(req.session.legit.roomEntered) == undefined) {  
            delete req.session.legit.roomEntered; 
            delete req.session.legit.inGame; 
            req.session.save(); 
        }
        
        if ( req.session.legit.roomEntered) {

            var room = roomz.get(req.session.legit.roomEntered);
            if (room != undefined && room.id != req.session.roomEnteredID) {
                delete req.session.legit.roomEntered; 
                delete req.session.legit.inGame; 
                req.session.save(); 
            } 
        }
        var ses = req.session;
        

        if (!ses.legit.roomEntered) { 
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.roomEntered = ses.legit.roomEntered;
        next();
    });




    var gameRouter = require('./game')(roomz,userz, guestz,io);
    router.use('/game',gameRouter);
    
    io.on('connection', function(socket) {

        var chat;
        var chatLast;
        socket.on('getInRoom', function() { 
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
                return; 
            }
            var rnm = socket.handshake.session.legit.roomEntered; 
            var unm = socket.handshake.session.name;
            if (rnm == undefined || unm == undefined) { 
                return;
             }
            
            var room = roomz.get(rnm); 
            if (room == undefined) { 
                return;
            }
            var roomname = room.name;
            chat = room.chat;
            chatLast = room.chatLast


            socket.join(roomname);
            room.connectedPeople++;
            
            if (!room.playersConnected) 
                room.playersConnected = 0;
            room.playersConnected++;
            delete room.lastConnected;

            if (socket.handshake.session.guest) {
                
                var guest = guestz.get(socket.handshake.session.name);
                
                if (guest == undefined ) 
                    return;
                
                if (!guest.connected) 
                    guest.connected = 1;

                delete guest.lastConnected;
            }

            io.to(roomname).emit('sbd entered',room.connectedPeople); 


            socket.on('disconnect', function() { 

                if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
                    return; 
                }
                
                var rnm = socket.handshake.session.legit.roomEntered; 
                var unm = socket.handshake.session.name;
                if (rnm == undefined || unm == undefined) { 
                    return; 
                }
                var room = roomz.get(rnm);
                if (room == undefined) { 
                    return; 
                } 
                    
                room.connectedPeople--; 

                var date = new Date(); 

                if (!room.playersConnected) 
                    room.lastConnected = date;
                else {
                    room.playersConnected -- ;
                    if (room.playersConnected == 0) {
                        room.lastConnected = date;
                        delete room.playersConnected;
                    }
                }

                
                if (socket.handshake.session.guest) {
                    var guest = guestz.get(socket.handshake.session.name);
                    if (guest == undefined ) return;
                    guest.lastConnected = date;
                    delete guest.connected;
                }

                room.unready.delete(unm);
                room.ready.delete(unm);
                io.to(rnm).emit('sbd entered',room.connectedPeople);
            }); 
        });
        socket.on('ready', function() {
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
                return; 
            }
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            var unm = socket.handshake.session.name;
            if (rnm == undefined || unm == undefined) {  
                return; 
            }
            
            var room = roomz.get(rnm); 
            if (room == undefined) {  
                return; 
            }

            room.unready.delete(unm);
            room.ready.set(unm, true);

            if (room.unready.size == 0 && room.ready.size == 2) { 
                io.to(rnm).emit('begin game');
            }
            else { 
                io.to(rnm).emit('sbd entered',room.connectedPeople); 
            }
            
            var nameStyle = "user";
            if(socket.handshake.session.guest)
                nameStyle = "guest"
            
            var who = socket.handshake.session.name;
        
            who = who.replace(/</g, "&lt;").replace(/>/g,"&gt;");

            chat[chatLast[0]] = "<li>użytkownik <text class=" + '"' + nameStyle + '">' + who + "</text> " + "jest gotowy do gry" + "</li>";
            chatLast[0] = (chatLast[0]+1)%10;
            io.to(rnm).emit('chat message', "<li>użytkownik <text class=" + '"' + nameStyle + '">' + who + "</text> " + "jest gotowy do gry" + "</li>");

        });


        socket.on('unready', function() {

            if (socket.handshake == undefined 
                || socket.handshake.session == undefined 
                || socket.handshake.session.legit == undefined) {
                return; 
            }
            var rnm = socket.handshake.session.legit.roomEntered; 
            var unm = socket.handshake.session.name;
            if (rnm == undefined || unm == undefined) { 
                return;
            }
            var room = roomz.get(rnm); 
            
            if (room == undefined) {  
                return;
            }
            room.ready.delete(unm);
            room.unready.set(unm, true);
            io.to(rnm).emit('sbd entered',room.connectedPeople); 

            var nameStyle = "user";
            if(socket.handshake.session.guest)
                nameStyle = "guest"
            var who = socket.handshake.session.name;
            
            who = who.replace(/</g, "&lt;").replace(/>/g,"&gt;");
            chat[chatLast[0]] = "<li>użytkownik <text class=" + '"' + nameStyle + '">' + who + "</text> " + "nie jest gotowy do gry" + "</li>";
            chatLast[0] = (chatLast[0]+1)%10;
            io.to(rnm).emit('chat message', "<li>użytkownik <text class=" + '"' + nameStyle + '">' + who + "</text> " + "nie jest gotowy do gry" + "</li>");
        });

        socket.on('sbd entered', function(room) { //to chyba nic nie robi
            socket.emit('sbd entered', room);
        });

        socket.on('chat message room', function(msg){ 
            if (socket.handshake == undefined 
                || socket.handshake.session == undefined 
                || socket.handshake.session.legit == undefined) {  
                return; 
            }
            
            var rnm = socket.handshake.session.legit.roomEntered; 
            var unm = socket.handshake.session.name;
            
            if (rnm == undefined || unm == undefined) {  
                return; 
            }
            var room = roomz.get(rnm);
            if (room == undefined) { 
                return; 
            }

            var chat = room.chat;
            var chatLast = room.chatLast;


            var nameStyle = "user";
            if(socket.handshake.session.guest)
                nameStyle = "guest"
            msg = msg.replace(/</g, "&lt;").replace(/>/g,"&gt;"); 
            chat[chatLast[0]] = "<li><text class=" + '"' + nameStyle + '">' + socket.handshake.session.name + ":</text> " + msg + "</li>";
            chatLast[0] = (chatLast[0]+1)%10;
            io.to(rnm).emit('chat message', "<li><text class=" + '"' + nameStyle + '">' + socket.handshake.session.name + ":</text> " + msg + "</li>");
        
        });

    });
        


    router.all('/', (req,res) =>{

        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
            res.redirect('/redirectDefault'); 
            return; 
        }

        var name = req.session.legit.roomEntered;

        var r = roomz.get(name)
        if (r == undefined) { 
            res.redirect('/rooms'); 
        return; }
        
        var model = {
            room : r,
            ses : req.session,
            chat : r.chat,
            chatLast : r.chatLast[0] 
        }

        res.render('inroom.ejs', model);
        return;
    });

    router.all('/leave', (req,res) => {

        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
            res.redirect('/redirectDefault'); 
            return; 
        }
        
        var rnm = req.session.legit.roomEntered;
        var room = roomz.get(rnm);
        room.people--;
        room.unready.delete(req.session.name);
        room.ready.delete(req.session.name);

        if(room.people == 0 ) { 
            roomz.delete(rnm);
        }

        delete req.session.legit.roomEntered;
        res.redirect('/rooms');
        return; 
    });

    router.all('/createGame', (req,res) => { 
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
             res.redirect('/redirectDefault'); 
             return; 
        }        

        
        var roomName = req.session.legit.roomEntered;
        var unm = req.session.name;
        var room = roomz.get(roomName); 
        if (room == undefined) {
            res.redirect('/redirectDefault'); 
            return; 
        }
        var theID = id;
        if (room.game == undefined) {
            room.game = {
                //gametype
                id : theID,
                state : [0,0,0,0,0,0,0,0,0],
                player : [undefined, undefined],
                turn : [0],
                srcs : ["tictac/empty.png","tictac/tic.png","tictac/tac.png"],
                end : [0],
                playersIn : new Map()
            };

            ++id;
        } else theID = room.game.id;

        var game = room.game;
        if(!game.player[0])
            game.player[0] = unm;
        else if(!game.player[1] && game.player[0] != unm)
                game.player[1] = unm;
        
        game.end = 0;

        req.session.legit.inGame = 1;
        req.session.gameID = theID;

        room.ready.delete(unm);
        room.unready.set(unm, true);

        game.playersIn.set(unm, true);


        
        res.redirect('/rooms/room/game');  
        
        return;
    });

    return router;
}

module.exports = routerFun;
