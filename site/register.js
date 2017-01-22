
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę, bo on dokleja z przodu url co mu zostało

router.get('/', (req,res) =>{
    res.render('register.ejs');
});

module.exports = router;