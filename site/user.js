
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

router.get('/', (req,res) =>{
    res.redirect("/rooms");
});

var userz = new Map();

router.all('/enter', (req,res) =>{
    //TODO check if valid pwd etc

    var name = req.body.name;
    var pwd = req.body.pwd;
    console.log("wchodzę\n");
    var flag = false;
    //od razu że nie undefined i że jak trzeba - ale uwaga, bo bez .pwd to cały obiekt
    if (userz.get(name) != undefined &&  userz.get(name).pwd == pwd) flag = true;
    if (flag) {
        req.session.entered = 1;
        req.session.name = req.body.name;
        req.session.guest = 0;
        res.redirect("/rooms");
    }
    else { res.redirect('/'); } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
    //co prawda w ten sposób sprawdza się 2 razy :/
});

router.all('/create', (req,res) =>{
    //TODO check if not colliding data, pwd==pwd2 etc



    var flag = true;
    var name = req.body.name;
    console.log("zakładam\n");
    if (userz.get(name) != undefined) flag = false;
    if (flag) {
        var newUser = {
            pwd : req.body.pwd
        };
        userz.set(name,newUser);
        req.session.entered = 1;
        req.session.name = req.body.name;
        req.session.guest = 0;
        res.redirect('/rooms');
    }
    else { res.redirect('/'); } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
    
});


router.get('/ajaxIsFree', (req,res) => { //zmienić jakoś na post
    console.log("czyWolny\n");
    
    var flag = true;
    var name = req.query.name;
    console.log(name+"\n");
    if (userz.get(name) != undefined) flag = false;
    var resp = "";
    if (flag) resp="OK"; else resp="NO";
    console.log(resp+"\n");
    res.send(resp);
});

router.get('/ajaxValid', (req,res) => { //zmienić jakoś na post
    console.log("czyDobre\n");
    var flag = true;
    var name = req.query.name;
    var pwd = req.query.pwd;
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
    if (flag) resp="NOONE"; 
    console.log(resp+"\n");
    res.send(resp);
});


router.all("/logout",(req,res)=>{
    var name = req.body.name;
    if(req.session.entered==1 && req.session.guest!=1) {
        req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
        res.redirect('/');
    }
    else{
        res.redirect('/');
    }
});

router.all("/delete",(req,res)=>{
    var name = req.session.name;
    if(req.session.entered==1 && req.session.guest!=1) {
        userz.delete(name);
        req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
        res.redirect('/');
    }
    else{
        res.redirect('/');
    }
});

module.exports = router;