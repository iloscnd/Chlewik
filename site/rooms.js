
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

var roomz = new Map(); //czy wyżej zadziała

var inroomRouter = require('./inroom')(roomz);
router.use('/room', inroomRouter);

router.all('/', (req,res) =>{
    if(!req.session.entered)
    {
        res.redirect("/");
    }
    else {
        var model = {
            ses : req.session,
            roomz : roomz
        }
        res.render('roomView.ejs',model);
    }
});

router.post('/ajaxFormNew', (req,res) => {
    //console.log("widzę\n");
    res.send("napis");
});

router.post('/ajaxIsName', (req,res) => {
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
    //tu trzeba by sprawdzać czy ktoś nie jest już w pokoju
    var flag = true;
    var name = req.body.roomName;
    if (roomz.get(name) != undefined) flag = false;
    if (flag) {
        var pwdTrimmed = req.body.pwd.trim();
        var flag = (!(pwdTrimmed.length == 0))
        var newRoom = {
            name : req.body.roomName,
            pwd : req.body.pwd,
            hasPwd : flag
        };
        roomz.set(name,newRoom);
    }
    res.redirect('/rooms/room/'+'?name='+name);
    //res.redirect('/rooms/room=') //docelowo jakoś tak
});



module.exports = router;