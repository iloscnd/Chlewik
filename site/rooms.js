
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

var roomz = new Map(); //czy wyżej zadziała

//sprawdzenie poziomu uprawnień - 
//starczy sprawdzić najgłębszy, bo przekierujemy na '/' a ono przekieruje najglębiej gdzie wolno i być powinien
//i tak by starczyło, bo je przechodzi po kolei
//!!! można by też sprawdzać po kolei od najpłytszego i przekierowywać na poprzedni, wtedy mniej zapytań
router.use('/', (req,res,next) => {
    var ses = req.session;
    if (!ses.legit.entered) { 
        res.redirect('/'); 
        return; 
    }
    req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
    next();
});

//B. WAŻNE!!! jak ktoś usunie pokój jak ten nie połączony
//z grą zrobić tak samo
router.use('/', (req,res,next) => {
    if( req.session.legit == undefined || roomz.get(req.session.legit.roomEntered) == undefined) delete req.session.legit.roomEntered; //B. WAŻNE!!! jak ktoś usunie pokój jak ten nie połączony
    next();
});

var routerFun = function(io) {

    
    var inroomRouter = require('./inroom')(roomz,io);
    router.use('/room', inroomRouter);
    
    router.all('/', (req,res) =>{
console.log(JSON.stringify(req.session.legit) + "NO HEJ");
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

        var err = req.query.err;
        var errWhat;
        console.log("tu jestem");
        console.log(err);
        if (err == "pwd") { console.log("WIDZĘ ZŁE HASŁO"); errWhat = "pwd";}
        else if (err == "crowded") { console.log("WIDZĘ PEŁEN"); errWhat = "crowded"; }
        else errWhat = "";
        /*if(!req.session.legit.entered)
        {
            console.log("NO HEJ");
            res.redirect("/");
        }
        else { */
            var model = {
                ses : req.session,
                roomz : roomz,
                error : errWhat
            }
            res.render('roomView.ejs',model);
        //}
    });

    router.all('/leave', (req,res) => {
        console.log("I CZEMU NIE USUWASZ");
        delete req.session.legit.roomEntered;
        res.redirect('/rooms');
    });

     //bez sensu..., że muszę pytać w tę i z powrotem jak chcę tylko wyświetlić wiem co
    router.all('/ajaxFormNew', (req,res) => {
console.log(JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //console.log("widzę\n");
        res.send("napis");
    });
    

    router.post('/ajaxIsName', (req,res) => {
console.log(JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        var flag = true;
        var name = req.body.name; //bo post
        console.log("poszło\n");
        if (roomz.get(name) != undefined) flag = false;
        var resp = "";
        if (flag) resp="OK"; else resp="NO";
        console.log(resp+"\n");
        res.send(resp);
    });

    router.post('/create', (req,res) => {
console.log(JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //tu trzeba by sprawdzać czy ktoś nie jest już w pokoju
        var flag = true;
        var name = req.body.roomName;
        if (roomz.get(name) != undefined) flag = false;
        req.session.roomPwd = req.body.pwd; //?
        req.session.legit.roomEntered = name;
        if (flag) {
            var pwdTrimmed = req.body.pwd.trim();
            var flag = (!(pwdTrimmed.length == 0))
            var newRoom = {
                name : req.body.roomName,
                pwd : req.body.pwd,
                hasPwd : flag,
                people : 0, //socket ogarnia liczby
                unready : new Map(),
                ready : new Map()
            };
            roomz.set(name,newRoom);
        }
        res.redirect('/rooms/room/'+'?roomName='+name);
        //res.redirect('/rooms/room=') //docelowo jakoś tak
    });

    router.post('/setSessionPwd', (req,res) => { //post; chyba niepotrzebne
console.log(JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

        var name = req.query.name;
        var pwd = req.body.roomPwd;
        req.session.roomPwd = pwd;
        req.session.legit.roomEntered = name;
        res.redirect('/rooms/room/'+'?roomName='+name);
    });

    router.all("/logout",(req,res)=>{
console.log(JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        // console.log(req.session);
        /*if(!req.session.legit.entered)
        {
             res.redirect("/");
        }*/
        //else{ 
            delete req.session.legit.entered; //bez tego przekieruje z powrotem
            if (req.session.guest==1) res.redirect('/guest/logout');
            else res.redirect('/user/logout'); //bez else się rzuca "can't set headers after they are sent"
            //req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
            //res.redirect('/');
        //}
    }); 

    return router;
}

//PO WYJŚCIU Z POKOJU CZASEM POKAZUJE ŻE ISTNIEJE, BO NIE ZDĄŻY MU ZMIENIĆ - w chrome, w firefox nie

module.exports = routerFun;