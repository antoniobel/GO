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
        this.maxClients = 10;
        this.game = new GoGame(this);
    }

    onCreate () {
        this.setState(new State());
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
//                this.send(client , { message: "La partida ya ha comenzado. Tendrás que esperar." + options.nombre , code: 2 });
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
        this.state.removePlayer(client.sessionId);
        this.broadcast({conexiones: this.state.players});        
    }

    onMessage (client, data) {
        if ('echo' in data) {
            if ('action' in data.echo) {
                console.log("Eco" , this.getName(client.sessionId) , client.sessionId, ":", data.echo.action);
                console.log(data.echo.data);
            } else {
                console.log("Eco" , this.getName(client.sessionId) , client.sessionId, ":", data.echo.data);
            }
        } else {
            console.log("Mensaje recibido", this.getName(client.sessionId) , client.sessionId, ":", data);
            this.game.messageReceiver(this.getName(client.sessionId) , data);
        }
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
    }

    sendAll(message) {
        this.broadcast(message);        
    }
    
    sendOne(nombre, message) {
        this.send(this.getClient(nombre) , message);
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
};
exports.Handler = Handler;

