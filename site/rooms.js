
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

router.all('/', (req,res) =>{
    if(!req.session.entered)
    {
        res.redirect("/");
    }
    else
        res.render('roomView.ejs',req.session);
});

module.exports = router;