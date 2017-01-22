//test game check for socket.io
var express = require('express');
var router = express.Router();

router.use( express.static('./static'));



var returnRouter = function(io) {

    router.get('/', function(req, res){
        res.render('game.ejs');
    });

    io.on('connection', function(socket){
        console.log('connected');
        socket.on('chat message', function(msg){
            io.emit('chat message', msg);
        });
    });


    return router;
}

module.exports = returnRouter;

