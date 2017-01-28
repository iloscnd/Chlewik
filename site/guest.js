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

//sprawdzenie poziomu uprawnień - 
// !! UWAGA - w guest są 2 poziomy uprawnień - do tworzenia nic, niżej entered
//nie potrzebujemy sprawdzać przy / czy przypadkiem nie wszedł i do /rooms, bo w app jest przekierowanie głebiej na samym początku

var guestz = new Map(); //czy wyżej zadziała

router.get("/",(req,res) =>{
    //nie potrzebujemy sprawdzać przy / czy przypadkiem nie wszedł i do /rooms, bo w app jest przekierowanie głebiej
    //if(req.session.legit.entered)
    //    res.redirect('/rooms');
    //else
console.log("RAZ"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        res.render("guestlogin.ejs");
        return; //a może by res.end()?
});


// !! tak naprawdę to dobrze by było ajaxom dodać przekazywanie jakiegoś dziekigo klucza, żeby użytkownik nie mógł ich robić
router.post('/ajaxIsFree', (req,res) => {
    console.log("czyWolnyNick\n");
    
    var flag = true;
    var name = req.body.name;
    console.log(name+"\n");
    if (guestz.get(name) != undefined) flag = false;
    var resp = "";
    if (flag) resp="OK"; else resp="NO";
    console.log(resp+"\n");
console.log("DWA"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
    res.send(resp);
    return; //a może by res.end()?
});

router.all("/enter",(req,res)=>{
    if(req.session.legit.entered)
    {
        console.log('ojej');
        res.redirect("/"); // tak naprawdę rooms, ale wejdzie bo wchodzi głębiej
        return;
    }
    var name = req.body.name;
    console.log("wchodzę\n");
    console.log(name+"\n");
    var flag = true;
    if (guestz.get(name) != undefined) flag = false;
    if (flag) {
console.log("TRZY"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        var newGuest = {
            name : req.body.name, //powielam, ale niech będzie
        };
        guestz.set(name,newGuest);
        req.session.legit.entered = 1;
        req.session.name = req.body.name;
        req.session.guest = 1;
        console.log("CHCE WEJŚĆ");
        res.redirect('/rooms');
        return; //a może by res.end()?
    }
else { console.log("JUŻ JEST"); res.redirect('/redirectDefault'); return; /*a może by res.end()?*/ } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
});

// !! to już część gdzie są wymagane uprawnienia - dzięki temu, że po tamtej, to tamte wcześniej są dostępne bez
router.use('/', (req,res,next) => {
    var ses = req.session;
    if (!ses.legit.entered) { 
        console.log(ses.legit.entered+"WRACAM1");
        res.redirect('/'); 
        return; 
    }
    req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
    next();
});

router.all("/logout",(req,res)=>{
    /*if(!req.session.legit.entered)
    {
        res.redirect("/");
        return;
    }*/
console.log("CZTERY"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
    var name = req.session.name;
    //console.log(req.session.legit.entered + "    " + req.session.guest + "\n");
    if(req.session.legit.entered==1 && req.session.guest==1) { //if niepotrzebny jak sprawdzamy poziom uprawnień
        //console.log(name+"!!!!\n");
        guestz.delete(name);
        req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
        res.redirect('/');
        return; //a może by res.end()?
    }
    else{
        res.redirect('/');
        return; //a może by res.end()?
    }
});

module.exports = router;