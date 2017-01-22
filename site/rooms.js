
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

router.get('/ajaxFormNew', (req,res) => {
    //console.log("widzę\n");
    res.send("napis");
});

router.post('/create', (req,res) => {
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



module.exports = router;