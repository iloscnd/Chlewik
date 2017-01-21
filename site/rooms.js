
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

router.all('/', (req,res) =>{
    if(req.session.entered)
    {
        res.render('roomView.ejs',req.session);
    }
    res.redirect("/");
        
});

module.exports = router;