
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

router.get('/', (req,res) =>{
    res.redirect("/rooms");
});

var userz = [];

router.all('/enter', (req,res) =>{
    //TODO check if valid pwd etc

    var name = req.body.name;
    var name = req.body.pwd;
    console.log("wchodzę\n");
    var flag = false;
    for (i=0; i<userz.length; ++i) {
        if (userz[i].name == name && userz[i].pwd == pwd) {flag = true; break; }
    }
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
    for (i=0; i<userz.length; ++i) {
        if (userz[i].name == name) {flag = false; break; }
    }
    if (flag) {
        var newUser = {
            name : req.body.name,
            pwd : req.body.pwd
        };
        userz.push(newUser);
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
    for (i=0; i<userz.length; ++i) {
        console.log(name+"   "+userz[i].name+"\n");
        if (userz[i].name == name) {flag = false; break; }
    }
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
    for (i=0; i<userz.length; ++i) {
        console.log(name+"   "+userz[i].name+"\n");
        if (userz[i].name == name) {
            if (userz[i].pwd == pwd) resp = "OK"; else resp = "BAD";
            flag = false; 
            break; 
        }
    }
    if (flag) resp="NOONE"; 
    console.log(resp+"\n");
    res.send(resp);
});

module.exports = router;