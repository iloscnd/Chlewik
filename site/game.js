//test game check for socket.io
var express = require('express');
var router = express.Router();

router.use( express.static('./static'));



var returnRouter = function(io,session) {

    router.get('/', function(req, res){
        if(!req.session.entered)
        {
            res.redirect("/");
        }
        else
            res.render('game.ejs');
    });



    io.use(function(socket, next){
        session(socket.request, socket.request.res, next); //wtedy moge sie dostac do sesji w socket
    });


    io.on('connection', function(socket){
       // console.log(socket);
        console.log('A socket with sessionID ' + socket.client.id + ' connected!');

        socket.on('FieldClicked',function(msg){
            console.log("Socket with id " + socket.client.id + " clicked filed number " + msg);
        });

        socket.on('disconnect', function(){
                console.log('A socket with sessionID ' + socket.client.id + ' disconnected!');
                
        });
        console.log(socket.request.session.name);
    });


    return router;
}

module.exports = returnRouter;

