
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę, bo on dokleja z przodu url co mu zostało

var routerFun = function(roomz){

    router.all('/', (req,res) =>{
        var name = req.query.name;
        if(!req.session.entered)
        {
            res.redirect("/");
            return;
        }
        var model = {
            room : roomz.get(name)
        }
        res.render('inroom.ejs', model);
    });


    return router;
}

module.exports = routerFun;