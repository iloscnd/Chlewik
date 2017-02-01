

/// render nie kończy odpowiedzi i idzie dalej w domyślne pokazywanie okna
/// ale po redirect już return nie jest potrzebne, ani end

//chrome pyta o favicon/ico do serwera na koniec
//np. jak spyta o favicon/ico jak jest w pokoju, to próbuję go dać do pokoju a on już jest pełen jeśli dołącza jako drugi 
//i dopiero jak się popętli (bo przekierowuje go na / a przecież jest w pokoju, więc z powrotem) to uznaje że nie dostanie ikony


var userz = new Map();  //tu, bo chcę sprawdzać też w /rooms czy aktualne uprawnienia
var guestz = new Map(); 
var roomz = new Map(); // tu, bo tu jest usuwanie na timeout
var id = 1;

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');//mozna spróbować szyfrować
var session = require('express-session')
var FileStore = require('session-file-store')(session); //to sprawia, że jak się ustawi, to będzie zapisywał ok a nie w RAM

var sesStore = new FileStore({
        path : './sessions'//, //to domyślne, ale napiszę żeby bylo widać
        //reapInterval : 60 //w sekundach po jakim czasie usuwać wygaśnięte - na kompie u mnie to zupełnie psuje
    }); //FileStore jest var, patrz góra!

 var sessionMid = session({ //http://www.webdevelopment-tutorials.com/express-by-examples/10/session-with-file-storage/8
    store: sesStore, //na kompie coś się wtedy strasznie psuje u mnie
    secret: 'keyboard cat',
    maxAge: 10*60000,
    resave : true, //piszą że jak czas ważności, może on musi nadpisywać ostatnie użycie bo wygaśnie inaczej https://github.com/expressjs/session
    saveUninitialized : false //nie zapisuj póki nic w niej nie ma jak rozumiem
});
var sharedSession = require('express-socket.io-session');
//potem app.use(sessionMid)

var app = express();
var server = http.createServer(app);

var io = require('socket.io')(server)


app.set('view engine', 'ejs');
app.set('views', './views');

app.use( bodyParser.urlencoded({extended:true}) ) ;

app.use( cookieParser() );


app.use(sessionMid);

//może z tamtym trickiem jakby tak dać to session.save(), to by też poszło?
io.use(sharedSession(sessionMid, {
    autoSave : true //dzięki temu w socket.io event handler'ach można modyfikować sesję!
}));

app.use( express.static('./static'));


//w grze się jest w jednym miejscu, nie można sie rozdwajać, to i tak nie ma sensu, chyba żeby chcieć kilka gier naraz, a to sensowne tylko w jakichś quizach chyba


app.use((req,res,next) => { //było z '/'
    if (req.session.legit == undefined) req.session.legit = {}; //do porównania - czy żądanie na tym poziomie uprawnień co ma człek - jak za płytko to ma grać
    req.session.urlLegit = {}; //obiekt uprawnień żądania, zwiększany przy rozkładaniu url'a
                            //żądanie musi być na tym poziomie uprawnień co użytkownik
                            //będzie przed renderem porównanie z obiektem uprawnień użytkownika, czyli req.session.lagit
    //urlLegit budowane zawsze od zera, nie trzeba z niego usuwać przy wychodzeniu
    next(); //bez tego trochę nie śmignie nie żeby coś 
});

app.all('/redirectDefault', (req,res) => {
    //trzeba od największego stopnia wejścia, tzn najgłębiej, bo inaczej jeśli po 1 warunku to nie tam gdzie trzeba
    var ses = req.session;
    
        if(ses.legit == undefined) res.redirect('/'); 
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
        return; //a może by res.end()?
    
});

/*   ###########!!!!!!!!!!!!!!!!!!
 http://procbits.com/2012/01/19/comparing-two-javascript-objects - u nas kolejność jest ta sama, bo to kolejność wchodzenia, więc stringify jest ok
 if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
 to zawsze jak już weszliśmy do końcowego miejsca gdzie chcemy ~pokazywać stronę; tzn jak chcemy zrobić jakąś akcję - czy nie chce wyjść z gry itp.
 na pocz. każdego .get , .post, .all jest OK
*/




var guestRouter = require('./guest')(guestz,id);
app.use('/guest', guestRouter);

var registerRouter = require('./register');
app.use('/register', registerRouter);

var roomsRouter = require('./rooms')(roomz,userz, guestz,io,id);
app.use('/rooms', roomsRouter);

var userRouter = require('./user')(userz,id);
app.use('/user', userRouter);



app.get("/", (req, res) =>{
    if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

    res.render("index.ejs");
    res.end(); 
});

//logout przeniesiony do rooms - bo poziomy uprawnień i wygodniej, patrz to co wyżej w komentarzu nad przekierowaniami

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

    res.redirect('/redirectDefault');
    return; //a może by res.end()?
});


//timeout żeby wywalało jak ktoś się sam nie wyloguje itp
setInterval( function() {

    var date = new Date();
    //nie mogę emitować przez socety bo to ma właśnie ogarniać sytuację kiedy ich nie ma

    //tu potrzebne jest przeglądnięcie wszystkich sesji z katalogu i zmiana uprawnień nieaktualnym z gry i pokoju,
    //a nieaktualnym z logowaniem w ogóle usunięcie sesji
    //sesStore. //tak się nie da chyba dostać do sesji, a na pewno nie piszą jak na npm, beznadziejni są

    //jednak przeglądamy po userz, guestz, roomz
    roomz.forEach( (value, key, map) => { 
            var game = value.game;
            if (game != undefined) {
                if (game.playersConnected == undefined || game.playersConnected==0) {
                var when = game.lastConnected;
                if(when != undefined) {
                    var del = new Date(when.getTime() + 60000); //data do usuwania minutę po tamtej
                    if (date.getTime() > del.getTime()) {
                        //console.log("||||||||||||||||||||||usuwam grę w pokoju" + value.name);
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
            //console.log(value);
            //console.log(value.connected);
            //console.log(value.lastConnected);
            if (value.connected == undefined || value.connected == 0) {
                var when = value.lastConnected;
                if(when != undefined) {
                    var del = new Date(when.getTime() + 3*60000); //gościa to jednak trochę dłużej, mogła mu się karta zamknąć czy co
                    if (date.getTime() > del.getTime()) {
                        guestz.delete(key);
                        //console.log("||||||||||||||||||||usuwam gościa" + value.name);
                    } 
                }
            } 
        }); 

        //użytkowników nie usuwać bo to użytkownicy...

}, 60*1000); //co minutę, bo i po co częściej a tak nie obciąża serwera


server.listen(process.env.PORT || 3000);

console.log( 'server started' );




