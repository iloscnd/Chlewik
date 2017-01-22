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

var guestz = []; //na razie nie usuwam przy wyjściu i nie można na drugiego gościa z taką samą nazwą po wylogowaniu

 router.get("/",(req,res) =>{

    if(req.session.logged)
        res.redirect('/rooms');
    else
        res.render("guestlogin.ejs");
});

router.get('/ajaxIsFree', (req,res) => {
    console.log("czyWolnyNick\n");
    
    var flag = true;
    var name = req.query.name;
    console.log(name+"\n");
    for (i=0; i<guestz.length; ++i) {
        console.log(name+"   "+guestz[i].name+"\n");
        if (guestz[i].name == name) {flag = false; break; }
    }
    var resp = "";
    if (flag) resp="OK"; else resp="NO";
    console.log(resp+"\n");
    res.send(resp);
});

router.all("/enter",(req,res)=>{
    var name = req.body.name;
    console.log("wchodzę\n");
    console.log(name+"\n");
    var flag = true;
    for (i=0; i<guestz.length; ++i) {
        console.log(name+"   "+guestz[i].name+"\n");
        if (guestz[i].name == name) {flag = false; break; }
    }
    if (flag) {
        var newGuest = {
            name : req.body.name,
        };
        guestz.push(newGuest);
        req.session.entered = 1;
        req.session.name = req.body.name;
        req.session.guest = 1;
        res.redirect('/rooms');
    }
    else { res.redirect('/'); } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
});

module.exports = router;