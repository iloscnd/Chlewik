
var express = require('express');

var router = express.Router();
router.use( express.static('./static')); //muszę

var pg = require('pg');
pg.defaults.ssl = true;

//sprawdzenie poziomu uprawnień - tu są 2 poziomy tak samo jak w guest
// na początku bez uprawnień tak jak tam

var client = new pg.Client(process.env.DATABASE_URL);

client.connect();


var routerFun = function(userz,id) {

    



    router.all('/enter', (req,res) =>{
        
        var name = req.body.name;
        var pwd = req.body.pwd;
        //console.log("wchodzę\n");
        var flag = false;
        //od razu że nie undefined i że jak trzeba - ale uwaga, bo bez .pwd to cały obiekt
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

        var query = client.query( "SELECT pass, id FROM users WHERE name = '" + name + "';",function(err, result){
            if (err)
                console.log(err);
            console.log(result);
            
            if(!result){
                res.redirect('/redirectDefault');
                 return;
            }
            else {
                console.log(result)
                if(result.rowCount==0){
                    res.redirect('/redirectDefault');
                    return;
                }
                else
                    if(result.rows[0].pass == pwd){

                        req.session.legit.entered = 1;
                        req.session.name = name;
                        req.session.personID = result.rows[0].id;
                        req.session.guest = 0;
                        res.redirect("/rooms");

                        return;
                    }
                    else{
                       res.redirect('/redirectDefault');
                        return;
                    }
            }
            return; //a może by res.end()?           
        });

    });

    router.post('/create', (req,res) =>{
        //TODO check if not colliding data, pwd==pwd2 etc
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        

        var flag = true;
        var name = req.body.name;
        var pwd = req.body.pwd;

        var query = client.query( "SELECT name FROM users WHERE name = '" + name + "';",function(err, result){
            if (err)
                console.log(err);
            
            if(!result) { 
                res.redirect('/redirectDefault');
                return;
            }
            else if(result.rowCount==0){
                var theID = id;
                ++id;
                var newUser = {
                    id : theID,
                    name : name, //powielam, ale niech będzie
                    pwd : pwd
                };
               
                
                client.query( "INSERT INTO users (id, name, pass) VALUES (" + theID + ", '" + name + "', '" + req.body.pwd + "');",function(Ierr, Iresult){
                    if (Ierr)
                        console.log(Ierr);
                    
                    console.log(Iresult);
                    req.session.personID = theID;
                    req.session.legit.entered = 1;
                    req.session.name = req.body.name;
                    req.session.guest = 0;
                    res.redirect('/rooms');
                });
                return;  
            }
            else{ 
                res.redirect('/redirectDefault');
                return;
            }            
        });


        //console.log("zakładam\n");
        });


    router.post('/ajaxIsFree', (req,res) => { //zmienić jakoś na post
    
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //console.log("czyWolny\n");
        
        var flag = true;
        var name = req.body.name; //bo post
        //console.log(name+"\n");
            
        //if (err) throw err;
        

        var query = client.query( "SELECT name FROM users WHERE name = '" + name + "';",function(err, result){
            if (err)
                console.log(err);
            
            if(!result)
                res.send("NO");
            else if(result.rowCount==0)
                res.send("OK");
            else
                res.send("NO");
            return; //a może by res.end()?           
        });
 
    });

    router.post('/ajaxValid', (req,res) => { //zmienić jakoś na post
        
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //console.log("czyDobre\n");
        var name = req.body.name; //z POST są w body a nie query
        var pwd = req.body.pwd;
        //console.log(name+"\n");
        //console.log(pwd+"\n");
        
        var resp = "";
        var getPwd ;
   
        var query = client.query( "SELECT pass FROM users WHERE name = '" + name + "';",function(err, result){
            if (err)
                console.log(err);
            console.log("SELECT pass FROM users WHERE name = '" + name + "';");
            
            if(!result)
                res.send("BAD");
            else {
                console.log(result)
                if(result.rowCount==0)
                    res.send("BAD");
                else
                    if(result.rows[0].pass == pwd)
                        res.send("OK");
                    else
                        res.send("BAD");
            }
            return; //a może by res.end()?           
        });
    });

    router.post('/ajaxPwd', (req,res) => {
        var name = req.session.name; //z POST są w body a nie query
        var pwd = req.body.pwd;
        var resp = "";
        var getPwd ;
   
        var query = client.query( "SELECT pass FROM users WHERE name = '" + name + "';",function(err, result){
            if (err)
                console.log(err);
            console.log("SELECT pass FROM users WHERE name = '" + name + "';");
            
            if(!result)
                res.send("BAD");
            else {
                console.log(result)
                if(result.rowCount==0)
                    res.send("BAD");
                else
                    if(result.rows[0].pass == pwd)
                        res.send("OK");
                    else
                        res.send("BAD");
            }
            return; //a może by res.end()?           
        });
    });

    //trzeba usersz, więc w routerFun - dopiero odtąd i tak mają być potrzebne uprawnienia, a nie wcześniej
    // !!! tu już te do których trzeba być zalogowanym
    router.use('/', (req,res,next) => {

        if(!req.session.guest){

            client.query( "SELECT id FROM users WHERE name = '" + req.session.name + "';",function(err, result){
                if(err)
                    console.log(err);
                
                console.log(result);
                if(!result) { /*console.log("usuwam że zalogowany");*/ 
                    delete req.session.legit.entered; 
                    delete req.session.legit.roomEntered; 
                    delete req.session.legit.inGame; 
                    req.session.save(); 
                }

                else if( req.session.legit.entered && !req.session.guest && result.rowCount == 0) { /*console.log("usuwam że zalogowany");*/ 
                    delete req.session.legit.entered; 
                    delete req.session.legit.roomEntered; 
                    delete req.session.legit.inGame; 
                    req.session.save(); 
                } //B. WAŻNE!!! 
                
                else if ( req.session.legit.entered && !req.session.guest) {
                    if (result.rowCount != 0 && result.rows[0].id != req.session.personID) { /*console.log("usuwam że zalogowany");*/ 
                        delete req.session.legit.entered; 
                        delete req.session.legit.roomEntered; 
                        delete req.session.legit.inGame; 
                        req.session.save(); 
                    } //B. WAŻNE!!!
                }

                var ses = req.session;
                if (!ses.legit.entered) { 
                    //console.log(ses.legit.entered+"WRACAM3");
                    res.redirect('/'); 
                    return; 
                }

                req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
                
                next();
            });
        }
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
        

        //var flag = true;
        var name = req.session.name;
        //console.log("zakładam\n");
        //if (userz.get(name) == undefined) flag = false;
        client.query("SELECT id FROM users WHERE name = '" + req.session.name + "';",function(err, result){
            if(Uerr)
                console.log(Uerr);
            console.log(Uresult);
            
            //var user = userz.get(name);
            //user.pwd=req.body.newPwd;
            //console.log("|||/////////////////////////////////zmieniam");
            
            if(result && result.rowCount != 0){
                client.query("UPDATE users SET City='" + req.body.newPwd + "' WHERE name = '" + name + "';", function(Uerr,Uresult){
                    if(Uerr)
                        console.log(Uerr);
                    console.log(Uresult);
                });

                res.redirect('/user/settings?info=pwd');
                return; //a może by res.end()?
            }
            else { 
                res.redirect('/redirectDefault');
                return; /*a może by res.end()?*/ 
            } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
        
        });
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
            client.query("DELETE FROM users WHERE name = '"+ name + "';",function(err,result){
                if(err)
                    console.log(err);
                console.log(result);
            });
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