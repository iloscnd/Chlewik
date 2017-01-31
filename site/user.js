
var express = require('express');

var router = express.Router();
router.use( express.static('./static')); //muszę

var pg = require('pg');
pg.defaults.ssl = true;
            

//sprawdzenie poziomu uprawnień - tu są 2 poziomy tak samo jak w guest
// na początku bez uprawnień tak jak tam

var routerFun = function(userz) {

    router.all('/', (req,res) =>{
        //to nie jest potrzebne
        //res.redirect("/rooms"); //przekierowanie niezalogowanego na "/" jest w rooms
    });



    router.all('/enter', (req,res) =>{
        //TODO check if valid pwd etc
        /*if(req.session.legit.entered)
        {
            res.redirect("/rooms"); //musi być else ALBO return, bo inaczej dalej się wykonuje ta funkcja...
            return; 
            //res.end(); //to też próbuje coś zwracać po zakończeniu
        }*/
        var name = req.body.name;
        var pwd = req.body.pwd;
        console.log("wchodzę\n");
        var flag = false;
        //od razu że nie undefined i że jak trzeba - ale uwaga, bo bez .pwd to cały obiekt
        if (userz.get(name) != undefined &&  userz.get(name).pwd == pwd) flag = true;
        console.log("PIĘĆ"+JSON.stringify(req.session.legit));
        console.log(JSON.stringify(req.session.urlLegit));
    /*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

        pg.connect(process.env.DATABASE_URL, function(err, client) {
            if (err) throw err;
            console.log("connecteds");
            
            flag = false;

            var query = client.query( "SELECT pass FROM users WHERE name = '" + name + "';");
            
            query.on('row',function(row){
                flag = true;//znalazł
                if(row.pass != pwd)
                    flag = false;
                console.log(row);
            });
            query.on('end',function(){
                if (flag) {
                    req.session.legit.entered = 1;
                    req.session.name = req.body.name;
                    req.session.guest = 0;
                    res.redirect("/rooms");
                    return; //a może by res.end()?
                }
                else { res.redirect('/redirectDefault'); 
                    return; /*a może by res.end()?*/ 
                } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
                    //co prawda w ten sposób sprawdza się 2 razy :/
            });
        });
    });

    router.post('/create', (req,res) =>{
        //TODO check if not colliding data, pwd==pwd2 etc
        console.log("SZEŚĆ"+JSON.stringify(req.session.legit));
        console.log(JSON.stringify(req.session.urlLegit));   
    /*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        /*if(req.session.legit.entered)
        {
            res.redirect("/rooms"); //musi być else ALBO return, bo inaczej dalej się wykonuje ta funkcja...
            return; 
        }*/

        var flag = true;
        var name = req.body.name;
        console.log("zakładam\n");
        
        if (userz.get(name) != undefined)
            flag = false;
        
        pg.connect(process.env.DATABASE_URL, function(err, client) {
            if (err) throw err;
            console.log("connecteds");
            //spraw dź czy jest  w bazie
            var selectQuery = client.query( "SELECT name FROM users WHERE name = '" + name + "';");
            selectQuery.on('row',function(row){
                flag = false;
                console.log("read row");
            });

            selectQuery.on('end',function(){

                console.log("done");

                if (flag) {
                 
                    var newUser = {
                        pwd : req.body.pwd
                    };
                    userz.set(name,newUser);
                    req.session.legit.entered = 1;
                    req.session.name = req.body.name;
                    req.session.guest = 0;
                    var insertQuery = client.query( "INSERT INTO users (id, name, pass) VALUES (1, '" + name + "', '" + req.body.pwd + "');");
                    insertQuery.on('end',function(){
                        res.redirect('/rooms');
                        return; //a może by res.end()?
                    });
                    insertQuery.on('err',function(){
                        res.redirect('/rooms');
                        return; //a może by res.end()?
                    });
               }
                else { res.redirect('/redirectDefault');
                    return; /*a może by res.end()?*/
                } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
                
            });
        });


        

    });


    router.post('/ajaxIsFree', (req,res) => { //zmienić jakoś na post
    console.log("7"+JSON.stringify(req.session.legit));
    console.log(JSON.stringify(req.session.urlLegit));
    /*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        console.log("czyWolny\n");
        
        var flag = true;
        var name = req.body.name; //bo post
        console.log(name+"\n");
        if (userz.get(name) != undefined) flag = false;
        var resp = "";
        if (flag) resp="OK"; else resp="NO";
        console.log(resp+"\n");
        res.send(resp);
        return; //a może by res.end()?
    });

    router.post('/ajaxValid', (req,res) => { //zmienić jakoś na post
    console.log("8"+JSON.stringify(req.session.legit));
    console.log(JSON.stringify(req.session.urlLegit));
    /*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        console.log("czyDobre\n");
        var flag = true;
        var name = req.body.name; //z POST są w body a nie query
        var pwd = req.body.pwd;
        console.log(name+"\n");
        console.log(pwd+"\n");
        
        var resp = "";
        var getPwd ;
        if (userz.get(name) != undefined) getPwd = userz.get(name).pwd;
        //console.log(userz.get(name)+"\n");
        if(getPwd != undefined) {
            if (getPwd == pwd) resp = "OK"; else resp = "BAD";
            flag = false; 
        }
        if (flag) resp="BAD"; //było NOONE, ale nie powinien mówić które źle 
        console.log(resp+"\n");
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

    //trzeba userz, więc w routerFun - dopeiro odtąd i tak mają być potrzebne uprawnienia, a nie wcześniej
    // !!! tu już te do których trzeba być zalogowanym
    router.use('/', (req,res,next) => {

        console.log("W4"+JSON.stringify(req.session.legit));

        //usuwanie nieaktualnych uprawnień, żeby nie próbowało przekierować i się nie pętliło - usuwamy tylko entered, bo resztę się i tak ustawi przy ponownym
        //trzeba usunąć też następne poziomy, bo już potem tam nie dotrze żeby je usunąć
        if( req.session.legit.entered && userz.get(req.session.name) == undefined) { console.log("usuwam że zalogowany"); delete req.session.legit.entered; delete req.session.legit.roomEntered; delete req.session.legit.inGame; req.session.save(); } //B. WAŻNE!!! 

        var ses = req.session;
        if (!ses.legit.entered) { 
            console.log(ses.legit.entered+"WRACAM2");
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
        next();
    });

    router.all('/settings', (req,res) => { //przeszedł przez middleware, czyli uprawnienia są
        console.log("99"+JSON.stringify(req.session.legit));
    console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        var text = req.query.info;
        if (text == 'pwd') text = "zmieniono hasło";
        var model =  {
            info : text
        }
        res.render('settings.ejs', model); //chyba nie tzreba modelu
    });

    router.post('/change', (req,res) =>{
        //TODO check if not colliding data, pwd==pwd2 etc
    console.log("50"+JSON.stringify(req.session.legit));
    console.log(JSON.stringify(req.session.urlLegit));   
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        /*if(req.session.legit.entered)
        {
            res.redirect("/rooms"); //musi być else ALBO return, bo inaczej dalej się wykonuje ta funkcja...
            return; 
        }*/

        var flag = true;
        var name = req.session.name;
        console.log("zakładam\n");
        if (userz.get(name) == undefined) flag = false;
        if (flag) {
            var user = userz.get(name);
            user.pwd=req.body.newPwd;
            console.log("|||/////////////////////////////////zmieniam");
            //req.session.legit.entered = 1; //te już są ustawione
            //req.session.name = req.body.name;
            //req.session.guest = 0;
            res.redirect('/user/settings?info=pwd');
            return; //a może by res.end()?
        }
        else { res.redirect('/redirectDefault');return; /*a może by res.end()?*/ } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
        
    });

    router.all("/logout",(req,res)=>{
    console.log("9"+JSON.stringify(req.session.legit));
    console.log(JSON.stringify(req.session.urlLegit));
    /*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        /*if(!req.session.legit.entered)
        {
            res.redirect("/");
            return;
        }*/
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
    console.log("10"+JSON.stringify(req.session.legit));
    console.log(JSON.stringify(req.session.urlLegit));
    /*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        /*if(!req.session.legit.entered)
        {
            res.redirect("/");
            return;
        }*/
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