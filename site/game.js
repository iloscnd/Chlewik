//test game check for socket.io
var express = require('express');
var router = express.Router();

router.use( express.static('./static'));



var returnRouter = function(roomz,guestz,io) {

    
    //trzeba roomz, więc w routerFun
    //sprawdzenie poziomu uprawnień - 
    //starczy sprawdzić najgłębszy, bo przekierujemy na '/' a ono przekieruje najglębiej gdzie wolno i być powinien
    //i tak by starczyło, bo je przechodzi po kolei
    //!!! można by też sprawdzać po kolei od najpłytszego i przekierowywać na poprzedni, wtedy mniej zapytań
    /// !! tu jest gorzej, bo trzeba w funkcji też sprawdzać czy id pokojogry się zgadza - ew. nazwę czytać z sesji i tyle
    router.use('/', (req,res,next) => {

        
        //usuwanie nieaktualnych uprawnień, żeby nie próbowało przekierować i się nie pętliło

        //jak nie dam save sesji, to nie zmoodyfikuje
        if( req.session.legit.roomEntered == undefined) { /*console.log("usuwam że w grze");*/ delete req.session.legit.inGame; req.session.save(); }  //B. WAŻNE!!! jak ktoś usunie grę jak ten nie połączony
        else if( roomz.get(req.session.legit.roomEntered) == undefined) { /*console.log("usuwam że w grze");*/ delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! jak ktoś usunie grę jak ten nie połączony
        else if( (roomz.get(req.session.legit.roomEntered)).game == undefined) { /*console.log("usuwam że w grze");*/ delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! jak ktoś usunie grę jak ten nie połączony
        //starczy wykasowywać tu w sprawdzaniu uprawnień te nieaktualne, W GRZE TEŻ TRZEBA ID - bo ktoś mógłby wejść jak się skończyła tamta
        else  {
            var game = (roomz.get(req.session.legit.roomEntered)).game;
            if (game != undefined && game.id != req.session.gameID) { /*console.log("usuwam że w grze");*/ delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!!
        }

        var ses = req.session;

        if (!ses.legit.inGame) { 
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.inGame = ses.legit.inGame; //1, ale tak bezpiecznie; bez tego się pętli w neiskończoność przekierowując że wolno ale nie wolno
        next();
    });
    


    router.get('/', function(req, res){
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) {
            res.redirect('/redirectDefault');
            return; 
        }

        
        var roomName = req.session.legit.roomEntered;
        var room = roomz.get(roomName);
        //console.log(roomName);
        //console.log(room);
        if (room == undefined) {res.redirect('/redirectDefault'); return; }
        var game = room.game;
        if (game == undefined) {res.redirect('/redirectDefault'); return; }

        var p1vis = "hidden";
        var p2vis = "visible";
        if(game.turn[0] == 0){
            p2vis = "hidden";
            p1vis = "visible";  
        }



        res.render('game.ejs',{howManyConnected: game.playersConnected, state : game.state, srcs: game.srcs, ses: req.session, p1vis: p1vis, p2vis: p2vis, chat: room.chat, chatLast: room.chatLast[0]});
        return; //a może by res.end()?
    });

    router.all('/leave', (req,res) => {

        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
            res.redirect('/redirectDefault'); 
            return; 
        }
        
        //console.log("WYCHODZI Z GRY");
        
        var unm = req.session.name;
        var rnm = req.session.legit.roomEntered;
        var room = roomz.get(rnm);
        
        //console.log("\n\n " + room + "\n\n ");
        
        if (room == undefined) { 
            return; 
        }
        //jak gra już nie istnieje, to nie można zczytać

        if(room.game != undefined) {
            room.game.playersIn.delete(unm);

            //to ma sens tylko do usunięcia gdy wszyscy wyjdą - jakby była tak opcja kiedyś
            if(room.game.end[0] || room.game.playersIn.size == 0) { 
                delete room.game; //może ktoś zmienić skrypt, ale przy końcu gry tylko jak wszyscy, to się stan nie wyzeruje w pokoju, a dużo gier i tak się nie da
            }
            delete req.session.legit.inGame;
        }

        //zrobione przy wchodzeniu, opisane czemu, ale zostawię 
        room.ready.delete(unm);
        room.unready.set(unm, true);

        res.redirect('/rooms/room/?roomName=' + rnm);
        return; //a może by res.end()?
    });


    io.on('connection', function(socket){
        //console.log('A socket with sessionID ' + socket.client.id + ' connected!');

        
        //sprawdza czy aby na pewno nie ma w połowie undefined
        
        if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
           return; 
        }
       

       if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) {  return; }
       var rnm = socket.handshake.session.legit.roomEntered; //to zadziała, bo zczyta wskaźniki i one będą takie same i pod nimi zmieni
       //var unm = socket.handshake.session.name;
       if (rnm == undefined) {  return; }
       //var roomName = socket.handshake.session.legit.roomEntered; //to zadziała, bo zczyta wskaźniki i one będą takie same i pod nimi zmieni

       //tu zdefiniowane, żeby dało się w gotInGame zainicjować i je tu widział
       var room; // = roomz.get(rnm); //to też niżej w połączeniu, chociaż bez różnicy chyba
       var game;// = room.game;
       var state;// = game.state;
       var player;// = game.player;
       var turn;// = game.turn;
       var srcs;// = game.srcs;
       var end;// = game.end;
       var chat;// = room.chat;
       var chatLast;// = room.chatLast;
       
    
    
        socket.on('gotInGame', function() {

            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) { 
                return; 
            }

            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            var unm = socket.handshake.session.name;
            
            if (rnm == undefined || unm == undefined) { 
                return; 
            }
            
            //console.log("W grze "+unm);
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
            chat = room.chat;
            chatLast = room.chatLast
            //console.log(ses);
            //var name = ses.roomname;
            //var session = ses.session;
            
            socket.join(rnm+"_game");

            if (!game.playersConnected) game.playersConnected = 0;
            
            if (!socket.handshake.session.gameCONNECTEDnow) {
                game.playersConnected++;
            } 
            else return; //to jak przeglądarki ślą dziwne zapytania gdzieś pod spodem, to żeby nie robiły wtyczek - powinny być po tym normalnym przetwarzane
            socket.handshake.session.gameCONNECTEDnow = 1;
            socket.handshake.session.save();
    
            //if (!game.playersConnected) game.playersConnected = 0;
            //game.playersConnected ++ ;
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
              //      var user = userz.get(socket.handshake.session.name);
               //     if (user == undefined ) return;
                //    if (!user.connected) user.connected = 1;
                 //   delete user.lastConnected;
            }
            
            socket.emit('user_connected', {name:player[0], id:"p1" })
            socket.emit('user_connected', {name:player[1], id:"p2" })


            //io.to(roomname+"_game").emit('sbd entered',room.connectedPeople);

            socket.on('disconnect', function(){ //przeniesione do tego na connect, żeby tylko tym z gry coś robiło
                //console.log('A socket with sessionID ' + socket.client.id + ' disconnected!');

                var date = new Date(); //bierze aktualną
                // /var tm = date.getTime(); //jednak nie wziąłem tego

                
            
                if (socket.handshake.session.gameCONNECTEDnow) {
                    if (game.playersConnected) game.playersConnected--;
                }
                socket.handshake.session.gameCONNECTEDnow = 0;
                socket.handshake.session.save();

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
                      //      var user = userz.get(socket.handshake.session.name);
                       //     if (user == undefined ) return;
                        //    user.lastConnected = date;
                         //   delete user.connected;
                        }
                        
                
            });

        });

        

        socket.on('FieldClicked',function(msg){
           // console.log("Socket with id " + socket.client.id +" and name " + socket.handshake.session.name +  " clicked filed number " + msg);
            if (socket.handshake == undefined || socket.handshake.session == undefined || socket.handshake.session.legit == undefined) {
                return; 
            }
            
            var rnm = socket.handshake.session.legit.roomEntered; //to istnieje, o ile wtyczka nie była połączona i próbuje ze starego uruchomienia aplikacji
            
            if (rnm == undefined) { 
                return; 
            }

            //console.log("!!!!!!!!\n"+JSON.stringify(game)+"///////"+socket.client.id);
            
            if(state[msg] == 0 && !end[0]){
                if(player[turn[0]%2] == socket.handshake.session.name){
                    io.to(rnm+"_game").emit('change',[msg,turn[0]%2]);
                    state[msg] = turn[0]%2 + 1;
                    turn[0] = (turn[0]+1)%2;
                    //console.log(state);
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
                        //console.log("WYŚLIJ ŻE WYGRAŁ");
                        io.to(rnm+"_game").emit('won', socket.handshake.session.name);
                        
                        
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
                msg=msg.replace(/</g, "&lt;").replace(/>/g, "&gt;"); //nie da się code injection
                chat[chatLast[0]] = "<li><text class=" + '"' + nameStyle + '">' + socket.handshake.session.name + ":</text><text> " + msg + "</text></li>"; //<text> nie pomaga na code injection, ale to wyżej tak
                chatLast[0] = (chatLast[0]+1)%10;
                io.to(rnm+"_game").emit('chat message', "<li><text class=" + '"' + nameStyle + '">' + socket.handshake.session.name + ":</text><text> " + msg + "</text></li>");
            }
        });
        socket.on('surrender',function(msg){
            
            delete room.game; 
            end[0] = 1;

            var winner = player[0];
            if( socket.handshake.session.name == winner)
                winner = player[1];

            io.to(rnm+"_game").emit('won', winner);
        });
        
        
        
    
    });


    return router;
}

module.exports = returnRouter;

