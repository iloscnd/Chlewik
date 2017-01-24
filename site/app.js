var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');//mozna spróbować szyfrować
var session = require('express-session');
var FileStore = require('session-file-store')(session);
 

var app = express();
var server = http.createServer(app);

var io = require('socket.io')(server)





//io.use(function(socket,next){
//    session(socket.request, socket.request.res, next);
//});



app.set('view engine', 'ejs');
app.set('views', './views');

app.use( bodyParser.urlencoded({extended:true}) ) ;

app.use( cookieParser() );

var sessionMid = session({
    //store: new FileStore(), //TO PSUŁO I GENEROWAŁO PORYPANE BŁĘDY JAK BYŁO BEZ () (...)
    secret: 'keyboard cat',
    maxAge: 60000
});
io.use(function(socket, next){
    sessionMid(socket.request, socket.request.res, next); //wtedy moge sie dostac do sesji w socket
});
app.use(sessionMid);

app.use( express.static('./static'));

var guestRouter = require('./guest');
app.use('/guest', guestRouter);

var registerRouter = require('./register');
app.use('/register', registerRouter);

var roomsRouter = require('./rooms')(io);
app.use('/rooms', roomsRouter);

var userRouter = require('./user');
app.use('/user', userRouter);

var gameRouter = require('./game')(io);
app.use('/game',gameRouter);

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
   if(!req.session.entered)
    {
        res.redirect("/");
    }
   else if(req.session.guest==1) res.redirect('/guest/logout');
   else res.redirect('/user/logout'); //bez else się rzuca "can't set headers after they are sent"
    //req.session.destroy(); //TO NIE DZIAŁA - DA SIĘ COFNĄĆ I WEJŚĆ
    //res.redirect('/');
}); 



/*

app.get('/login', (req,res) =>{
    res.render('login.ejs');    
});

*/

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




