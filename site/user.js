
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę


//sprawdzenie poziomu uprawnień - tu są 2 poziomy tak samo jak w guest
// na początku bez uprawnień tak jak tam

router.all('/', (req,res) =>{
    //to nie jest potrzebne
    //res.redirect("/rooms"); //przekierowanie niezalogowanego na "/" jest w rooms
});

var userz = new Map(); //czy wyżej zadziałą

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

    if (flag) {
        req.session.legit.entered = 1;
        req.session.name = req.body.name;
        req.session.guest = 0;
        res.redirect("/rooms");
        return; //a może by res.end()?
    }
else { res.redirect('/redirectDefault'); return; /*a może by res.end()?*/ } //to jakby ktoś wklepał dane inaczej (wysłał straszliwy html np.) i nie przedzedł przez formularz sprawdzający
    //co prawda w ten sposób sprawdza się 2 razy :/
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
    if (userz.get(name) != undefined) flag = false;
    if (flag) {
        var newUser = {
            pwd : req.body.pwd
        };
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

// !!! tu już te do których trzeba być zalogowanym
router.use('/', (req,res,next) => {
    var ses = req.session;
    if (!ses.legit.entered) { 
        console.log(ses.legit.entered+"WRACAM2");
        res.redirect('/'); 
        return; 
    }
    req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
    next();
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

module.exports = router;