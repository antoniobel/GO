/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
const colyseus = require("colyseus");
const schema = require("@colyseus/schema");
const GoGame = require("./gogame").GoGame;

class Player extends schema.Schema {
    constructor(nombre, id) {
        super();
        this.nombre = nombre;
        this.id = id;
    }
};
schema.defineTypes(Player, {nombre: "string"});
schema.defineTypes(Player, {id: "string" });

/* State es la clase que mantiene los datos de estado de juego. Estos 
 * datos son los que se trasladan a los clientes cuando alguno de ellos
 * cambia. Solo hay un array de objetos player que asocian el id que 
 * asigna Colyseus con el nombre del jugador.
 * Todos los eventos del juego se proporcionan via broadcast o send en 
 * lugar de sincronizar datos.
 */
class State extends schema.Schema {    
    constructor (room) {
        super();
        this.players = new schema.ArraySchema();
    }
    
    createPlayer (id , nombre) {
        this.players.push(new Player(nombre , id));
    }
        
    removePlayer(id) {
        var i;
        for (i = 0; i < this.players.length; i++) {
            if (this.players[i].id === id) {
                this.players.splice(i,1);
                break;
            }
        }
    }

};
schema.defineTypes(State, {players: [Player]});
exports.State = State;

class Handler extends colyseus.Room {
    constructor() {
        super();
        this.setSeatReservationTime(30);
        this.maxClients = 10;
        this.game = new GoGame(this);
    }

    onCreate () {
        this.setState(new State());
        this.pingContinue = true;
        this.pingFlag = true;
        this.colaFallos = [];
        this.clock.setTimeout(this.pingSend, 5000 , this);
        console.log("Ping iniciado");
    }
    
    onAuth(client, options, req) {
//        console.log(req.headers.cookie);
        return true;
    }

    onJoin (client, options) {
//        this.send(client, { message: "Bienvenido " + options.nombre});
        if (this.getClient(options.nombre) === undefined) { // Verificamos que no haya otro cliente con el mismo nombre
            this.state.createPlayer(client.sessionId , options.nombre);
            console.log('Cliente ' + options.nombre + ' conectado. sessionId: ' + client.sessionId);
            this.sendOne(options.nombre , { message: "Bienvenido " + options.nombre});
            if (this.game.gameStarted) { // Si la partida ha comenzado, incorporar al juego.
                this.game.incorporar(options.nombre);
            }
            this.broadcast({conexiones: this.state.players});        
        } else { // si lo hay, lo echamos.
            console.log("Nombre repetido " + options.nombre + ". Desconectamos "+ client.sessionId);
            this.send(client , { message: "Desconectado. Nombre repetido " + options.nombre , code: 1 });
            this.broadcast({conexiones: this.state.players});        
        }
    }

    onLeave (client) {
        console.log("Cliente " + client.sessionId + " desconectado");
        var nombre = this.getName(client.sessionId);
        var esJugador = this.game.esJugador(nombre); // miro si es jugador antes de quitarlo de la lista
        this.state.removePlayer(client.sessionId);
        this.broadcast({conexiones: this.state.players}); 
        if (this.game.gameStarted) {
            if (esJugador) {
                this.broadcast({action: "JugadorDesconectado" , data: nombre});        
            }
        }       
    }

    onMessage (client, data) {
        if ('ping' in data) {
            this.pingReceived(client);
            return;
        }
        var d = new Date();
        if ('echo' in data) {
            if ('action' in data.echo) {
                console.log(d.getTime() , "Eco" , this.getName(client.sessionId) , client.sessionId, ":", data.echo.action);
                console.log(data.echo.data);
            } else {
                console.log("Eco" , this.getName(client.sessionId) , client.sessionId, ":", data.echo.data);
            }
        } else {
            console.log(d.getTime() , "Mensaje recibido", this.getName(client.sessionId) , client.sessionId, ":", data);
            this.game.messageReceiver(this.getName(client.sessionId) , data);
        }
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
        this.pingContinue = false;
        console.log("Ping finalizado");
    }

    sendAll(message) {
        this.broadcast(message);        
    }
    
    sendOne(nombre, message) {
        var clientId = this.getClient(nombre);
        if (clientId != null) {
            this.send(this.getClient(nombre) , message);
        } else {
            console.log("Cliente " + nombre + " desconectado. No se envia evento " , message);
        }
    }
    
    sendAllButOne(nombre, message) {
        var client = this.getClient(nombre);
        this.broadcast(message, { except: client });
    }
    
    getName(id) {
        var name;
        this.state.players.forEach( player => {
            if (player.id === id) {
                name = player.nombre;
            }
        });
        return name;
    }
    
    getClient(nombre) {
        var c;
        this.state.players.forEach(ele => {
            if (ele.nombre === nombre) {
                var id = ele.id;
                this.clients.forEach( client => {
                   if (client.sessionId === id) {
                       c = client;
                   }
                });
            }
        });        
        return c;
    }

    getClientConId(id) {
        var c;
        this.clients.forEach( client => {
            if (client.sessionId === id) {
                c = client;
            }
         });
         return c;
    }

    pingSend(handler) {
        if (handler.pingFlag) {
            console.log("Ping");
            handler.pings = [];
            handler.clients.forEach(cliente => {
                handler.pings.push(cliente.id);
            });
            handler.broadcast({ ping : 1});
            handler.pingFlag = false;
        } else {
            handler.pingFlag = true;
            if (handler.pings.length === 0) {
                console.log("Todos los clientes contestan");
            } else {
                console.log("Algunos clientes no han contestado");
                handler.pings.forEach(cliente => {
                    handler.colaFallos.push(cliente);
                    console.log(cliente);
                });
                if (handler.colaFallos.length > 5) {
                    handler.analisisCola(handler);
                }
            }
        }
        if (handler.pingContinue) {
            handler.clock.setTimeout(handler.pingSend, 5000 , handler);
        }
    }

    pingReceived(cliente) {
        var i;
        for (i= 0; i < this.pings.length; i++) {
            if (this.pings[i] === cliente.id) {
                this.pings.splice(i,1);
                break;
            }
        }
    }

    analisisCola(handler) {
        console.log('Analisis cola');
        handler.colaFallos.sort();
        var id = handler.colaFallos[0];
        var i , counter = 1;
        for (i = 1 ; i < handler.colaFallos.length; i++) {
            if (handler.colaFallos[i] === id) counter++;
        }
        if (counter > 3) {
            var client = handler.getClientConId(id);
            console.log('Se fuerza desconexion de' , id);
            if (client != null) {
//                client.leave(1000); ==> leave is not a function
                client.close();
            }
            while(handler.colaFallos[0] === id) {
                handler.colaFallos.shift();
            }
            if (handler.colaFallos.length > 3) {
                handler.analisisCola(handler);
            }
        }
    }
};
exports.Handler = Handler;

