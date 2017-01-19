var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');//mozna spróbować szyfrować

var app = express();


app.set('view engine', 'ejs');
app.set('views', './views');

app.use( bodyParser.urlencoded({extended:true}) ) ;
app.use( express.static('./static'));
app.use( cookieParser() );


app.get("/", (req, res) =>{

    res.render("index.ejs");

});


app.use((req,res,next) => {

    res.render('404.ejs', { url : req.url });

});



var server = http.createServer(app).listen(process.env.PORT || 3000);

console.log( 'serwer started' );







