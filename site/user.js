
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

router.get('/', (req,res) =>{
    res.redirect("/rooms");
});

router.all('/enter', (req,res) =>{
    //TODO check if valid pwd etc
    req.session.entered = 1;
    req.session.name = req.body.name;
    req.session.guest = 0;
    res.redirect("/rooms");
});

router.all('/create', (req,res) =>{
    //TODO check if not colliding data, pwd==pwd2 etc
    req.session.entered = 1;
    req.session.name = req.body.name;
    req.session.guest = 0;
    res.redirect('/rooms');
    
});

module.exports = router;