/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
import http from "http";
import { Room, Client } from "colyseus";
import { Schema, type, ArraySchema } from "@colyseus/schema";
import { GoGame } from "./gogame"; 

class Player extends Schema {
    @type("string")
    nombre: string;

    @type("string")
    id: string;

    constructor(nombre: string , id: string) {
        super();
        this.nombre = nombre;
        this.id = id;
    }
};

/* State es la clase que mantiene los datos de estado de juego. Estos 
 * datos son los que se trasladan a los clientes cuando alguno de ellos
 * cambia. Solo hay un array de objetos player que asocian el id que 
 * asigna Colyseus con el nombre del jugador.
 * Todos los eventos del juego se proporcionan via broadcast o send en 
 * lugar de sincronizar datos.
 */
export class State extends Schema {  
    @type( [ Player ])
    players: ArraySchema<Player>;

    constructor () {
        super();
        this.players = new ArraySchema();
    }
    
    createPlayer (id:string , nombre: string) {
        this.players.push(new Player(nombre , id));
    }
        
    removePlayer(id: string) {
        var i: number;
        for (i = 0; i < this.players.length; i++) {
            if (this.players[i].id === id) {
                this.players.splice(i,1);
                break;
            }
        }
    }

};

export class Handler extends Room {

    game: GoGame;
    pingContinue: boolean;
    pingFlag: boolean;
    colaFallos: Array<string>;
    pings: Array<string>;

    constructor() {
        super();
        this.setSeatReservationTime(30);
        this.maxClients = 10;
        this.game = new GoGame(this);
    }

    onCreate (options: any) {
        this.setState(new State());
        this.pingContinue = true;
        this.pingFlag = true;
        this.colaFallos = [];
        this.clock.setTimeout(this.pingSend, 5000 , this);
        console.log("Ping iniciado");
        this.onMessage("*", (client, type, message) => { 
            this.recibeMensaje(client, message);
        });
        this.setMetadata({partida: options.partida, pcoto: options.pcoto, publico: options.publico });
        this.game.partidasCoto = parseInt(options.pcoto);
        console.log("Partidas coto es " , this.game.partidasCoto);
    }
    
    onAuth(client: Client, options: any , req: http.IncomingMessage) {
        return true;
    }

    onJoin (client: Client, options: any) {
        if (this.getClient(options.nombre) === undefined) { // Verificamos que no haya otro cliente con el mismo nombre
            if (this.state.players.length === 4 && !this.metadata.publico) { // la partida no admite publico
                throw new Error("La partida no admite espectadores.");
            }
            this.state.createPlayer(client.sessionId , options.nombre);
            console.log('Cliente ' + options.nombre + ' conectado. sessionId: ' + client.sessionId);
            this.sendOne(options.nombre , { message: "Bienvenido " + options.nombre});
            if (this.game.gameStarted) { // Si la partida ha comenzado, incorporar al juego.
                this.game.incorporar(options.nombre);
            }
            this.sendAll( {conexiones: this.state.players} );        
        } else { // si lo hay, lo echamos.
            console.log("Nombre repetido " + options.nombre + ". Desconectamos "+ client.sessionId);
            client.send("mensajeGo" , { message: "Desconectado. Nombre repetido " + options.nombre , code: 1 });
            this.sendAll( {conexiones: this.state.players} );        
        }
    }

    onLeave (client: Client) {
        console.log("Cliente " + client.sessionId + " desconectado");
        var nombre = this.getName(client.sessionId);
        var esJugador = this.game.esJugador(nombre); // miro si es jugador antes de quitarlo de la lista
        this.state.removePlayer(client.sessionId);
        this.sendAll( {conexiones: this.state.players} ); 
        if (this.game.gameStarted) {
            if (esJugador) {
                this.sendAll( {action: "JugadorDesconectado" , data: nombre} );        
            }
        }       
    }

    /**
     * Función de callback que se ejecuta cuando se recibe un mensaje del cliente. El callback se declara en
     * el metodo onCreate (llamada a this.onMessage)
     * @param client 
     * @param data 
     */
    recibeMensaje (client:Client , data: any) {
        if ('ping' in data) {
            this.pingReceived(client);
            return;
        }
        if ('echo' in data) {
            if ('action' in data.echo) {
                console.log("ECO" , this.getName(client.sessionId) , client.sessionId, ":", data.echo.action , data.echo.data);
            } else {
                console.log("ECO" , this.getName(client.sessionId) , client.sessionId, ":", data.echo.data);
            }
        } else {
            console.log("RECIBO", this.getName(client.sessionId) , client.sessionId, ":", data);
            this.game.messageReceiver(this.getName(client.sessionId) , data);
        }
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
        this.pingContinue = false;
        console.log("Ping finalizado");
    }

    sendAll(message:any) {
        this.broadcast("mensajeGo" , message);        
    }
    
    sendOne(nombre:string, message: any) {
        var clientId = this.getClient(nombre);
        if (clientId != null) {
            var c: Client = this.getClient(nombre);
            c.send("mensajeGo" , message);
        } else {
            console.log("Cliente " + nombre + " desconectado. No se envia evento " , message);
        }
    }
    
    sendAllButOne(nombre: string, message: any) {
        var client = this.getClient(nombre);
        this.broadcast(message, { except: client });
    }
    
    getName(id: string): string {
        var name: string;
        this.state.players.forEach( (player: Player) => {
            if (player.id === id) {
                name = player.nombre;
            }
        });
        return name;
    }
    
    getClient(nombre: string): Client {
        var c: Client;
        this.state.players.forEach( (ele: Player) => {
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

    getClientConId(id: string): Client {
        var c: Client;
        this.clients.forEach( client => {
            if (client.sessionId === id) {
                c = client;
            }
         });
         return c;
    }

    pingSend(handler: Handler) {
        if (handler.pingFlag) {
            console.log("Ping");
            handler.pings = [];
            handler.clients.forEach(cliente => {
                handler.pings.push(cliente.id);
            });
            handler.sendAll( { ping : 1} );
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

    pingReceived(cliente: Client) {
        var i: number;
        for (i= 0; i < this.pings.length; i++) {
            if (this.pings[i] === cliente.id) {
                this.pings.splice(i,1);
                break;
            }
        }
        // #55. Mejora mecanismo ping servidor
        for (i= 0; i < this.colaFallos.length; i++) {
            if (this.colaFallos[i] === cliente.id) {
                this.colaFallos.splice(i,1);
                break;
            }
        }
    }

    analisisCola(handler: Handler) {
        console.log('Analisis cola');
        handler.colaFallos.sort();
        var id: string = handler.colaFallos[0];
        var i: number , counter = 1;
        for (i = 1 ; i < handler.colaFallos.length; i++) {
            if (handler.colaFallos[i] === id) counter++;
        }
        if (counter > 3) {
            var client = handler.getClientConId(id);
            console.log('Se fuerza desconexion de' , id);
            if (client != null) {
                client.leave(1000); 
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

