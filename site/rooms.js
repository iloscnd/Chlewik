
var express = require('express');

 var router = express.Router();
 router.use( express.static('./static')); //muszę

var pg = require('pg');
pg.defaults.ssl = true;

//sprawdzenie poziomu uprawnień - tu są 2 poziomy tak samo jak w guest
// na początku bez uprawnień tak jak tam

var client = new pg.Client(process.env.DATABASE_URL);

client.connect();

//sprawdzenie poziomu uprawnień - 
//starczy sprawdzić najgłębszy, bo przekierujemy na '/' a ono przekieruje najglębiej gdzie wolno i być powinien
//i tak by starczyło, bo je przechodzi po kolei
//!!! można by też sprawdzać po kolei od najpłytszego i przekierowywać na poprzedni, wtedy mniej zapytań


//B. WAŻNE!!! jak ktoś usunie pokój jak ten nie połączony  --- ale to zrobić w tamtym poprzednim middleware, żeby nie krążyło w tę i z powrotem, bo w urlLegit
//z grą zrobić tak samo
// EDIT - zrobione i na tym poziomie co uprawn., a nie poziom niżej sprawdzane 
  // BO tak jest ok - będzie próbowało przekierować na poziom na którym jest, więc najwyżej przejdzie dodatkową ścieżkę


