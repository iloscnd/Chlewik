

var http = require('http');
var express = require('express');

var app = express();

app.set('view engine', 'ejs');
app.set('views', './views');


app.get("/", (req, res) =>{

    res.render(index.ejs);

});


app.use((req,res,next) => {

    res.render('404.ejs', { url : req.url });

});



var server = http.createServer(app).listen(process.env.PORT || 3000);

console.log( 'serwer started' );







