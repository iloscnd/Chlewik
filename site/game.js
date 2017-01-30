//test game check for socket.io
var express = require('express');
var router = express.Router();

router.use( express.static('./static'));



var returnRouter = function(roomz,userz, guestz,io) {

    /*
    var state = [0,0,0,0,0,0,0,0,0];
    var player = [undefined, undefined];
    var turn = 0;   
    var srcs = ["tictac/empty.png","tictac/tic.png","tictac/tac.png"]
    var end = 0;
    */ // moved to /inroom/createRoom
    
    //trzeba roomz, więc w routerFun
    //sprawdzenie poziomu uprawnień - 
    //starczy sprawdzić najgłębszy, bo przekierujemy na '/' a ono przekieruje najglębiej gdzie wolno i być powinien
    //i tak by starczyło, bo je przechodzi po kolei
    //!!! można by też sprawdzać po kolei od najpłytszego i przekierowywać na poprzedni, wtedy mniej zapytań
    /// !! tu jest problem, bo trzeba w funkcji też sprawdzać czy nazwa pokojogry się zgadza - ew. nazwę czytać z sesji i tyle
    router.use('/', (req,res,next) => {

        console.log("W5"+JSON.stringify(req.session.legit));

        //usuwanie nieaktualnych uprawnień, żeby nie próbowało przekierować i się nie pętliło

        //jak nie dam save sesji, to nie zmoodyfikuje, jest nierozumny
        if( req.session.legit.roomEntered == undefined) { console.log("usuwam że w grze"); delete req.session.legit.inGame; req.session.save(); }  //B. WAŻNE!!! jak ktoś usunie grę jak ten nie połączony
        else if( roomz.get(req.session.legit.roomEntered) == undefined) { console.log("usuwam że w grze"); delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! jak ktoś usunie grę jak ten nie połączony
        else if( (roomz.get(req.session.legit.roomEntered)).game == undefined) { console.log("usuwam że w grze"); delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! jak ktoś usunie grę jak ten nie połączony


        var ses = req.session;

        if (!ses.legit.inGame) { 
            console.log(ses.legit.inGame+"WRACAM5");
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.inGame = ses.legit.inGame; //1, ale tak bezpiecznie; bez tego się pętli w neiskończoność przekierowując że wolno ale nie wolno
        next();
    });
    


    router.get('/', function(req, res){

        console.log("19"+JSON.stringify(req.session.legit));
        console.log(JSON.stringify(req.session.urlLegit));
/*#*/    
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) {
            res.redirect('/redirectDefault');
            return; 
        }
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

    router.all('/leave', (req,res) => {

        console.log("20"+JSON.stringify(req.session.legit));
        console.log(JSON.stringify(req.session.urlLegit));
/*#*/    
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
            res.redirect('/redirectDefault'); 
            return; 
        }
        
        console.log("WYCHODZI Z GRY");
        
        var unm = req.session.name;
        var rnm = req.session.legit.roomEntered;
        var room = roomz.get(rnm);
        
        console.log("\n\n " + room + "\n\n ");
        
        if (room == undefined) { 
            console.log("ŁOJENYONIE");
            return; 
        }
        //jak gra już nie istnieje, to nie można zczytać

        if(room.game != undefined) {
            room.game.playersIn.delete(unm);

            //to ma sens tylko do usunięcia gdy wszyscy wyjdą - a ja nie dodawałem takiej opcji na razie, ale chyba obsluguję playersIn w miarę
            if(room.game.end[0] || room.game.playersIn.size == 0) { //          ZROBIĆ       jak guru wyjdzie to koniec, bo tylko on może usuwać
                delete room.game; //może ktoś zmienić skrypt, ale przy końcu gry tylko jak wszyscy, to się stan nie wyzeruje w pokoju, a dużo gier i tak się nie da
            }
            delete req.session.legit.inGame;
        }

        //zrobione przy wchodzeniu, opisane czemu, ale zostawię bo czemu nie
        ///console.log("\n\n\nNEGOTOWY" + unm + "\n\n\n\n");
        room.ready.delete(unm);
        room.unready.set(unm, true);

        res.redirect('/rooms/room/?roomName=' + rnm);
        return; //a może by res.end()?
    });


    //na arzie emitowane do wszystkich, trzeba zmienić że tu wtyczki też w pokoju
    io.on('connection', function(socket){
        // console.log(socket);
        console.log('A socket with sessionID ' + socket.client.id + ' connected!');

        //########  przydałoby się tu i w tych funkcjach niżej sprawdzać czy gra jeszcze istnieje

        //nie uruchamiać z podłączoną wtyczką, albo to zmienić żeby uważało na undefined
        //console.log(socket.request + "\n\n!!!\n\n");
        //console.log(socket.handshake.session+ "\n\n;;;\n\n");
        //console.log(socket.request.session+ "\n\n:::\n\n"); //nie ma jak ten middleware (express-socket.io-session)
        
        //zmienić, żeby sprawdzał czy aby na pewno nie ma w połowie undefined
        
        if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
           console.log("ŁOJENY"); 
           return; 
        }
       

       //zmienić, żeby sprawdzał czy aby na pewno nie ma w połowie undefined
       if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { console.log("ŁOJENY"); return; }
       var rnm = socket.handshake.session.legit.roomEntered; //to zadziała, bo zczyta wskaźniki i one będą takie same i pod nimi zmieni
       //var unm = socket.handshake.session.name;
       if (rnm == undefined) { console.log("ŁOJENY"); return; }
       //var roomName = socket.handshake.session.legit.roomEntered; //to zadziała, bo zczyta wskaźniki i one będą takie same i pod nimi zmieni

       //tu zdefiniowane, żeby dało się w gotInGame zainicjować i je tu widział
       var room //;= roomz.get(rnm); //to też niżej w połączeniu, chociaż bez różnicy chyba
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
                */

        
       

        /*
            if(!player[0])
                player[0] = socket.handshake.session.name;
            else
                if(!player[1] && player[0] != socket.handshake.session.name)
                    player[1] = socket.handshake.session.name;
            
            end = 0; */ 
            
            //moved to creating game
    
    
        socket.on('gotInGame', function() {

            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
                console.log("ŁOJENY"); 
                return; 
            }

            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            var unm = socket.handshake.session.name;
            
            if (rnm == undefined || unm == undefined) { 
                console.log("ŁOJENY"); 
                return; 
            }
            
            console.log("W grze "+unm);
            //to MUSZĄ byś obiekty te wszystkie pola, żeby je mógł zmieniać
            //tzn tylko wtedy przekaże referencję, a nie wartość
            //więc zrobiłem tablice 1 - elementowe

            room = roomz.get(rnm);
            if(room == undefined) return; //to się nie zdarzy

            game = room.game;

            if(game == undefined) return; //to się nie zdarzy

            state = game.state;
            player = game.player;
            turn = game.turn;
            srcs = game.srcs;
            end = game.end;
            //console.log(ses);
            //var name = ses.roomname;
            //var session = ses.session;
            
            socket.join(rnm+"_game");

    /*        

            socket.handshake.session.gameConnected = 1;
            delete socket.handshake.session.gameDisconnected;
            socket.handshake.session.save();
*/
            if (!game.playersConnected) game.playersConnected = 0;
            game.playersConnected ++ ;
            delete game.lastConnected;

            //to też musi dodawać do pokoju, żeby pokoju nie usunęło jak długo grają, bo się z niego rozłączają
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
                        var user = userz.get(socket.handshake.session.name);
                        if (user == undefined ) return;
                        if (!user.connected) user.connected = 1;
                        delete user.lastConnected;
                    }
            
            socket.emit('user_connected', {name:player[0], id:"p1" })
            socket.emit('user_connected', {name:player[1], id:"p2" })


            //bedzie dopisywać do czatu   
            io.to(rnm+"_game").emit('chay message', "<li> user "+ unm + "connected </li>");


            //io.to(roomname+"_game").emit('sbd entered',room.connectedPeople);

            socket.on('disconnect', function(){ //przeniesione do tego na connect, żeby tylko tym z gry coś robiło
                console.log('A socket with sessionID ' + socket.client.id + ' disconnected!');

                var date = new Date(); //bierze aktualną
                // /var tm = date.getTime(); //jednak nie wziąłem tego
/*                
                delete socket.handshake.session.gameConnected;
                socket.handshake.session.gameDisconnected = date;
                socket.handshake.session.save();
*/
                if (!game.playersConnected) game.lastConnected = date;
                else {
                    game.playersConnected -- ;
                    if (game.playersConnected == 0) {
                        game.lastConnected = date;
                        delete game.playersConnected;
                    }
                }

                //tu też musi zmniejszyć, jak przy połączeniu zwiększa
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
                            var user = userz.get(socket.handshake.session.name);
                            if (user == undefined ) return;
                            user.lastConnected = date;
                            delete user.connected;
                        }
                        
                //delete socket.handshake.session.legit.roomEntered; //NIE!!! ma nie usuwać z pokoju w ten sposób
                //socket.handshake.session.save();


                //delete socket.handshake.session.legit.inGame; //to tak nie działa
                //check if disconnected user was a player(and is not having any kind of )
            });

        });

        /* //jednak inaczej - po prostu przekierowanie do .../game/getOut czy coś
        socket.on('getOutGame', function() {
            delete socket.handshake.session.legit.inGame; 
            socket.handshake.session.save(); //zapisz zmianę też w tamtej
            socket.emit('gotOutGame');
        }); */

        socket.on('FieldClicked',function(msg){
           // console.log("Socket with id " + socket.client.id +" and name " + socket.handshake.session.name +  " clicked filed number " + msg);
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) {
                console.log("ŁOJENY");
                return; 
            }
            
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            
            if (rnm == undefined) { 
                console.log("ŁOJENY"); 
                return; 
            }

            console.log("!!!!!!!!\n"+JSON.stringify(game)+"///////"+socket.client.id);
            
            if(state[msg] == 0 && !end[0]){
                if(player[turn[0]%2] == socket.handshake.session.name){
                    io.to(rnm+"_game").emit('change',[msg,turn[0]%2]);
                    state[msg] = turn[0]%2 + 1;
                    turn[0]++;
                    console.log(state);
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
                        

                        delete room.game; // to chyba nawet działa, bo żaden nie ma uprawnień na /leave w grze potem   //CHYBA NIE ŚMIGA? a może zadziała? w końcu wskaźnik to wskaźnik

                        end[0] = 1;

                        // tu jakoś zrobić, żeby przekierował tam gdzie trzeba, albo w ejs to zrobić
                        console.log("WYŚLIJ ŻE WYGRAŁ");
                        io.to(rnm+"_game").emit('won', socket.handshake.session.name);
                        
                        //end[0] = 1;
                    }
                    else
                    {
                        var draw = true;
                        for( i = 0; i<9; i++){
                            if(state[i] == 0)
                                draw = false;
                        }
                        if(draw){
                            console.log("draw");
                            delete room.game;
                            end[0] = 1; 
                            io.to(rnm+"_game").emit('draw', null);
                        }
                    }
                }
            }

        });

        socket.on('chat message', function(msg){
            if(socket.handshake.session.name == player[0] || socket.handshake.session.name == player[1]){
                var nameStyle = "user";
                if(socket.handshake.session.guest)
                    nameStyle = "guest"
                io.to(rnm+"_game").emit('chat message', "<ul><text class=" + '"' + nameStyle + '">' + socket.handshake.session.name + ":</text> " + msg + "</ul>");
            }
        });
        socket.on('surrender',function(msg){
            
            delete room.game; // to chyba nawet działa, bo żaden nie ma uprawnień na /leave w grze potem   //CHYBA NIE ŚMIGA? a może zadziała? w końcu wskaźnik to wskaźnik
            end[0] = 1;

            var winner = player[0];
            if( socket.handshake.session.name == winner)
                winner = player[1];

            io.to(rnm+"_game").emit('won', winner);
        });
        
        //to pójdzie do kosza
        socket.on('reset', function(msg){
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
                console.log("ŁOJENY"); 
                return; 
            }
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            if (rnm == undefined) { 
                console.log("ŁOJENY"); 
                return; 
            }
            for(i=0; i<9; i++){
                io.to(rnm+"_game").emit('clear',i) //bez sensu, bo nie pyta o zgodę
                state[i] = 0; //i tak nie starczy chyba do nowej gry??
            }
            end[0] = 0;
        });

        /*
        socket.on('disconnect', function(){ //przeniesione do tego na connect, żeby tylko tym z gry coś robiło
                console.log('A socket with sessionID ' + socket.client.id + ' disconnected!');
                //delete socket.handshake.session.legit.inGame; //to tak nie działa
                //check if disconnected user was a player(and is not having any kind of )
        }); */
       // console.log(socket.handshake.session.name);
    
    });


    return router;
}

module.exports = returnRouter;