var routerFun = function(roomz,userz, guestz,io,id) { //potrzebuję do sprawdzenia aktualności uprawnień

            io.on('connection', function(socket) {
                //console.log('connected in room');
                socket.on('loggedIn', function() { //rn to na razie nazwa pokoju
                    
                    //console.log("connected");
 
                    if (socket.handshake.session.guest) {
                        var guest = guestz.get(socket.handshake.session.name);
                        if (guest == undefined ) return;
                        if (!guest.connected) guest.connected = 1;
                        //jakby wysyłał za plecami dziwne żądania to one nie wejdą tak głęboko, bo nie są do tego routera, więc nie trzeba pamiętać liczby
                        delete guest.lastConnected;
                    }
                    else if (socket.handshake.session.legit.entered && !socket.handshake.session.guest) { // 2. warunek niepotrzebny, bo jest else
                        var user = userz.get(socket.handshake.session.name);
                        if (user == undefined ) return;
                        if (!user.connected) user.connected = 0;
                        delete user.lastConnected;
                    }

                    socket.on('disconnect', function() { // UWAGA: TYLKO SOCKETOM ZALOGOWANYM - jak ktoś np. w grze, to będzie tu rozłączony, ale głębiej połączony
                        
                        //console.log("disconnected");

                        var date = new Date(); //bierze aktualną
                        // /var tm = date.getTime(); //jednak nie wziąłem tego

                        
                        if (socket.handshake.session.guest) {
                            var guest = guestz.get(socket.handshake.session.name);
                            if (guest == undefined ) return;
                            guest.lastConnected = date;
                            //console.log("disconnected guest" + guest.name);
                            delete guest.connected;
                        }
                        else if (socket.handshake.session.legit.entered && !socket.handshake.session.guest) { // 2. warunek niepotrzebny, bo jest else
                            var user = userz.get(socket.handshake.session.name);
                            if (user == undefined ) return;
                            user.lastConnected = date;
                            delete user.connected;
                        }
                    }); 
                });
            });

    //trzeba usersz, guestz, więc w routerFun
    router.use('/', (req,res,next) => {

        
        //usuwanie nieaktualnych uprawnień, żeby nie próbowało przekierować i się nie pętliło - usuwamy tylko entered, bo resztę się i tak ustawi przy ponownym
        //trzeba usunąć też następne poziomy, bo już potem tam nie dotrze żeby je usunąć
        
        if(!req.session.guest){
            client.query( "SELECT id FROM users WHERE name = '" + req.session.name + "';",function(err, result){
                if(err)
                    console.log(err);
                
                console.log(result);
                if(!result) { /*console.log("usuwam że zalogowany");*/ 
                    delete req.session.legit.entered; 
                    delete req.session.legit.roomEntered; 
                    delete req.session.legit.inGame; 
                    req.session.save(); 
                }

                else if( req.session.legit.entered && !req.session.guest && result.rowCount == 0) { /*console.log("usuwam że zalogowany");*/ 
                    delete req.session.legit.entered; 
                    delete req.session.legit.roomEntered; 
                    delete req.session.legit.inGame; 
                    req.session.save(); 
                } //B. WAŻNE!!! 
                
                else if ( req.session.legit.entered && !req.session.guest) {
                    if (result.rowCount != 0 && result.rows[0].id != req.session.personID) { /*console.log("usuwam że zalogowany");*/ 
                        delete req.session.legit.entered; 
                        delete req.session.legit.roomEntered; 
                        delete req.session.legit.inGame; 
                        req.session.save(); 
                    } //B. WAŻNE!!!
                }

                var ses = req.session;
                if (!ses.legit.entered) { 
                    //console.log(ses.legit.entered+"WRACAM3");
                    res.redirect('/'); 
                    return; 
                }

                req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
                
                next();
            });
        }
        else {
   
            if( req.session.legit.entered && req.session.guest && guestz.get(req.session.name) == undefined) { /*console.log("usuwam że zalogowany");*/ 
                delete req.session.legit.entered; 
                delete req.session.legit.roomEntered; 
                delete req.session.legit.inGame; 
                req.session.save(); 
            } //B. WAŻNE!!! 
            
            
            if ( req.session.legit.entered && req.session.guest) {
                var guest = guestz.get(req.session.name);
                if (guest != undefined && guest.id != req.session.personID) { /*console.log("usuwam że zalogowany");*/ 
                    delete req.session.legit.entered; 
                    delete req.session.legit.roomEntered; 
                    delete req.session.legit.inGame; 
                    req.session.save(); 
                } //B. WAŻNE!!!
            }
            var ses = req.session;
            if (!ses.legit.entered) { 
                //console.log(ses.legit.entered+"WRACAM3");
                res.redirect('/'); 
                return; 
            }
            req.session.urlLegit.entered = ses.legit.entered; //1, ale tak bezpiecznie
            
            next();
        
            }
            //starczy wykasowywać tu w sprawdzaniu uprawnień te nieaktualne, też z ID
    });
    
    var inroomRouter = require('./inroom')(roomz,userz, guestz,io,id);
    router.use('/room', inroomRouter);
    
    router.all('/', (req,res) =>{
        
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) {  res.redirect('/redirectDefault'); return; }

        var err = req.query.err;
        var errWhat;
        //console.log("tu jestem");
        //console.log(err);
        if (err == "pwd") { /*console.log("WIDZĘ ZŁE HASŁO");*/ errWhat = "pwd";}
        else if (err == "crowded") { /*console.log("WIDZĘ PEŁEN");*/ errWhat = "crowded"; }
        else errWhat = "";
        

            var model = {
                ses : req.session,
                roomz : roomz,
                error : errWhat
            }
            //console.log("powinien iść");
            res.render('roomView.ejs',model);
            //console.log("no ale jest dziwny");
            return; //a może by res.end()?
        
    });

    

     //bez sensu..., że muszę pytać w tę i z powrotem jak chcę tylko wyświetlić wiem co
    router.all('/ajaxFormNew', (req,res) => {

        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //console.log("widzę\n");
        res.send("napis");
        return; //a może by res.end()?
    });
    

    router.post('/ajaxIsName', (req,res) => {
    
       if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        var flag = true;
        var name = req.body.name; //bo post
        //console.log("poszło\n");
        if (roomz.get(name) != undefined) flag = false;
        var resp = "";
        if (flag) resp="OK"; else resp="NO";
        //console.log(resp+"\n");
        res.send(resp);
        return; //a może by res.end()?
    });

    router.post('/create', (req,res) => {

       if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        //tu trzeba by sprawdzać czy ktoś nie jest już w pokoju
        var flag = true;
        var name = req.body.roomName;
        if (roomz.get(name) != undefined) flag = false;
        req.session.roomPwd = req.body.pwd; //?
        req.session.legit.roomEntered = name;
        //console.log(name);

        var theID = id;

        if (flag) {
            var pwdTrimmed = req.body.pwd.trim();
            var flag = (!(pwdTrimmed.length == 0))
            var newRoom = {
                id : theID,
                name : req.body.roomName,
                pwd : req.body.pwd,
                hasPwd : flag,
                people : 0, 
                connectedPeople : 0, //socket ogarnia liczby
                chat : [null,null,null,null,null,null,null,null,null,null],
                chatLast : [0],
                unready : new Map(),
                ready : new Map(),
                guru : req.session.name //taki co mu ma być wolno usuwać innych - ten, co utworzył
            };
            ++id;
            roomz.set(name,newRoom);
        }
        else theID = roomz.get(name).id;
        req.session.roomEnteredID = theID;  
        newRoom.people = 1;
        newRoom.unready.set(req.session.name);
        //console.log(name);
        //console.log(req.session.legit.roomEntered);
        res.redirect('/rooms/room/'+'?roomName='+name);
        return; //a może by res.end()?
        
    });

    router.post('/setSessionPwd', (req,res) => { //post; potrzebne, żeby ustawić że wszedł
    
        if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        
        var name = req.query.name;
        var room = roomz.get(name);
        var pwd = req.body.roomPwd;
        if (room.hasPwd && room.pwd != pwd) { /* console.log("ZŁE HASŁO");*/ res.redirect('/rooms?err=pwd'); return; } 
        if (room.people == 2) { /*console.log("PEŁEN");*/ res.redirect('/rooms?err=crowded'); return; } //TYLKO DLA DWUOSOBOWYCH
        req.session.roomPwd = pwd; //to nie jest potrzebne
        req.session.legit.roomEntered = name;

        //jak się gdzieś wchodzi, to hasła porównuje temu z aktualnym id, więc to id ustawiamy - podobnie z user
        req.session.roomEnteredID = room.id; 

        room.people++;
        room.unready.set(req.session.name);
        res.redirect('/rooms/room/'+'?roomName='+name);
        return; //a może by res.end()?
    });

    router.all("/logout",(req,res)=>{
    
       if(JSON.stringify(req.session.legit) !== JSON.stringify(req.session.urlLegit) ) { res.redirect('/redirectDefault'); return; }
        
            delete req.session.legit.entered; //bez tego przekieruje z powrotem
            if (req.session.guest==1) res.redirect('/guest/logout');
            else res.redirect('/user/logout'); //bez else się rzuca "can't set headers after they are sent"
            return; //a może by res.end()?
            
    }); 

    return router;
}

//PO WYJŚCIU Z POKOJU CZASEM POKAZUJE ŻE ISTNIEJE, BO NIE ZDĄŻY MU ZMIENIĆ - w chrome, w firefox nie
//trza doświeżyć

module.exports = routerFun;