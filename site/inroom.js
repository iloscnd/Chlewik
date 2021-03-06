
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

        //usuwanie nieaktualnych uprawnień, żeby nie próbowało przekierować i się nie pętliło
        //trzeba usunąć też następne poziomy, bo już potem tam nie dotrze żeby je usunąć
        if(req.session.legit.roomEntered && roomz.get(req.session.legit.roomEntered) == undefined) { /*console.log("usuwam że w pokoju");*/ delete req.session.legit.roomEntered; delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! jak ktoś usunie pokój jak ten nie połączony
        if ( req.session.legit.roomEntered) {
            var room = roomz.get(req.session.legit.roomEntered);
            if (room != undefined && room.id != req.session.roomEnteredID) { /*console.log("usuwam że w pokoju");*/ delete req.session.legit.roomEntered; delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!!
        }
        //starczy wykasowywać tu w sprawdzaniu uprawnień te nieaktualne, też z ID

        var ses = req.session; //ew. sprawdzać na null
        

        if (!ses.legit.roomEntered) { 
            //console.log(ses.legit.roomEntered+"WRACAM4");
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.roomEntered = ses.legit.roomEntered;
        next();
    });



    //io.use(function(socket, next){
    //    session(socket.handshake, socket.handshake.res, next); //wtedy moge sie dostac do sesji w socket
    //});
    var gameRouter = require('./game')(roomz,userz, guestz,io);
    router.use('/game',gameRouter);
    
    io.on('connection', function(socket) {
        //console.log('connected in room');
        var chat;
        var chatLast;
        socket.on('getInRoom', function() { //rn to na razie nazwa pokoju
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { return; }
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            var unm = socket.handshake.session.name;
            if (rnm == undefined || unm == undefined) { return; }
            //console.log("Jestem "+rnm);
            
            var room = roomz.get(rnm); 
            if (room == undefined) { return;}
            var roomname = room.name;
            chat = room.chat;
            chatLast = room.chatLast


            socket.join(roomname);
            room.connectedPeople++;
            
            //console.log(room.name==undefined);
            //console.log(room.name);
            

/* //nie wiem czemu te psuły
            console.log("-------------------"+JSON.stringify(socket.handshake.session));

            socket.handshake.session.roomConnected = 1;
            delete socket.handshake.session.roomDisconnected;
            socket.handshake.session.save();

            console.log("-------------------"+JSON.stringify(socket.handshake.session));
*/
            if (!room.playersConnected) room.playersConnected = 0;
            room.playersConnected ++ ;
            delete room.lastConnected;

            //musi też tu, bo jak wchodzą do pokoju to z widoku pokoi ich rozłącza, a ma ich nie wywalać
            if (socket.handshake.session.guest) {
                var guest = guestz.get(socket.handshake.session.name);
                if (guest == undefined ) return;
                if (!guest.connected) guest.connected = 1;
                delete guest.lastConnected;
            }
            else if (socket.handshake.session.legit.entered && !socket.handshake.session.guest) { // 2. warunek niepotrzebny, bo jest else
           //     var user = userz.get(socket.handshake.session.name);
            //    if (user == undefined ) return;
             //   if (!user.connected) user.connected = 1;
            //    delete user.lastConnected;
            }

            io.to(roomname).emit('sbd entered',room.connectedPeople); //do wszystkich, się też czyli człeka wliczy i pokaże

            //w ten sposób odejmą tylko te co były w pokoju jak wyjdą
            socket.on('disconnect', function() { // UWAGA: TYLKO SOCKETOM Z POKOJU - jak ktoś np. w grze, to będzie tu rozłączony, ale głębiej połączony
                //var rnm = inrooms.get(socket); //można czytać z socket.req.ses
                //console.log("socket " + socket.id + "disconnected from room!");
                if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { return; }
                var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
                var unm = socket.handshake.session.name;
                if (rnm == undefined || unm == undefined) { return; }
                var room = roomz.get(rnm);
                if (room == undefined) { return; } //czemu to się dzieje?
                    
                    room.connectedPeople--; //ta funkcja się wykona tylko dla wtyczki połączonej z pokojem, bo się dodaje przy połączeniu
                    

                var date = new Date(); //bierze aktualną

                var date = new Date(); //bierze aktualną
                // /var tm = date.getTime(); //jednak nie wziąłem tego

                if (!room.playersConnected) room.lastConnected = date;
                else {
                    room.playersConnected -- ;
                    if (room.playersConnected == 0) {
                        room.lastConnected = date;
                        delete room.playersConnected;
                    }
                }

                
                //musi też tu, bo jak wchodzą do pokoju to z widoku pokoi ich rozłącza, a ma ich nie wywalać
                //jak dodaje na wejściu, to musi usunąć na wyjściu
                if (socket.handshake.session.guest) {
                    var guest = guestz.get(socket.handshake.session.name);
                    if (guest == undefined ) return;
                    guest.lastConnected = date;
                    delete guest.connected;
                }
                else if (socket.handshake.session.legit.entered && !socket.handshake.session.guest) { // 2. warunek niepotrzebny, bo jest else
                  //  var user = userz.get(socket.handshake.session.name);
                 //   if (user == undefined ) return;
                //    user.lastConnected = date;
               //     delete user.connected;
                }
                        
                //delete socket.handshake.session.legit.roomEntered; //NIE!!! ma nie usuwać z gry w ten sposób
                //socket.handshake.session.save();

                room.unready.delete(unm);
                room.ready.delete(unm);
                io.to(rnm).emit('sbd entered',room.connectedPeople);
            }); 
        });
        socket.on('ready', function() {
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { return; }
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            var unm = socket.handshake.session.name;
            if (rnm == undefined || unm == undefined) {  return; }
            //console.log("gotowy w "+rnm);
            var room = roomz.get(rnm); 
            if (room == undefined) {  return; }
            room.unready.delete(unm);
            room.ready.set(unm, true);
            if (room.unready.size == 0 && room.ready.size == 2) { /*console.log("\nPOCZ\n");*/ io.to(rnm).emit('begin game'); } //tylko dla 2 -osob.
            else io.to(rnm).emit('sbd entered',room.connectedPeople); //chyba niepotrzebne
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
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) {  return; }
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            var unm = socket.handshake.session.name;
            if (rnm == undefined || unm == undefined) { return; }
            //console.log("niegotowy w "+rnm);
            var room = roomz.get(rnm); 
            if (room == undefined) {  return; }
            room.ready.delete(unm);
            room.unready.set(unm, true);
            //if (room.unready.size == 0 && room.ready.size == 2) { console.log("\nPOCZ\n"); io.to(rnm).emit('begin game'); } //tylko dla 2 -osob.
            io.to(rnm).emit('sbd entered',room.connectedPeople); //chyba niepotrzebne
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

        socket.on('chat message room', function(msg){ // z tym samym łapie nie to co chce
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) {  return; }
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            var unm = socket.handshake.session.name;
            if (rnm == undefined || unm == undefined) {  return; }
            var room = roomz.get(rnm);
            if (room == undefined) { return; }

            var chat = room.chat;
            var chatLast = room.chatLast;

            //console.log(msg);

            var nameStyle = "user";
            if(socket.handshake.session.guest)
                nameStyle = "guest"
            msg = msg.replace(/</g, "&lt;").replace(/>/g,"&gt;"); //against code injection
            chat[chatLast[0]] = "<li><text class=" + '"' + nameStyle + '">' + socket.handshake.session.name + ":</text> " + msg + "</li>";
            chatLast[0] = (chatLast[0]+1)%10;
            io.to(rnm).emit('chat message', "<li><text class=" + '"' + nameStyle + '">' + socket.handshake.session.name + ":</text> " + msg + "</li>");
        
        });

    });
    
 /*dzieją się dziwne błędy z sesjami jak próbuję w chrome albo ogólnie w 2. przeglądarce*/
    


    router.all('/', (req,res) =>{

        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

        var name = req.session.legit.roomEntered; //req.query.roomName; // UWAGA! zmieniłem, bo inaczej mógłby wejść do innego jeśli hasła by się zgadzały
        //nazwa pokoju w pasku adresu jest dla bajeru żeby tam też widać gdzie się jest

        var r = roomz.get(name)
        if (r == undefined) { res.redirect('/rooms'); return; }
        
        //console.log(r);
        var model = {
            room : r,
            ses : req.session,
            chat : r.chat,
            chatLast : r.chatLast[0] 
        }
        //console.log("!!!"+r.name);
        res.render('inroom.ejs', model);
        return; //a może by res.end()?
    });

    router.all('/leave', (req,res) => {

        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        
        var rnm = req.session.legit.roomEntered;
        var room = roomz.get(rnm);
        room.people--;
        room.unready.delete(req.session.name);
        room.ready.delete(req.session.name);

        //jak pokój znika to usuwa z niego innych przy jakmkolwiek żądaniu
        if(room.people == 0 ) { 
            roomz.delete(rnm);
        }
        delete req.session.legit.roomEntered;
        res.redirect('/rooms');
        return; //a może by res.end()?
    });

    router.all('/createGame', (req,res) => { // !!! to powinno tak naprawdę przekierowywać do tworzenia gry danego typu, z podpiętym routerem gra danego typu, tam 2 poziomy uprawnień i tworzenie na tym bez
         if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }        

        //console.log("\n TWORZĘ \n");

        var roomName = req.session.legit.roomEntered;
        var unm = req.session.name;
        var room = roomz.get(roomName); //ew. spr czy nie undefined
        if (room == undefined) {res.redirect('/redirectDefault'); return; }
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
        else
            if(!game.player[1] && game.player[0] != unm)
                game.player[1] = unm;
        
        game.end = 0;

        req.session.legit.inGame = 1;
        req.session.gameID = theID;

        //gotowość do gry trzeba usuwać z pokoju już przy wchodzeniu, bo przy wychodzeniu z gry pierwszy co wyjdzie usuwa grę
        //a wtedy innym się anulują uprawnienia do robienia z nią czegoś i  przy okazji automatycznie im się usuwa bycie w niej
        //ale nie mogą ustawić sobie przy wyjściu, bo to wymaga tych uprawnień
        room.ready.delete(unm);
        room.unready.set(unm, true);

        game.playersIn.set(unm, true);


        //console.log(roomName);
        //console.log(room);
        
        res.redirect('/rooms/room/game');  
        
        return; //a może by res.end()?
    });

    return router;
}

module.exports = routerFun;
