var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');//mozna spróbować szyfrować
var session = require('express-session');
var FileStore = require('session-file-store')(session);
 

var app = express();
var server = http.createServer(app);




app.set('view engine', 'ejs');
app.set('views', './views');

app.use( bodyParser.urlencoded({extended:true}) ) ;

app.use( cookieParser() );

app.use(session({
    store: new FileStore,
    secret: 'keyboard cat',
    maxAge: 60000
}));

app.use( express.static('./static'));

var guestRouter = require('./guest');
app.use('/guest', guestRouter);

var registerRouter = require('./register');
app.use('/register', registerRouter);

var roomsRouter = require('./rooms');
app.use('/rooms', roomsRouter);

var userRouter = require('./user');
app.use('/user', userRouter);

app.get("/", (req, res) =>{
    if(req.session.entered)
    {
        res.redirect("/rooms");
    }
    else
        res.render("index.ejs");

});

app.all("/logout",(req,res)=>{
   // console.log(req.session);
    req.session.destroy();
    res.redirect('/');
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



server.listen(process.env.PORT || 3000);

console.log( 'server started' );




