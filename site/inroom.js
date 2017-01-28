
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę, bo on dokleja z przodu url co mu zostało

//var inrooms = new Map();

//sprawdzenie poziomu uprawnień - 
//starczy sprawdzić najgłębszy, bo przekierujemy na '/' a ono przekieruje najglębiej gdzie wolno i być powinien
//i tak by starczyło, bo je przechodzi po kolei
//!!! można by też sprawdzać po kolei od najpłytszego i przekierowywać na poprzedni, wtedy mniej zapytań
    /// no więc tu jest pewien problem, bo trzeba sprawdzać w funkcjach niżej i tak, czy się nazwa pokoju też zgadza - ew. nazwę czytać z sesji i tyle
router.use('/', (req,res,next) => {
    var ses = req.session;
    console.log(ses.legit.roomEntered+"WRACAM???4");
    console.log(req.session.legit.roomEntered+"WRACAM???4");
    if (!ses.legit.roomEntered) { 
        console.log(ses.legit.roomEntered+"WRACAM4");
        res.redirect('/'); 
        return; 
    }
    req.session.urlLegit.roomEntered = ses.legit.roomEntered;
    next();
});

var routerFun = function(roomz,io){

    //io.use(function(socket, next){
    //    session(socket.handshake, socket.handshake.res, next); //wtedy moge sie dostac do sesji w socket
    //});
    var gameRouter = require('./game')(roomz,io);
    router.use('/game',gameRouter);

    io.on('connection', function(socket) {
        console.log('connected in room');
        socket.on('getInRoom', function() { //rn to na razie nazwa pokoju
            
            var rnm = socket.handshake.session.legit.roomEntered;
            var unm = socket.handshake.session.name;
            console.log("Jestem "+rnm);
            //console.log(ses);
            //var name = ses.roomname;
            //var session = ses.session;
            var room = roomz.get(rnm); 
            if (room == undefined) { console.log("OJEJ");  return;}
            var roomname = room.name;
            socket.join(roomname);
            room.connectedPeople++;
            //room.unready.set(unm, true);
            //inrooms.set(socket,roomname);
            console.log(room.connectedPeople==undefined);
            console.log(room.connectedPeople);
            console.log(room.name==undefined);
            console.log(room.name);
            //console.log(name);
            //console.log(room);
            io.to(roomname).emit('sbd entered',room.connectedPeople); //do wszystkich, się też czyli człeka wliczy i pokaże

            //w ten sposób odejmą tylko te co były w pokoju jak wyjdą
            socket.on('disconnect', function() { // UWAGA: TO SIĘ DODA WSZYSTKIM SOCKETOM, TEŻ TYM DO POKOJU ITP
                //var rnm = inrooms.get(socket); //można czytać z socket.req.ses
                console.log("socket " + socket.id + "disconnected from room!");
                var rnm = socket.handshake.session.legit.roomEntered;
                var unm = socket.handshake.session.name;
                if (rnm == undefined) { console.log("OJEJKU"); return; }
                var room = roomz.get(rnm);
                if (room == undefined) { console.log("ŁOJENY"); return; } //czemu to się dzieje?
                    //#### bez tego, tylko czasowo


                    room.connectedPeople--; //ta funkcja się wykona tylko dla wtyczki połączonej z pokojem, bo się dodaje przy połączeniu
                    //if(room.connectedPeople == 0) {
                    //    roomz.delete(rnm);
                    //}
                    //console.log("JUŻ USUWAM");
                delete socket.handshake.session.legit.roomEntered; //musi usunąć 
                room.unready.delete(unm);
                room.ready.delete(unm);
                io.to(rnm).emit('sbd entered',room.connectedPeople);
            }); 
        });
        socket.on('ready', function() {
            var rnm = socket.handshake.session.legit.roomEntered;
            console.log("gotowy w "+rnm);
            var room = roomz.get(rnm); 
            var unm = socket.handshake.session.name;
            room.unready.delete(unm);
            room.ready.set(unm, true);
            if (room.unready.size == 0) { console.log("\nPOCZ\n"); io.to(rnm).emit('begin game'); }
            else io.to(rnm).emit('sbd entered',room.connectedPeople);
        });
        socket.on('sbd entered', function(room) { //to chyba nic nie robi
            socket.emit('sbd entered', room);
        });
        
    });
    
 /*dzieją się dziwne błędy z sesjami jak próbuję w chrome albo ogólnie w 2. przeglądarce*/
    


    router.all('/', (req,res) =>{

console.log("17"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));    
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

        var name = req.session.legit.roomEntered; //req.query.roomName; // UWAGA! zmieniłem, bo inaczej mógłby wejść do innego jeśli hasła by się zgadzały
        //nazwa pokoju w pasku adresu jest dla bajeru żeby tam też widać gdzie się jest

        /*if(!req.session.legit.entered)
        {
            res.redirect("/");
            return;
        }*/
        var r = roomz.get(name)
        if (r == undefined) { res.redirect('/rooms'); console.log("ojej"); return; }
        /*if (r.hasPwd) { //niepotrzebne, bo w sesji się mu daje że w pokoju tylko jak już poda hasło
            var pwd = req.session.roomPwd;
            if (r.pwd != pwd) { console.log("ZŁE HASŁO"); res.redirect('/rooms?err=pwd'); return; }   //to wszystko powinien być ajax z roomView, no ale jak pytać o wpisane w pole które może nie istnieć... EDIT - nie wyświetlać pola, a istnieje
        }
        if (r.people == 2) { console.log("PEŁEN"); res.redirect('/rooms?err=crowded'); return; } //TYLKO DLA DWUOSOBOWYCH
        //to psuło, bo było że 2 ludzi a mógł wejść; jak ustawi roomEntered, to wolno, jak nie, to się odbije od middleware. proste
        */
        
        var model = {
            room : r,
            ses : req.session
        }
        console.log("!!!"+r.name);
        res.render('inroom.ejs', model);
        return; //a może by res.end()?
    });

    router.all('/leave', (req,res) => {
        console.log("100"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        console.log("I CZEMU NIE USUWASZ");
        var rnm = req.session.legit.roomEntered;
        var room = roomz.get(rnm);
        room.people--;
        room.unready.delete(req.session.name);
        room.ready.delete(req.session.name);

        //ZROBIĆ ŻEBY INNYCH TEŻ WYWALIŁO WTEDY JAKOŚ
        if(room.people == 0 /*|| room.guru == req.session.name*/) { //          ZROBIĆ       jak guru wyjdzie to koniec, bo tylko on może usuwać
            roomz.delete(rnm);
        }
        delete req.session.legit.roomEntered;
        res.redirect('/rooms');
        return; //a może by res.end()?
    });

    router.all('/createGame', (req,res) => { // !!! to powinno tak naprawdę przekierowywać do tworzenia gry danego typu, z podpiętym routerem gra danego typu, tam 2 poziomy uprawnień i tworzenie na tym bez
console.log("18"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));    
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }        

        console.log("\n TWORZĘ \n");

        var roomName = req.session.legit.roomEntered;
        
        var room = roomz.get(roomName); //ew. spr czy nie undefined
        if (room == undefined) {res.redirect('/redirectDefault'); return; }
        if (room.game == undefined) {
            room.game = {
                //gametype
                state : [0,0,0,0,0,0,0,0,0],
                player : [undefined, undefined],
                turn : [0],   
                srcs : ["tictac/empty.png","tictac/tic.png","tictac/tac.png"],
                end : [0]
            };
        };
        var game = room.game;
        if(!game.player[0])
            game.player[0] = req.session.name;
        else
            if(!game.player[1] && game.player[0] != req.session.name)
                game.player[1] = req.session.name;
        
        game.end = 0;

        req.session.legit.inGame = 1;

        console.log(roomName);
        console.log(room);
        
        //!!!ŹLE - widzi parametr i nie wchodzi w /game, tylko idzie w '/', bo ma do tego parametr
        //tylgo reg exp w adresie pewnie by można zachować taki adres
        //res.redirect('/rooms/room/?roomName=' + roomName + '/game');   //!!!ŹLE - widzi parametr i nie wchodzi w /game, tylko idzie w '/', bo ma do tego parametr
        res.redirect('/rooms/room/game');  //!!!ŹLE - widzi parametr i nie wchodzi w game
        //można by pewnie napisać ~url + /game ; nazwa pokoju w adresie dla picu; ŹLE - widzi parametr i nie wchodzi w game

        return; //a może by res.end()?
    });

    return router;
}

module.exports = routerFun;