
var express = require('express');

var router = express.Router();
router.use( express.static('./static')); //muszę

var pg = require('pg');
pg.defaults.ssl = true;

//sprawdzenie poziomu uprawnień - tu są 2 poziomy tak samo jak w guest
// na początku bez uprawnień tak jak tam

var client = new pg.Client(process.env.DATABASE_URL);

var routerFun = function(userz,id) {

    



    router.all('/enter', (req,res) =>{
        
        var name = req.body.name;
        var pwd = req.body.pwd;
        //console.log("wchodzę\n");
        var flag = false;
        //od razu że nie undefined i że jak trzeba - ale uwaga, bo bez .pwd to cały obiekt
        if (userz.get(name) != undefined &&  userz.get(name).pwd == pwd) flag = true;
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

        if (flag) {
            req.session.legit.entered = 1;
            req.session.name = name;

            req.session.personID = userz.get(name).id;

            req.session.guest = 0;
            res.redirect("/rooms");
            return; //a może by res.end()?
        }
    else { res.redirect('/redirectDefault'); return; /*a może by res.end()?*/ } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
        //co prawda w ten sposób sprawdza się 2 razy :/
    });

    router.post('/create', (req,res) =>{
        //TODO check if not colliding data, pwd==pwd2 etc
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        

        var flag = true;
        var name = req.body.name;
        //console.log("zakładam\n");
        if (userz.get(name) != undefined) flag = false;
        if (flag) {
            var theID = id;
            ++id;
            var newUser = {
                id : theID,
                name : name, //powielam, ale niech będzie
                pwd : req.body.pwd
            };
            req.session.personID = theID;
            
            userz.set(name,newUser);
            req.session.legit.entered = 1;
            req.session.name = req.body.name;
            req.session.guest = 0;
            res.redirect('/rooms');
            return; //a może by res.end()?
        }
        else { res.redirect('/redirectDefault');return; /*a może by res.end()?*/ } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
        
    });


    router.post('/ajaxIsFree', (req,res) => { //zmienić jakoś na post
    
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //console.log("czyWolny\n");
        
        var flag = true;
        var name = req.body.name; //bo post
        //console.log(name+"\n");
        client.connect();
            
        //if (err) throw err;
        
        console.log('Connected to postgres on ajaxIsFree');

        var query = client.query( "SELECT name FROM users WHERE name = '" + name + "';",function(err, result){
            if (err)
                console.log(err);
            
            console.log(name);
            console.log(result);

            res.send("NO");
            return; //a może by res.end()?

        });
/*using users
        if (userz.get(name) != undefined) flag = false;
        var resp = "";
        if (flag) resp="OK"; else resp="NO";
        //console.log(resp+"\n");
        res.send(resp);
        return; //a może by res.end()?
*/    
    });

    router.post('/ajaxValid', (req,res) => { //zmienić jakoś na post
        
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //console.log("czyDobre\n");
        var flag = true;
        var name = req.body.name; //z POST są w body a nie query
        var pwd = req.body.pwd;
        //console.log(name+"\n");
        //console.log(pwd+"\n");
        
        var resp = "";
        var getPwd ;
        if (userz.get(name) != undefined) getPwd = userz.get(name).pwd;
        //console.log(userz.get(name)+"\n");
        if(getPwd != undefined) {
            if (getPwd == pwd) resp = "OK"; else resp = "BAD";
            flag = false; 
        }
        if (flag) resp="BAD"; //było NOONE, ale nie powinien mówić które źle 
        //console.log(resp+"\n");
        res.send(resp);
        return; //a może by res.end()?
    });

    router.post('/ajaxPwd', (req,res) => {
        var name = req.session.name; //z POST są w body a nie query
        var pwd = req.body.pwd;
        var getPwd ;
        var resp = "";
        if (userz.get(name) != undefined) getPwd = userz.get(name).pwd;
        if (getPwd!= undefined && getPwd == pwd) resp = "OK"; else resp = "BAD";
        res.send(resp);
        return; //a może by res.end()?
    });

    //trzeba userz, więc w routerFun - dopiero odtąd i tak mają być potrzebne uprawnienia, a nie wcześniej
    // !!! tu już te do których trzeba być zalogowanym
    router.use('/', (req,res,next) => {

        
        //usuwanie nieaktualnych uprawnień, żeby nie próbowało przekierować i się nie pętliło - usuwamy tylko entered, bo resztę się i tak ustawi przy ponownym
        //trzeba usunąć też następne poziomy, bo już potem tam nie dotrze żeby je usunąć
        if( req.session.legit.entered && !req.session.guest && userz.get(req.session.name) == undefined) { /*console.log("usuwam że zalogowany");*/ delete req.session.legit.entered; delete req.session.legit.roomEntered; delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! 
        if ( req.session.legit.entered && !req.session.guest) {
            var user = userz.get(req.session.name);
            if (user != undefined && user.id != req.session.personID) { /*console.log("usuwam że zalogowany");*/ delete req.session.legit.entered; delete req.session.legit.roomEntered; delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!!
        }
        //starczy wykasowywać tu w sprawdzaniu uprawnień te nieaktualne, też z ID
        

        var ses = req.session;
        if (!ses.legit.entered || ses.guest) { 
            //console.log(ses.legit.entered+"WRACAM2");
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
        next();
    });

    router.all('/settings', (req,res) => { //przeszedł przez middleware, czyli uprawnienia są
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        var text = req.query.info;
        if (text == 'pwd') text = "zmieniono hasło";
        var model =  {
            info : text
        }
        res.render('settings.ejs', model); //chyba nie tzreba modelu
    });

    router.post('/change', (req,res) =>{
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        

        var flag = true;
        var name = req.session.name;
        //console.log("zakładam\n");
        if (userz.get(name) == undefined) flag = false;
        if (flag) {
            var user = userz.get(name);
            user.pwd=req.body.newPwd;
            //console.log("|||/////////////////////////////////zmieniam");
            
            res.redirect('/user/settings?info=pwd');
            return; //a może by res.end()?
        }
        else { res.redirect('/redirectDefault');return; /*a może by res.end()?*/ } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
        
    });

    router.all("/logout",(req,res)=>{
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        
        var name = req.session.name;
        if(req.session.legit.entered==1 && req.session.guest!=1) {
            req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
            res.redirect('/');
            return; //a może by res.end()?
        }
        else{
            res.redirect('/');
            return; //a może by res.end()?
        }
    });

    router.all("/delete",(req,res)=>{
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        
        var name = req.session.name;
        if(req.session.legit.entered==1 && req.session.guest!=1) {
            userz.delete(name);
            req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
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