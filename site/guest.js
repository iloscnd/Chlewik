var http = require('http');
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę
//innych middleware jakoś nie muszę powielać

//sprawdzenie poziomu uprawnień - 
// !! UWAGA - w guest są 2 poziomy uprawnień - do tworzenia nic, niżej entered
//nie potrzebujemy sprawdzać przy / czy przypadkiem nie wszedł i do /rooms, bo w app jest przekierowanie głebiej na samym początku

var routerFun = function(guestz,id) {

    router.get("/",(req,res) =>{
        
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
            res.render("guestlogin.ejs");
            return; //a może by res.end()?
    });


    // !! tak naprawdę to dobrze by było ajaxom dodać przekazywanie jakiegoś dziekigo klucza, żeby użytkownik nie mógł ich robić
    router.post('/ajaxIsFree', (req,res) => {
        //console.log("czyWolnyNick\n");
        
        var flag = true;
        var name = req.body.name;
        //console.log(name+"\n");
        if (guestz.get(name) != undefined) flag = false;
        var resp = "";
        if (flag) resp="OK"; else resp="NO";
        //console.log(resp+"\n");
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        res.send(resp);
        return; //a może by res.end()?
    });

    router.all("/enter",(req,res)=>{
        if(req.session.legit.entered)
        {
            res.redirect("/"); // tak naprawdę rooms, ale wejdzie bo wchodzi głębiej
            return;
        }
        var name = req.body.name;
        //console.log("wchodzę\n");
        //console.log(name+"\n");
        var flag = true;
        if (guestz.get(name) != undefined) flag = false;
        if (flag) {
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
            var theID = id;
            ++id;
            var newGuest = {
                id : theID,
                name : req.body.name, //powielam, ale niech będzie
            };
            req.session.personID = theID;

            guestz.set(name,newGuest);
            req.session.legit.entered = 1;
            
            req.session.name = req.body.name;
            req.session.guest = 1;
            //console.log("CHCE WEJŚĆ");
            res.redirect('/rooms');
            return; //a może by res.end()?
        }
    else { /*console.log("JUŻ JEST");*/ res.redirect('/redirectDefault'); return; /*a może by res.end()?*/ } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
    });

    //trzeba guestz, więc w routerFun - dopeiro odtąd i tak mają być potrzebne uprawnienia, a nie wcześniej
    // !! to już część gdzie są wymagane uprawnienia - dzięki temu, że po tamtej, to tamte wcześniej są dostępne bez
    router.use('/', (req,res,next) => {

        
        //usuwanie nieaktualnych uprawnień, żeby nie próbowało przekierować i się nie pętliło - usuwamy tylko entered, bo resztę się i tak ustawi przy ponownym
        //uwaga na null pointer! - chyba się zatroszczyłem
        //trzeba usunąć też następne poziomy, bo już potem tam nie dotrze żeby je usunąć
        if( req.session.legit.entered && req.session.guest && guestz.get(req.session.name) == undefined) { /*console.log("usuwam że zalogowany");*/ delete req.session.legit.entered; delete req.session.legit.roomEntered; delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! 
        if ( req.session.legit.entered && req.session.guest) {
            var guest = guestz.get(req.session.name);
            if (guest != undefined && guest.id != req.session.personID) { /*console.log("usuwam że zalogowany");*/ delete req.session.legit.entered; delete req.session.legit.roomEntered; delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!!
        }
        //starczy wykasowywać tu w sprawdzaniu uprawnień te nieaktualne, też z ID

        var ses = req.session;
        if (!ses.legit.entered || !ses.guest) { 
            //console.log(ses.legit.entered+"WRACAM1");
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
        next();
    });

    router.all("/logout",(req,res)=>{
        
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        var name = req.session.name;
        //console.log(req.session.legit.entered + "    " + req.session.guest + "\n");
        if(req.session.legit.entered==1 && req.session.guest==1) { //if niepotrzebny jak sprawdzamy poziom uprawnień
            //console.log(name+"!!!!\n");
            guestz.delete(name);
            req.session.destroy(); 
            res.redirect('/');
            return; //a może by res.end()?
        }
        else{
            res.redirect('/');
            return; //a może by res.end()?
        }
    });

    return router;
}

module.exports = routerFun;