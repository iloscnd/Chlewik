

///!!!###  jak się okazuje, render nie kończy odpowiedzi i idzie dalej w domyślne pokazywanie okna
/// ale po redirect już chyba return nie jest potrzebne, ani end

//czemu chrome pyta o favicon/ico do serwera na koniec, jaki on jest głupi...
//np. jak spyta o favicon/ico jak jest w pokoju, to próbuję go dać do pokoju a on już jest pełen jeśli dołącza jako drugi 
//i dopiero jak się popętli (bo przekierowuje go na / a przecież jest w pokoju, więc z powrotem) to uznaje że nie dostanie ikony

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');//mozna spróbować szyfrować
var session = require('express-session');
var FileStore = require('session-file-store')(session); //to sprawia, że jak się ustawi, to będzie zapisywał ok a nie w RAM
 

var app = express();
var server = http.createServer(app);

var io = require('socket.io')(server)


app.set('view engine', 'ejs');
app.set('views', './views');

app.use( bodyParser.urlencoded({extended:true}) ) ;

app.use( cookieParser() );


// LEPIEJ znacznie: https://www.npmjs.com/package/express-socket.io-session
var sessionMid = session({ //http://www.webdevelopment-tutorials.com/express-by-examples/10/session-with-file-storage/8
    //store: new FileStore({
    //    path : './sessions' //to domyślne, ale napiszę żeby bylo widać
    //}), //FileStore jest var, patrz góra!
    secret: 'keyboard cat',
    maxAge: 60000,
    resave : true, //piszą że jak czas ważności, może on musi nadpisywać ostatnie użycie bo wygaśnie inaczej https://github.com/expressjs/session
    saveUninitialized : false //nie zapisuj póki nic w niej nie ma jak rozumiem
});
io.use(function(socket, next){
    sessionMid(socket.request, socket.request.res, next); //wtedy moge sie dostac do sesji w socket
});
app.use(sessionMid);

app.use( express.static('./static'));

//NA POCZĄTKU WSZYSTKIE PRZEKIEROWANIA, BO W TAMTYCH JEST JEDNA ŚCIEŻKA I JAK WEJDZIE TO KONIEC
// NIE MOGĘ na początku, bo mu się dopasowuje jak jest z use w pętli bo przegląda od początku
//w grze się jest w jednym miejscu, nie można sie rozdwajać, to i tak nie ma sensu, chyba żeby chcieć kilka gier naraz, a to sensowne tylko w jakichś quizach chyba
//to jest przekierowanie człeka, który wszedł głębiej a chce pójść płycej brz wychodzenia
// przekierowanie tych bez uprawnień w konkretnych routerach - najlepiej w routerze te same potrzebne uprawnienia

app.use((req,res,next) => { //było z '/'
    if (req.session.legit == undefined) req.session.legit = {}; //do porównania
    req.session.urlLegit = {}; //obiekt uprawnień żądania, zwiększany przy rozkładaniu url'a
                            //żądanie musi być na tym poziomie uprawnień co użytkownik
                            //będzie przed renderem porównanie z obiektem uprawnień użytkownika, czyli req.session.lagit
    //urlLegit budowane zawsze od zera, nie trzeba z niego usuwać przy wychodzeniu
    next(); //bez tego trochę nie śmignie nie żeby coś 
});

app.all('/redirectDefault', (req,res) => {
    //trzeba od największego stopnia wejścia, tzn najgłębiej, bo inaczej jeśli po 1 warunku to nie tam gdzie trzeba
    var ses = req.session;
    //if (ses.redirected) next();   //to było jak był z use na / i we wszystkich przekier.
    //else {
        console.log("ZERO"+JSON.stringify(req.session.legit));
        if(ses.legit == undefined) res.redirect('/'); //ono nie może dawać wtedy tu
        //ses.redirected = 1;
        if (ses.legit.inGame) { 
            res.redirect('/rooms/room/game' /*+ '/' + ses.gameType +'/?gameId=' + ses.legit.inGame*/); 
            return; 
        }
        if (ses.legit.roomEntered) {
            res.redirect('/rooms/room/?roomName=' + ses.legit.roomEntered);
            return;
        }
        if (ses.legit.entered) {
            console.log("IDŹ TAM");
            res.redirect('/rooms');
            return;
        }
        res.redirect('/');
        return; //a może by res.end()?
    //}
});

/*   ###########!!!!!!!!!!!!!!!!!!
 http://procbits.com/2012/01/19/comparing-two-javascript-objects - u nas kolejność jest ta sama, bo to kolejność wchodzenia, więc stringify jest ok
 if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
 to zawsze jak już weszliśmy do końcowego miejsca gdzie chcemy ~pokazywać stronę; tzn jak chcemy zrobić jakąś akcję
 chyba na pocz. każdego .get , .post, .all jest OK
*/

/* debug tamtego
console.log(JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
*/


//dzięki temu tam sobie ustawię przekierowanie, nie wejdzie mi w przekierowywanie w pętli a jak już adres ok i po nim, 
//to przy następnych żądaniach (też przekierowaniach, bo wygodniej) już chcę znowy przekierowywać w głąb
/*app.use('/', (req,res,next) => {
    var ses = req.session;
    ses.redirected = 0;
    next();
});*/


var guestRouter = require('./guest');
app.use('/guest', guestRouter);

var registerRouter = require('./register');
app.use('/register', registerRouter);

var roomsRouter = require('./rooms')(io);
app.use('/rooms', roomsRouter);

var userRouter = require('./user');
app.use('/user', userRouter);

//moved to inroom
//var gameRouter = require('./game')(io);
//app.use('/game',gameRouter);

app.get("/", (req, res) =>{
console.log("NIC"+JSON.stringify(req.session.legit));
console.log(JSON.stringify(req.session.urlLegit));
/*#*/  if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }

    /*if(req.session.entered)
    {
        res.redirect("/rooms");
    }
    else */ //to już w ogólnym przekierowaniu
    console.log("MA BYĆ KONIEC");
        res.render("index.ejs");
        res.end(); // ??? może return wraca do poprzedniego miejsca gdzie było przekierowane albo coś chyba
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

    //res.render('404.ejs', { url : req.url }); 
    //chcemy żeby mu wróciło do domyślnej
    console.log("DOMYŚL SIĘ"+req.url);//o ty szmato
    res.redirect('/redirectDefault');
    return; //a może by res.end()?
});



server.listen(process.env.PORT || 3000);

console.log( 'server started' );




