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

var guestz = new Map(); //czy wyżej zadziała

 router.get("/",(req,res) =>{
    if(req.session.entered)
        res.redirect('/rooms');
    else
        res.render("guestlogin.ejs");
});

router.post('/ajaxIsFree', (req,res) => {
    console.log("czyWolnyNick\n");
    
    var flag = true;
    var name = req.body.name;
    console.log(name+"\n");
    if (guestz.get(name) != undefined) flag = false;
    var resp = "";
    if (flag) resp="OK"; else resp="NO";
    console.log(resp+"\n");
    res.send(resp);
});

router.all("/enter",(req,res)=>{
    if(req.session.entered)
    {
        res.redirect("/");
        return;
    }
    var name = req.body.name;
    console.log("wchodzę\n");
    console.log(name+"\n");
    var flag = true;
    if (guestz.get(name) != undefined) flag = false;
    if (flag) {
        var newGuest = {
            name : req.body.name, //powielam, ale niech będzie
        };
        guestz.set(name,newGuest);
        req.session.entered = 1;
        req.session.name = req.body.name;
        req.session.guest = 1;
        res.redirect('/rooms');
    }
    else { res.redirect('/'); } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
});

router.all("/logout",(req,res)=>{
    if(!req.session.entered)
    {
        res.redirect("/");
        return;
    }
    var name = req.session.name;
    //console.log(req.session.entered + "    " + req.session.guest + "\n");
    if(req.session.entered==1 && req.session.guest==1) {
        //console.log(name+"!!!!\n");
        guestz.delete(name);
        req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
        res.redirect('/');
    }
    else{
        res.redirect('/');
    }
});

module.exports = router;