var http = require('http');
var express = require('express');
/*
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');//mozna spróbować szyfrować
var session = require('express-session');
var FileStore = require('session-file-store')(session);
 */
 var router = express.Router();
 router.use( express.static('./static')); //muszę

//innych middleware jakoś nie muszę powielać

 router.get("/",(req,res) =>{

    if(req.session.logged)
        res.redirect('/rooms');
    else
        res.render("guestlogin.ejs");
});

router.post("/enter",(req,res)=>{
    //TODO check if avaialable nick
    req.session.entered = 1;
    req.session.name = req.body.nick;
    req.session.guest = 1;
    res.redirect('/');
});

module.exports = router;