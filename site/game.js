//test game check for socket.io
var express = require('express');
var router = express.Router();

router.use( express.static('./static'));

//sprawdzenie poziomu uprawnień - 
//starczy sprawdzić najgłębszy, bo przekierujemy na '/' a ono przekieruje najglębiej gdzie wolno i być powinien
//i tak by starczyło, bo je przechodzi po kolei
//!!! można by też sprawdzać po kolei od najpłytszego i przekierowywać na poprzedni, wtedy mniej zapytań
  /// !! tu jest problem, bo trzeba w funkcji też sprawdzać czy nazwa pokojogry się zgadza - ew. nazwę czytać z sesji i tyle
router.use('/', (req,res,next) => {
    var ses = req.session;
    if (!ses.legit.inGame) { 
        console.log(ses.legit.inGame+"WRACAM5");
        res.redirect('/'); 
        return; 
    }
    req.session.urlLegit.inGame = ses.legit.inGame; //1, ale tak bezpiecznie; bez tego się pętli w neiskończoność przekierowując że wolno ale nie wolno
    next();
});

var returnRouter = function(roomz,io) {

    /*
    var state = [0,0,0,0,0,0,0,0,0];
    var player = [undefined, undefined];
    var turn = 0;   
    var srcs = ["tictac/empty.png","tictac/tic.png","tictac/tac.png"]
    var end = 0;
    */ // moved to /inroom/createRoom
    
    


    router.get('/', function(req, res){

console.log("19"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
/*
        if(!req.session.legit.entered)
        {
            res.redirect("/");
        }
        else*/

        var roomName = req.session.legit.roomEntered;
        var room = roomz.get(roomName);
        console.log(roomName);
        console.log(room);
        if (room == undefined) {res.redirect('/redirectDefault'); return; }
        var game = room.game;
        if (game == undefined) {res.redirect('/redirectDefault'); return; }

            res.render('game.ejs',{state : game.state, srcs: game.srcs, ses: req.session});
            return; //a może by res.end()?
    });


    //na arzie emitowane do wszystkich, trzeba zmienić ż etu wtyczki też w pokoju
    io.on('connection', function(socket){
       // console.log(socket);
       console.log('A socket with sessionID ' + socket.client.id + ' connected!');

       //########  przydałoby się tu i w tych funkcjach niżej sprawdzać czy gra jeszcze istnieje

       //nie uruchamiać z podłączoną wtyczką, albo to zmienić żeby uważało na undefined
       //console.log(socket.request + "\n\n!!!\n\n");
       console.log(socket.handshake.session+ "\n\n;;;\n\n");
       //console.log(socket.request.session+ "\n\n:::\n\n"); //nie ma jak ten middleware (express-socket.io-session)
       
       //zmienić, żeby sprawdzał czy aby na pewno nie ma w połowie undefined
       var roomName = socket.handshake.session.legit.roomEntered; //to zadziała, bo zczyta wskaźniki i one będą takie same i pod nimi zmieni
       var room = roomz.get(roomName);
       
       var game;// = room.game;
       var state;// = game.state;
       var player;// = game.player;
       var turn;// = game.turn;
       var srcs;// = game.srcs;
       var end;// = game.end;

       /*
        if(!player[0])
            player[0] = socket.handshake.session.name;
        else
            if(!player[1] && player[0] != socket.handshake.session.name)
                player[1] = socket.handshake.session.name;
        
        end = 0; */ //moved to creating game
        socket.on('gotInGame', function() {
            var rnm = socket.handshake.session.legit.roomEntered;
            var unm = socket.handshake.session.name;
            console.log("W grze "+unm);
            //to MUSZĄ byś obiekty te wszystkie pola, żeby je mógł zmieniać
            //tzn tylko wtedy przekaże referencję, a nie wartość
            //więc zrobiłem tablice 1 - elementowe
            game = room.game;
            state = game.state;
            player = game.player;
            turn = game.turn;
            srcs = game.srcs;
            end = game.end;
            //console.log(ses);
            //var name = ses.roomname;
            //var session = ses.session;
            
            socket.join(rnm+"_game");
            
            
            socket.emit('user_connected', {name:player[0], id:"p1" })
            socket.emit('user_connected', {name:player[1], id:"p2" })


            //io.to(roomname+"_game").emit('sbd entered',room.connectedPeople);

        });

        socket.on('getOutGame', function() {
            delete socket.handshake.session.legit.inGame; 
            socket.handshake.session.save(); //zapisz zmianę też w tamtej
            socket.emit('gotOutGame');
        });

        socket.on('FieldClicked',function(msg){
           // console.log("Socket with id " + socket.client.id +" and name " + socket.handshake.session.name +  " clicked filed number " + msg);
            var rnm = socket.handshake.session.legit.roomEntered;
            console.log("!!!!!!!!\n"+JSON.stringify(game)+"///////"+socket.client.id);
            if(state[msg] == 0 && !end[0]){
                if(player[turn[0]%2] == socket.handshake.session.name){
                    io.to(rnm+"_game").emit('change',[msg,turn[0]%2]);
                    state[msg] = turn[0]%2 + 1;
                    turn[0]++; 
                    //check if won

                    won = false;
                    for( i = 0; i<3; i++)
                        if( state[i] != 0 && state[i]==state[i+3] && state[i]==state[i+6])
                            won = true;
                    for( i = 0; i<3; i++)
                        if( state[3*i] != 0 && state[3*i]==state[3*i+1] && state[3*i]==state[3*i+2])
                            won = true;
                    if( state[0] != 0 && state[0]==state[4] && state[0]==state[8])
                        won = true;
                    if( state[2] != 0 && state[2]==state[4] && state[4]==state[6])
                        won = true;
                    
                    if(won){
                        //console.log(state);
                        /*for(i=0; i<9; i++){
                            //io.to(rnm+"_game").emit('clear',i) //bez sensu, bo nie pyta o zgodę
                            state[i] = 0; //i tak nie starczy chyba do nowej gry??
                        }*/

                        //to chyba tworzy nowy obiekt i tamten wskaźnik już nie działa
                        //state = [0,0,0,0,0,0,0,0,0]; //dla jednej gry
                        //player = [undefined, undefined];

                        ///delete game; //to NIE DZIAŁA, jest tylko czytanie z sesji

                        delete room.game; //CHYBA NIE ŚMIGA? a może zadziała? w końcu wskaźnik to wskaźnik

                        // tu jakoś zrobić, żeby przekierował tam gdzie trzeba, albo w ejs to zrobić
                        console.log("WYŚLIJ ŻE WYGRAŁ");
                        io.to(rnm+"_game").emit('won', socket.handshake.session.name);
                        
                        //end[0] = 1;
                    }
                }
            }

        });

        socket.on('reset', function(msg){
            var rnm = socket.handshake.session.legit.roomEntered;
            for(i=0; i<9; i++){
                io.to(rnm+"_game").emit('clear',i) //bez sensu, bo nie pyta o zgodę
                state[i] = 0; //i tak nie starczy chyba do nowej gry??
            }
            end[0] = 0;
        });


        socket.on('disconnect', function(){
                console.log('A socket with sessionID ' + socket.client.id + ' disconnected!');
                //delete socket.handshake.session.legit.inGame; //to tak nie działa
                //check if disconnected user was a player(and is not having any kind of )
        });
       // console.log(socket.handshake.session.name);
    });


    return router;
}

module.exports = returnRouter;

