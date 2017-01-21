var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');//mozna spróbować szyfrować
var session = require('express-session');
var FileStore = require('session-file-store')(session);
 

var app = express();


app.set('view engine', 'ejs');
app.set('views', './views');

app.use( bodyParser.urlencoded({extended:true}) ) ;
app.use( express.static('./static'));
app.use( cookieParser() );

app.use(session({
    store: new FileStore,
    secret: 'keyboard cat',
    maxAge: 60000
}));


app.get("/", (req, res) =>{
    if(req.session.logged)
    {
        model = {
            nick: req.session.name,
        };

        res.render('roomView.ejs',model)
    }
    else
        res.render("index.ejs");

});

app.post("/",(req,res)=>{
    console.log(req.session);
    req.session.destroy();
    res.redirect('/');
});



app.get("/guest",(req,res) =>{

    if(req.session.logged)
        res.redirect('/');
    else
        res.render("guestlogin.ejs");
});

app.post("/guest",(req,res)=>{
    //check if avaialable nick
    req.session.logged = 1;
    req.session.name = req.body.nick;
    req.session.guest = 1;
    res.redirect('/');
});


app.get('/register', (req,res) =>{
    res.render('register.ejs');
});

app.get('/login', (req,res) =>{
    res.render('login.ejs');    
});



app.get('/test', function (req, res) {
  if (req.session.views) {
    req.session.views++;
    res.setHeader('Content-Type', 'text/html');
    res.write('<p>views: ' + req.session.views + '</p>');
    res.end();
  } else {
    req.session.views = 1;
    res.end('Welcome to the file session demo. Refresh page!');
  }
});


app.use((req,res,next) => {

    res.render('404.ejs', { url : req.url });

});



var server = http.createServer(app).listen(process.env.PORT || 3000);

console.log( 'server started' );




