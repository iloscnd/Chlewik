var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session')
var FileStore = require('session-file-store')(session); 

var userz = new Map();  
var guestz = new Map(); 
var roomz = new Map(); 
var id = 1;


var sesStore = new FileStore({
        path : './sessions'
    }); 

 var sessionMid = session({ 
    store: sesStore, 
    secret: 'keyboard cat',
    maxAge: 10*60000,
    resave : true, 
    saveUninitialized : false //nie zapisuj póki nic w niej nie ma jak rozumiem
});
var sharedSession = require('express-socket.io-session');

var app = express();
var server = http.createServer(app);

var io = require('socket.io')(server)


app.set('view engine', 'ejs');
app.set('views', './views');

app.use( bodyParser.urlencoded({extended:true}) ) ;

app.use( cookieParser() );


app.use(sessionMid);

io.use(sharedSession(sessionMid, {
    autoSave : true 
}));

app.use( express.static('./static'));




app.use((req,res,next) => { 
    if (req.session.legit == undefined) 
        req.session.legit = {}; //do porównania - czy żądanie na tym poziomie uprawnień co ma człek - jak za płytko to ma grać
    req.session.urlLegit = {}; //obiekt uprawnień żądania, zwiększany przy rozkładaniu url'a
                            //żądanie musi być na tym poziomie uprawnień co użytkownik
                            //będzie przed renderem porównanie z obiektem uprawnień użytkownika, czyli req.session.lagit
    //urlLegit budowane zawsze od zera, nie trzeba z niego usuwać przy wychodzeniu

    next();
});

app.all('/redirectDefault', (req,res) => {
    //trzeba od największego stopnia wejścia, tzn najgłębiej, bo inaczej jeśli po 1 warunku to nie tam gdzie trzeba
    var ses = req.session;
    
    if(ses.legit == undefined) 
        res.redirect('/'); 

    if (ses.legit.inGame) { 
        res.redirect('/rooms/room/game' ); 
        return; 
    }
    if (ses.legit.roomEntered) {
        res.redirect('/rooms/room/?roomName=' + ses.legit.roomEntered);
        return;
    }
    if (ses.legit.entered) {
        res.redirect('/rooms');
        return;
    }
    res.redirect('/');
    return; 
    
});



var guestRouter = require('./guest')(guestz,id);
app.use('/guest', guestRouter);

var registerRouter = require('./register');
app.use('/register', registerRouter);

var roomsRouter = require('./rooms')(roomz,userz, guestz,io,id);
app.use('/rooms', roomsRouter);

var userRouter = require('./user')(userz,id);
app.use('/user', userRouter);


app.get("/", (req, res) =>{
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { 
        res.redirect('/redirectDefault'); 
        return; 
    }

    res.render("index.ejs");
    res.end(); 
});



app.use((req,res,next) => {

    res.redirect('/redirectDefault');
    return; //a może by res.end()?
});


//timeout
setInterval( function() {

    var date = new Date();

    roomz.forEach( (value, key, map) => { 
            var game = value.game;
            if (game != undefined) {
                
                if (game.playersConnected == undefined || game.playersConnected==0) {
                var when = game.lastConnected;
                if(when != undefined) {

                    var del = new Date(when.getTime() + 60000); //data do usuwania minutę po tamtej
                    if (date.getTime() > del.getTime()) {
                        delete game;
                    }
                }
            }
            }
            if (value.playersConnected == undefined || value.playersConnected==0) {
                var when = value.lastConnected;
                if(when != undefined) {
                    var del = new Date(when.getTime() + 60000); //data do usuwania minutę po tamtej
                    if (date.getTime() > del.getTime()) {
                        roomz.delete(key);
                        //console.log("||||||||||||||||||||usuwam pokój" + value.name);
                    }
                }
            }
        }); 

        guestz.forEach( (value, key, map) => { 
            
            if (value.connected == undefined || value.connected == 0) {
                var when = value.lastConnected;
                if(when != undefined) {
                    var del = new Date(when.getTime() + 3*60000); //gościa to jednak trochę dłużej, mogła mu się karta zamknąć czy co
                    if (date.getTime() > del.getTime()) {
                        guestz.delete(key);
                    } 
                }
            } 
        }); 

}, 60*1000); 


server.listen(process.env.PORT || 3000);

console.log( 'server started' );




