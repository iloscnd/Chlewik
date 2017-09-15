var http = require('http');
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); 


var routerFun = function(guestz,id) {

    router.get("/",(req,res) =>{
        
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
            res.redirect('/redirectDefault');
            return; 
        }
        
        res.render("guestlogin.ejs");
        return; 
        
    });



    router.post('/ajaxIsFree', (req,res) => {
        
        var flag = true;
        var name = req.body.name;

        if (guestz.get(name) != undefined) flag = false;
        var resp = "";
        if (flag) resp="OK"; else resp="NO";

        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
            res.redirect('/redirectDefault');
            return;     
        }

        res.send(resp);
        return; 
    });

    router.all("/enter",(req,res)=>{

        if(req.session.legit.entered)
        {
            res.redirect("/"); 
            return;
        }

        var name = req.body.name;
        var flag = true;
        
        if (guestz.get(name) != undefined) 
            flag = false;
        
        if (flag) {
                
            if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
                res.redirect('/redirectDefault'); 
                return; 
            }

            var theID = id;
            ++id;
            
            var newGuest = {
                id : theID,
                name : req.body.name, 
            };

            req.session.personID = theID;

            guestz.set(name,newGuest);
            req.session.legit.entered = 1;
            
            req.session.name = req.body.name;
            req.session.guest = 1;
            
            res.redirect('/rooms');
            return; 
        }
        else { 
            res.redirect('/redirectDefault'); 
            return;
        }
    });

    router.use('/', (req,res,next) => {

        
        if( req.session.legit.entered && req.session.guest && guestz.get(req.session.name) == undefined) { 
            delete req.session.legit.entered; delete req.session.legit.roomEntered; 
            delete req.session.legit.inGame; 
            req.session.save(); 
        } 
        if ( req.session.legit.entered && req.session.guest) {
            var guest = guestz.get(req.session.name);

            if (guest != undefined && guest.id != req.session.personID) { 
                delete req.session.legit.entered;
                delete req.session.legit.roomEntered; 
                delete req.session.legit.inGame; 
                req.session.save(); 
            }
        }


        if (!req.session.legit.entered || !req.session.guest) { 
            res.redirect('/'); 
            return; 
        }
        req.session.urlLegit.entered = req.session.legit.entered;
        next();
    });

    router.all("/logout",(req,res)=>{
        
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        var name = req.session.name;

        if(req.session.legit.entered==1 && req.session.guest==1) {

            guestz.delete(name);
            req.session.destroy(); 
            res.redirect('/');
            return;
        }
        else{
            res.redirect('/');
            return; 
        }
    });

    return router;
}

module.exports = routerFun;