/* TODO :
Format :
- A faire : 
	Problèmes/difficultés rencontrés
	Idées pour le développement
	
- Conversations jusqu'à 5 personnes : 
	Par manque de temps je n'ai pas réussi à rendre cette partie fonctionnelle
	et j'ai préferé travailler à rendre quelque chose qui marche.
	Idée : 
	Utiliser les 'room' du module socket.io pour l'envoi de messages
	vers un groupe de destinataires.
	Idée d'implémentation :
	-	identifier les onglets de conversation autrement que par le simple nom du destinataire,
		avec les socket.id des clients par ex.
	- créer des 'rooms' grâce aux socket.id
	- diffuser les messages via socket.broadcast.to(room) avec room
	
- Envoi de vidéo : 
	Pour les mêmes raisons, j'ai voulu rendre fonctionnel l'envoi d'images et
	je n'ai pas eu de temps à consacrer aux vidéo.
	
- Vérification du contenu des messages/pseudo : pas de html/js
	Une vérification de la présence de html est utilisée.
	Je n'ai pas implementé de restriction concernant le js.
*/

// Initialization : 'express' & 'socket.io' modules

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', process.env.PORT || 8080);

app.get('/', function(req, res){
  res.sendfile(__dirname + '/app.html');
});

http.listen(app.get('port'), function(){
  console.log('Listening on *:8080');
});

var clientList = {};
var admin='Admin';

// Client connection
io.sockets.on('connection', function(socket){
	
	// Handle the client creation process : pseudo restriction & admin rights
	socket.on('newClient',function(name){
		// If the chosen pseudo is available
		if(!(name in clientList)){
			socket.name=name;
			clientList[name]=socket.id; 
			io.sockets.emit('upClientList',clientList);
			// If the pseudo is 'Admin' : emit the 'adminRight' event
			if(name==admin){
				socket.emit('adminRight');
			}
		// Else, ask for a new choice
		}else{
			socket.emit('badName',name);
		}
	});

	// Handle the message transmission process
	// Format : data = {sender, receiver, message}
  socket.on('sendMessage', function(data){
		var id=clientList[data.nameR];
    socket.broadcast.to(id).emit('receiveMessage', data);
  });
	
	// Handle the image transmission process
	// Format : data = {sender, receiver, image}	
	socket.on('sendImage', function(data){
		var id=clientList[data.nameR];
		socket.broadcast.to(id).emit('receiveImage', data);
	});
	
	// Handle the ban process
	socket.on('banned',function(name){
		var id=clientList[name];
		// Notify that 'name' is banned
		socket.broadcast.to(id).emit('isbanned');
		delete clientList[name];
		// Up the online clients list
		io.sockets.emit('upClientList',clientList);
	});
	
	// Handle the disconnection process
	socket.on('disconnect',function(){
		delete clientList[socket.name];
		// Notify that 'name' has left
		io.sockets.emit('hasLeft',socket.name);
		// Up the online clients list
		io.sockets.emit('upClientList',clientList);
	});
});

