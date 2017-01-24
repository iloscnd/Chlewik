//test game check for socket.io
var express = require('express');
var router = express.Router();

router.use( express.static('./static'));



var returnRouter = function(io) {

    var state = [0,0,0,0,0,0,0,0,0];
    var player = [undefined, undefined];
    var turn = 0;   
    var srcs = ["tictac/empty.png","tictac/tic.png","tictac/tac.png"]
    var end = 0;

    router.get('/', function(req, res){
        
       

        if(!req.session.entered)
        {
            res.redirect("/");
        }
        else
            res.render('game.ejs',{state : state, srcs:srcs});
    });


    //na arzie emitowane do wszystkich, trzeba zmienić ż etu wtyczki też w pokoju
    io.on('connection', function(socket){
       // console.log(socket);
       // console.log('A socket with sessionID ' + socket.client.id + ' connected!');



        if(!player[0])
            player[0] = socket.request.session.name;
        else
            if(!player[1] && player[0] != socket.request.session.name)
                player[1] = socket.request.session.name;
        
        end = 0;
        socket.on('gotInGame', function() {
            var rnm = socket.request.session.roomEntered;
            var unm = socket.request.session.name;
            console.log("W grze "+unm);
            //console.log(ses);
            //var name = ses.roomname;
            //var session = ses.session;
            
            socket.join(rnm+"_game");
            
            
            socket.emit('user_connected', {name:player[0], id:"p1" })
            socket.emit('user_connected', {name:player[1], id:"p2" })


            //io.to(roomname+"_game").emit('sbd entered',room.people);

        });

        socket.on('FieldClicked',function(msg){
           // console.log("Socket with id " + socket.client.id +" and name " + socket.request.session.name +  " clicked filed number " + msg);
            var rnm = socket.request.session.roomEntered;
            if(state[msg] == 0 && !end){
                if(player[turn%2] == socket.request.session.name){
                    io.to(rnm+"_game").emit('change',[msg,turn%2]);
                    state[msg] = turn%2 + 1;
                    turn++;
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
                        state = [0,0,0,0,0,0,0,0,0]; //dla jednej gry
                        player = [undefined, undefined];
                        io.to(rnm+"_game").emit('won', socket.request.session.name);
                        
                        end = 1;
                    }
                }
            }

        });

        socket.on('reset', function(msg){
            var rnm = socket.request.session.roomEntered;
            for(i=0; i<9; i++){
                io.to(rnm+"_game").emit('clear',i) //bez sensu, bo nie pyta o zgodę
                state[i] = 0; //i tak nie starczy chyba do nowej gry??
            }
            end = 0;
        });


        socket.on('disconnect', function(){
                console.log('A socket with sessionID ' + socket.client.id + ' disconnected!');
                //check if disconnected user was a player(and is not having any kind of shit)
        });
       // console.log(socket.request.session.name);
    });


    return router;
}

module.exports = returnRouter;

