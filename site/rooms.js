
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

var roomz = [];

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
    for (i=0; i<roomz.length; ++i) {
        console.log(name+"   "+roomz[i].name+"\n");
        if (roomz[i].name == name) {flag = false; break; }
    }
    var resp = "";
    if (flag) resp="OK"; else resp="NO";
    console.log(resp+"\n");
    res.send(resp);
});

router.post('/create', (req,res) => {
    //tu trzeba by sprawdzać czy ktoś nie jest już w pokoju
    var flag = true;
    for (i=0; i<roomz.length; ++i) {
        if (roomz[i].name == req.body.roomName) {flag = false; break; }
    }
    if (flag) {
        var newRoom = {
            name : req.body.roomName,
            pwd : req.body.pwd
        };
        roomz.push(newRoom);
    }
    var model = {
            ses : req.session,
            roomz : roomz
    }
    res.render('roomView.ejs', model);
});

router.use((req,res,next) => {

    res.render('404.ejs', { url : req.url });

});

module.exports = router;