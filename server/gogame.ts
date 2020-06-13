/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { Handler } from "./handler";
import { Carta , Baraja , Jugador } from "./gobase";
import fs from 'fs';
import os from 'os';

export class GoGame {

    private baraja: Baraja; // Baraja (Mazo de cartas)
    private baza: Array<Carta>; // array con las cartas de la baza actual. La primera carta es del jugador que ha jugado primero, etc.
    private cartasRecogidas: Array<Array<Carta>>; // cartas recogidas por cada pareja Mismo esquema que this.puntos
    private errorCounter: number; // Contador de errores para las cartas jugadas fuera de turno.
    private flagCartaJugada: boolean; // true si el jugador con el turno ya ha tirado carta (Para evitar mensajes duplicados)
    public gameStarted: boolean; // true si el coto ha comenzado
    private handler: Handler; // Room - gestiona comunicación entre el servidor y los clientes (Colyseus)
    private indiceGanador: number; // indice del array jugadores del jugador que ha ganado la última baza
    private jugadores: Array<Jugador>; // Array de jugadores 
    private log: Array<Array<string>>; // log de la partida. 4 elementos uno por jugador.
    private marcador: Array<number>; // dos elementos. partidas ganadas de una pareja y de otra
    private nombresPareja: Array<string>; // dos elementos. cada elemento contiene concatenados los nombres de la pareja. 
    public partidasCoto: number; // Número de partidas necesarias para ganar un coto.
    private partidaTerminada: boolean; // flag que indica que la partida ha terminado. Se usa para las partidas de vueltas.
    private orden: Array<number>; // orden de juego (array con los indices del array de jugadores). 
    private publico: Array<Jugador>; // Array de clientes que entran como público en la partida.
    private puntos: Array<number>; // array con los puntos de la pareja 0 => pareja(0/2) y 1 => pareja(1/3)
    private ronda: number; // ronda de juego (de 1 a 10)
    private sincroCartas: Array<string>; // array con los nombres de los jugadores que hay devuelto el ok para la sincronizacion.
    private triunfo: Carta; // carta triunfo
    private turno: number; // turno de juego (de 0 a 3, es el indice del array orden)
    private vueltas: boolean; // true si es una partida de vueltas

    constructor(handler: Handler) {
        this.handler = handler;
        this.gameStarted = false;
        this.vueltas = false;
    };
    
    /**
     * Incorpora al juego un espectador una vez que la partida ha comenzado.
     * @param {*} nombre - nombre del espectador que se incorpora.
     */
    incorporar(nombre: string) {
        var nombres = [];
        this.jugadores.forEach(jugador => {
            nombres.push(jugador.nombre);
        });
        this.enviarEvento(nombre , { action: "Jugadores" , data: nombres});

        this.enviarEvento(nombre , { action: "ComienzaPartida"});
        this.enviarEvento(nombre , { action: "Parejas", data: [ [this.jugadores[0].nombre , this.jugadores[2].nombre ] , 
                                                            [ this.jugadores[1].nombre , this.jugadores[3].nombre ] ] });
        if (this.vueltas) {
            this.enviarEvento(nombre , { action: "NuevaPartida", data: {vuelta: this.vueltas ,  
                                                            parejas: this.nombresPareja , 
                                                            puntos: this.puntos }});
        } else {
            this.enviarEvento(nombre , { action: "NuevaPartida", data: {vuelta: this.vueltas }});
        }
        this.snapshot(nombre);
        this.enviarEvento('' , { action: "NuevaConexion", data: nombre});
        if (this.esJugador(nombre)) {
            if (this.flagCartaJugada) {
                this.cartaJugadaOk(nombre);
            }
        }
    }

    /**
     * Recibe los mensajes que envian los jugadores 
     * @param nombre - jugador que envia el mensaje 
     * @param data - mensaje
     */
    messageReceiver(nombre: string, mensaje: any) {
        if (mensaje.action === "ComienzaPartida" && this.handler.state.players.length >= 4 && this.gameStarted === false) {
            this.gameStarted = true;
            this.obtenerJugadores(mensaje);
            var nombres = [];
            this.jugadores.forEach(jugador => {
                nombres.push(jugador.nombre);
            });
            this.enviarEvento('' , { action: "Jugadores" , data: nombres});
            this.runGame();
        }
        if (mensaje.action === "EchoCarta") {
            this.cartaJugada(mensaje.data.jugador , new Carta(mensaje.data.carta));
        }
        if (mensaje.action === "Canto") {
            this.canto(mensaje.data);
        }
        if (mensaje.action === "Cambio7") {
            this.cambio7(mensaje.data);
        }
        if (mensaje.action === "PartidaCancelada") {
            this.gameStarted = false;
            this.enviarEvento('' , { action: "PartidaCancelada" , data: mensaje.data});
            this.handler.disconnect(); // Desconecta todos los usuarios
        }
        if (mensaje.action === "Snapshot") {
            this.snapshot(mensaje.data);
        }
        if (mensaje.action === "RevisionBaza") {
            this.revisionBaza(mensaje.data);
        }
        if (mensaje.action === "CartaJugadaOk") {
            this.cartaJugadaOk(mensaje.data);
        }
    }
    
    /**
     * Inicia un juego nuevo, en realidad un coto. el marcador del coto se pone a 0.
     */
    runGame() {
        console.log("Comienzo juego");
        this.enviarEvento('' , { action: "ComienzaPartida"});
        //Obtenemos los jugadores
        this.enviarEvento('' , { action: "Parejas", data: [ [this.jugadores[0].nombre , this.jugadores[2].nombre ] , 
                                                            [ this.jugadores[1].nombre , this.jugadores[3].nombre ] ] });
        // Inicializamos el marcador
        this.marcador = [];
        this.marcador[0] = 0;
        this.marcador[1] = 0;
        this.nuevaPartida();
    }
    
    /**
     * Inicializa una nueva partida, que puede ser de idas o de vueltas.
     * Crea la baraja, inicializa puntos de la partida si es de ida, determina el orden,
     * reparte las cartas, obtiene la carta de triundo , inicializa ronda, turno y envia evento de juego al primer jugador
     */
    nuevaPartida() {
        // Inicializamos el log
        this.log = [];
        var i;
        for (i=0 ; i<4; i++) {
            this.log[i] = [];
        }
        if (this.vueltas) {
            this.enviarEvento('' , { action: "NuevaPartida", data: {vuelta: this.vueltas ,  
                                                                    parejas: this.nombresPareja , 
                                                                    puntos: this.puntos }});
        } else {
            this.enviarEvento('' , { action: "NuevaPartida", data: {vuelta: this.vueltas }});
        }
        this.guardaLog('I');
        this.guardaLog('M');
        this.partidaTerminada = false; // marcador para las partidas de vuelta.
        // Creamos la baraja e inicializamos valores
        this.baraja = new Baraja();
        this.baraja.barajar();
        this.cartasRecogidas = [];
        this.cartasRecogidas[0] = [];
        this.cartasRecogidas[1] = [];  
        this.jugadores.forEach(jugador => {
            jugador.inicioPartida();
        })
        // ponemos a cero los puntos si la partida es de ida
        if (this.vueltas == false) {
            this.puntos = [];
            this.puntos[0] = 0;
            this.puntos[1] = 0;
        }      
        //determinar orden de juego
        if (this.marcador[0] === 0 && this.marcador[1] === 0 && !this.vueltas) { // es la primera partida del coto (y no es de vueltas)
            this.orden = [];
            this.fijarOrden(Math.floor(Math.random()*4)); // el primer jugador al azar.
        } else { // empezamos partida pero no es la primera. hay que correr turno
            var cero = this.orden[0];
            this.orden.shift(); // quitamos el primer elemento
            this.orden.push(cero); // y lo ponermos el último.
        }
        //repartir cartas Se reparten de 3 en 3 y la acción se decala time para dar tiempo a que el 
        // cliente vea como se dan las cartas.
        var time = this.repartirCartas();
        this.guardaLog('C');
        // Acción aplazada para que el proceso de repartir cartas termine
        this.handler.clock.setTimeout(() => {
            var d = new Date();
            // obtener triunfo
            this.triunfo = this.baraja.triunfo();
            this.enviarEvento('' , { action: "Triunfo", data: this.triunfo.getId() });
            this.guardaLog('T');
            // establecer ronda 1
            this.indiceGanador = -1;
            this.ronda = 1;
            this.baza = [];
            this.enviarEvento('' , { action: "Ronda", data: this.ronda });
            // Establecer turno de juego
            this.turno = 0; // indice del array de orden
            var nombreJugador = this.jugadores[this.orden[this.turno]].nombre;
            this.flagCartaJugada = false;
            this.sincroCartas = [];
            this.enviarEvento('' , { action: "Turno", data: nombreJugador });
            // Enviar orden de jugar al jugador con el turno
            this.errorCounter = 0; // controlador para errores de turno de juego
            this.snapshot(nombreJugador);        
            this.enviarEvento(nombreJugador , { action: "Juega" });   
        } , time); 
    }

    /**
     * Crea los jugadores a partir del array enviado por el usuario que comienza la partida
     * crea la lista de espectadores (publico) con los demas jugadores, del array handler.state.players
     * que no han sido incluidos en el array de jugadores.
     */
    obtenerJugadores(mensaje: any) {
        this.jugadores = [];
        this.publico = [];
        var i: number , n: string;
        for (i = 0 ; i < mensaje.datos.length ; i++) {
            this.jugadores.push(new Jugador(mensaje.datos[i]));
        }
        for (let id in this.handler.state.players) {
            n = this.handler.state.players[id].nombre;
            if (n != null) {
                if (!this.esJugador(n)) {
                    this.publico.push(new Jugador(n));
                }
            }
        }
        this.nombresPareja = [];
        this.nombresPareja[0] = this.jugadores[0].nombre + " y " + this.jugadores[2].nombre;
        this.nombresPareja[1] = this.jugadores[1].nombre + " y " + this.jugadores[3].nombre;
    }

    esJugador(nombre: string): boolean {
        var i: number;
        if (this.jugadores == null) { // No hay partida
            return false;
        }
        for (i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nombre === nombre) {
                return true;
            }
        }
        return false;
    }

    /**
     * Método invocado al recibir el servidor el evento 'EchoCarta', cuando un jugador tira una carta.
     * @param {*} nombre  del jugador que ha tirado la carta
     * @param {*} carta carta que ha tirado.
     */
    cartaJugada(nombre: string  , carta: Carta) {
        if (this.flagCartaJugada) {
            console.log('Carta repetida. Se ignora');
            return; // Es una carta repetida. Ya hay una en proceso. Prevenir incidente ticket #35
        }
        var index = this.getJugadorIndex(nombre);
        if (index === this.orden[this.turno]) { // compruebo que el jugador tiene el turno
            this.errorCounter = 0; 
            if (this.cartaValida(carta , index)) { // ver si la carta es valida
                var i: number; // elimino la carta del jugador
                for (i=0 ; i< this.jugadores[index].cartas.length; i++) {
                    if (carta.id === this.jugadores[index].cartas[i].id) {
                        this.jugadores[index].cartas.splice(i,1);
                        break;
                    }
                }
                this.baza.push(carta);
                this.flagCartaJugada = true;
                this.enviarEvento('' , { action: "CartaJugada" , data: {jugador: nombre , carta: carta.getId()}});
                this.guardaLog('J');
            } else {
                // El jugador ha tirado una carta no válida (en el arrastre)
                this.enviarEvento(nombre , { action: "CartaInvalida" , data: {jugador: nombre , carta: carta.getId()}});
            }
        } else {
            console.log(`${nombre} ha jugado fuera de turno`);
            this.errorCounter++;
            if (this.errorCounter > 5) { // Muchos errores de turno. Enviamos snapshot para que se sincronice.
                this.errorCounter = 0;
                this.snapshot(nombre);
            }
        }
    }

    siguienteTurno() {
        this.handler.clock.setTimeout(() => {
            var nombreJugador = this.jugadores[this.orden[this.turno]].nombre;
             this.enviarEvento('' , { action: "Turno", data: nombreJugador });
            this.snapshot(nombreJugador);        
            this.enviarEvento(nombreJugador , { action: "Juega" });
        } , 600);
    }

    cartaJugadaOk(nombre: string) {
        this.sincroCartas.push(nombre);
        if (this.sincroCartas.length >= 4) {
            console.log("Sincronización ok - Continuamos");
            this.turno++;
            if (this.turno === 2) {
                this.enviarEvento('' , { action: "NoCanteCambio" });
            }
            if (this.turno > 3) {
                this.rondaTerminada1();
            } else {
                this.siguienteTurno();
            }
            this.sincroCartas = [];
            this.flagCartaJugada = false;
        }
    }

    rondaTerminada1() {
        // ronda terminada. Esperamos 3 segundos antes lanzar el proceso de ronda terminada
        this.handler.clock.setTimeout(() => {
            this.indiceGanador = this.calculaGanadorBaza();
            this.acumulaPuntos(this.indiceGanador);
            this.enviarEvento('' , { action: "BazaGanada" , data: this.jugadores[this.indiceGanador].nombre});
            this.enviarEvento('' , { action: "Puntos" , data: {parejas: this.nombresPareja , puntos: this.puntos}});
        } , 1500);
        this.handler.clock.setTimeout(() => {
            this.recogeCartas(this.indiceGanador);
        } , 2000); 
        this.handler.clock.setTimeout(() => {
            this.rondaTerminada2();
        } , 3500); 
    }

    rondaTerminada2() {
        //hemos terminado ronda. evaluar baza , recoger cartas y pasar a la siguiente
        this.fijarOrden(this.indiceGanador);
        // Si la partida es de vueltas, aqui hay que mirar si ha terminado.
        if (this.vueltas == true && this.hayGanador()) {
            this.partidaTerminada = true;
        }
        this.ronda++;
        this.turno = 0;
        if (this.ronda > 10 || this.partidaTerminada == true) {
            // partida terminada. Poner 10 de últimas. Contar puntos. comunicar resultados.
            if (this.vueltas == false) {
                this.pon10Ultimas(this.indiceGanador);  
            }
            this.enviarEvento('' , { action: "PartidaTerminada" , data: {parejas: this.nombresPareja , puntos: this.puntos}});
            if (this.hayGanador() == false) { // no hay ganador, vamos de vueltas.
                this.guardaLogR(-1);
                this.vueltas = true;
                this.enviarEvento('' , { action: "HayVuelta" });
                this.handler.clock.setTimeout(() => {
                    this.nuevaPartida();
                } , 6000);
            } else { // hay ganador
                this.guardaLogR(this.parejaGanadora(this.indiceGanador));
                this.ganadorPartida();
            }
        } else { // la partida no ha terminado. Continuamos repartiendo carta, eventos de ronda y turno y juega.
            var time1 = 100;
            if (this.ronda === 5) {
                // Si estoy en ronda 5 (al principio) y algun jugador puede cambiar el 7 se hace automaticamente.
                if (this.jugadores[this.indiceGanador].cambio7Posible(this.triunfo)) {
                   this.cambio7(this.jugadores[this.indiceGanador].nombre);
                   time1 = 2500;
                }
                if (this.jugadores[this.miPareja(this.indiceGanador)].cambio7Posible(this.triunfo)) {
                    this.cambio7(this.jugadores[this.miPareja(this.indiceGanador)].nombre);
                    time1 = 2500;
                }
            }
            if (this.ronda <= 5) {
                this.handler.clock.setTimeout(() => {
                    this.repartir1Carta(); // se reparta carta solo en las 4 primeras rondas
                } , time1); 
            }
            var time = time1 + 3500;
            if (this.ronda >5 ) {
                time = time1 + 500; // en el arrastre no hay que esperar tanto porque no se reparten cartas.
            }
            this.handler.clock.setTimeout(() => {
                // Acciones al comienzo de una nueva ronda
                this.guardaLog('C');
                this.enviarEvento('' , { action: "Ronda", data: this.ronda });
                // Aviso de cantes pendientes
                if (this.jugadores[this.indiceGanador].cantesPendientes()) {
                    this.enviarEvento(this.jugadores[this.indiceGanador].nombre , { action: "PuedesCantar" });
                }
                if (this.jugadores[this.miPareja(this.indiceGanador)].cantesPendientes()) {
                    this.enviarEvento(this.jugadores[this.miPareja(this.indiceGanador)].nombre , { action: "PuedesCantar" });
                }
                if (this.jugadores[this.indiceGanador].cambio7Posible(this.triunfo) && this.ronda <= 5) {
                    this.enviarEvento(this.jugadores[this.indiceGanador].nombre , { action: "Cambio7Posible" });
                }
                if (this.jugadores[this.miPareja(this.indiceGanador)].cambio7Posible(this.triunfo) && this.ronda <= 5) {
                    this.enviarEvento(this.jugadores[this.miPareja(this.indiceGanador)].nombre , { action: "Cambio7Posible" });
                }
                var nombreJugador = this.jugadores[this.orden[this.turno]].nombre;
                this.enviarEvento('' , { action: "Turno", data: nombreJugador });
                this.enviarEvento(nombreJugador , { action: "Juega" });
            }, time);
        }
    }

    /**
     * Se llega aqui cuando la partida ha terminado. Aquí se comunica el ganador y acciones posteriores
     */
    ganadorPartida() {
        var ganador = this.parejaGanadora(this.indiceGanador);
        this.enviarEvento('' , { action: "GanadorPartida" , data: this.nombresPareja[ganador] });
        this.vueltas = false
        this.marcador[ganador] += 1;
        var finCoto = false;
        if (this.marcador[ganador] === this.partidasCoto) {
            finCoto = true;
        }
        this.enviarEvento('' , { action: "Marcador" , data: {parejas: this.nombresPareja , 
                                                             marcador: this.marcador , 
                                                             finCoto: finCoto} });
        if (!finCoto) { // si es fin del coto no iniciamos partida nueva. El cliente tendrá que sacar el modal de inicio.                                                
            this.handler.clock.setTimeout(() => {
                this.nuevaPartida();
            } , 6000);
        } else {
            this.gameStarted = false;
            this.handler.disconnect(); // Desconectamos a todos
        }
    }

    /**
     * Invocado por la acción canto, cuando un jugador quiere cantar sus cantes.
     */
    canto(nombre: string) {
        var index: number = this.getJugadorIndex(nombre);
        if (this.indiceGanador < 0) return;
        var secuencia = 0; // Para indicar los cantes multiples
        if (this.indicePareja(index) === this.indicePareja(this.indiceGanador)) {
            var palo = this.jugadores[index].cantar(this.ronda);
            while (palo >= 0) {
                secuencia++;
                var valor: number = 20;
                if (palo === this.triunfo.palo) {
                    valor = 40;
                }
                var nombrePalo = '';
                var indexPalo = -1;
                if (this.ronda < 5 || valor === 40) {
                    nombrePalo = this.baraja.paloToString(palo);
                    indexPalo = palo;
                }
                this.enviarEvento('' , { action: "HaCantado", data: {jugador: nombre , 
                                                                    valor: valor, 
                                                                    palo: nombrePalo , 
                                                                    indexPalo: indexPalo , 
                                                                    secuencia: secuencia
                                                                    }});
                this.guardaLogCante('N' , index , valor , palo);
                this.puntos[this.indicePareja(index)] += valor;
                palo = this.jugadores[index].cantar(this.ronda);
            }
            // Comunicar puntos. Si vamos de vueltas comprobar si ha terminado la partida. si es asi rutina de ganador
            this.enviarEvento('' , { action: "Puntos" , data: {parejas: this.nombresPareja , puntos: this.puntos}});
            if (this.vueltas) {
                if (this.hayGanador()) {
                    this.handler.clock.setTimeout(() => {
                        this.enviarEvento('' , { action: "PartidaTerminada" , data: {parejas: this.nombresPareja , puntos: this.puntos}});
                        this.ganadorPartida();
                    } , 1500);
                }
            }
        }
    }

    cambio7(nombre: string) {
        var index = this.getJugadorIndex(nombre);
        if (this.indiceGanador < 0) return;
        if (this.indicePareja(index) === this.indicePareja(this.indiceGanador)) {
            var carta = this.jugadores[index].cambia7(this.triunfo); // #54. Para evitar mensajes repetidos cambio7
            if (carta == null) {
                console.log("Cambio 7 invalido. El jugador no tiene el 7.");
                return;
            } else {
                this.triunfo = carta;
            }
            var carta = this.baraja.cartas.pop(); // Quitamos la última carta, que marca el triunfo
            this.baraja.cartas.push(this.triunfo); // añadimos la carta cambiada (el 7) en la última posición.
            this.enviarEvento('' , { action: "HaCambiado7", data: {jugador: nombre , carta: carta.id}});
            this.guardaLog7('7' , index);
        }
        // Comprobar si con el cambio del 7 puede cantar
        if (this.jugadores[index].cantesPendientes()) {
            this.enviarEvento(this.jugadores[index].nombre , { action: "PuedesCantar" });
        }
    }

    enviarEvento(nombre: string  , mensaje: any) {
        if (this.handler != null) {
            if ('data' in mensaje) {
                console.log("ENVIO ->" , nombre , "<-" , mensaje.action , mensaje.data);
            } else {
                console.log("ENVIO ->" , nombre , "<-" , mensaje.action);
            }
            if (nombre == '') { // No hay nombre. hacemos un sendAll
                this.handler.sendAll(mensaje);
            } else {
                this.handler.sendOne(nombre , mensaje);
            }
        } 
    }

    /**
     * Reparto inicial de cartas Se reparte a cada jugador 6 cartas en dos bloques de tres. Se envian mensajes al servidor
     * con cada carta repartida y se decalan en el tiempo para que puedan ser procesados por el cliente.
     * Devuelve el valor de time que ha usado para el timeout de reparto.
     */
    repartirCartas(): number {
        var i: number , j: number , k: number, time = 0, carta: Carta;
        for (i= 0 ; i < 2; i++) {
            for (j = 0; j < 4; j++) {
                var indice = this.orden[j];
                for (k = 0; k < 3; k++) {
                    carta = this.baraja.cogerCarta();
                    this.jugadores[indice].tomaCarta(carta);
                    this.handler.clock.setTimeout(this.enviar1Carta , time , this , this.jugadores[indice].nombre , carta.id); 
                    time += 400;
                }
            }
        }
        return time;
    }

    /**
     * Reparte a los jugadores una carta y le envia la action Dar1Carta
     */
    repartir1Carta() {
        var j: number, carta: Carta, time = 0;
        for (j = 0; j < 4 ; j++) {
            carta = this.baraja.cogerCarta();
            this.jugadores[this.orden[j]].tomaCarta(carta);
                this.handler.clock.setTimeout(this.enviar1Carta , time , this , this.jugadores[this.orden[j]].nombre , carta.id); 
            time += 800;
        }
    }

    /**
     * Método que envia la carta al servidor
     */
    enviar1Carta(game: GoGame , nombre: string , id: number) {
        game.enviarEvento('' , { action: "Dar1Carta", data: {jugador: nombre , carta: id }});
    }

    /**
     * Devuelve el indice del array de jugadores, pasando el nombre del jugador.
     * @param {*} nombre 
     */
    getJugadorIndex(nombre: string): number {
        var i;
        for (i = 0; i < this.jugadores.length ; i++) {
            if (this.jugadores[i].nombre === nombre) {
                return i;
            }            
        }
    }
    
    /**
     * Comprueba si es posible jugar esa carta. En el descarte (cuatro primeras rondas cualquier carta es posible),
     * pero en el arrastre hay límites, excepto si es el primer jugador que tira carta en la ronda
     * @param {*} carta - carta a validar
     * @param {*} index - indice del jugador que juega.
     */
    cartaValida(carta: Carta , index: number): boolean {
        if (this.ronda < 5 || this.baza.length == 0) { // siempre valida para las 4 primeras rondas o para el primero en jugar
            return true; // en el arrastre comprobar si la carta es válida
        }
        // Validación de carta para el arrastre, cuando no es la primera
        var resto = []; // resto de cartas del jugador (excepto la jugada)
        this.jugadores[index].cartas.forEach( c => {
            if (c.id != carta.id) {
                resto.push(c);
            }
        });
        var paloArrastre = this.baza[0].palo;
        var cartaGanadora = this.baza[this.indiceGanadorBaza()]; // carta que hasta el momento gana el arrastre
        var bazaPropia = false;
        if (this.indicePareja(this.calculaGanadorBaza()) === this.indicePareja(index)) {
            bazaPropia = true;
        }
        if (bazaPropia) { 
            if (carta.palo === paloArrastre) {
                return true;
            } else { // la carta es valida si no hay carta del palo de arrastre
                return !this.hayPalo(resto, paloArrastre);
            }
        } else { // no es baza propia
            if (carta.palo === paloArrastre) {
                if (cartaGanadora.compara(carta, this.triunfo) === -1) { // ok si la mato
                    return true;
                } else { // no mata
                    if (paloArrastre === this.triunfo.palo) { // el palo de arrastre es triunfo
                        return !this.tieneGanadora(resto , cartaGanadora, this.triunfo);
                    }
                    // el palo de arrastre no es triunfo
                    if (cartaGanadora.palo === this.triunfo.palo) {
                        return true; // El ganador mata con triunfo. no es posible matar (?)
                    } else { // el ganador no ha matado con triunfo
                        return !this.tieneGanadora(resto , cartaGanadora, cartaGanadora); // true si no tengo otra carta mejor del mismo palo
                    }
                }
            } else { // la carta no es palo arrastre
                if (this.hayPalo(resto, paloArrastre)) { // mal. tiene cartas del palo arrastre
                    return false;
                } else { // no tiene cartas del palo arrastre
                    if (cartaGanadora.compara(carta , this.triunfo) === -1) { // mato
                        return true;
                    } else {
                        return !this.tieneGanadora(resto, cartaGanadora, this.triunfo);
                    }
                }
            }
        }
    }
    
    /**
     * Devuelve true si en el array cartas (primer parámetro), hay alguna carta del palo (segundo parametro) 
     */
    hayPalo(cartas: Array<Carta>, palo: number): boolean {
        var result = false;
        cartas.forEach(c => {
            if (c.palo === palo) {
                result = true;
            }
        });
        return result;
    }

    /**
     * Devuelve true si en cartas hay alguna que mata a carta, teniendo en cuenta el triunfo (3er parametro)
     */
    tieneGanadora(cartas: Array<Carta> , carta: Carta , triunfo: Carta): boolean {
        var result = false;
        cartas.forEach( c => {
            if (carta.compara(c, triunfo) === -1) {
                result = true;
            }
        });
        return result;
    }

    /**
     * Devuelve el índice del array this.jugadores que ha ganado la baza. Las cartas de la baza están
     * en el array this.baza y el orden de juego en el array this.orden
     * @returns 
     */
    calculaGanadorBaza(): number {
        var indiceGanador = 0; // en principio manda el que sale.
        var i: number;
        for (i = 1; i < this.baza.length; i++) {
            var carta1 = this.baza[indiceGanador];
            var carta2 = this.baza[i];
            if (carta1.compara(carta2, this.triunfo) === -1) {
                indiceGanador = i;
            }
        }
        return this.orden[indiceGanador]; 
    }

    indiceGanadorBaza(): number {
        var indiceGanador = 0; // en principio manda el que sale.
        var i: number;
        for (i = 1; i < this.baza.length; i++) {
            var carta1 = this.baza[indiceGanador];
            var carta2 = this.baza[i];
            if (carta1.compara(carta2, this.triunfo) === -1) {
                indiceGanador = i;
            }
        }
        return indiceGanador; 
    }

    /**
     * Acumula los puntos de la baza
     * @param {*} indiceGanador 
     */
    acumulaPuntos(indiceGanador: number) {
        this.baza.forEach(carta => {
            this.puntos[this.indicePareja(indiceGanador)] += carta.puntos();
        });
    }

    /**
     * Coloca las cartas de la baza en el acumulado de cartas de la pareja correspondiente
     * @param {type} indiceGanador 
     * @returns {undefined}
     */
    recogeCartas(indiceGanador: number) {
        // Pone el flag de recoger cartas si es necesario
        if (this.jugadores[indiceGanador].recogeCartas == false &&
            this.jugadores[this.miPareja(indiceGanador)].recogeCartas == false) {
                this.jugadores[indiceGanador].recogeCartas = true;
            }
        var pareja = this.indicePareja(indiceGanador);
        this.baza.forEach(carta => {
            this.cartasRecogidas[pareja].push(carta);
        });
        this.baza = [];
        var nombre: string;
        if (this.jugadores[indiceGanador].recogeCartas == true) {
            nombre = this.jugadores[indiceGanador].nombre;
            this.enviarEvento('' , { action: "RecogeCartas" , data: nombre});
        } else {
            nombre = this.jugadores[this.miPareja(indiceGanador)].nombre;
            this.enviarEvento('' , { action: "RecogeCartas" , data: nombre});
        }
    }
    
    /**
     * Fija el orden de juego, colocando como primer jugador el valor que se pasa como parámetro.
     * Los siguientes son correlativos
     */
    fijarOrden(primero: number) {
        this.orden[0] = primero;
        var i: number;
        for (i = 1; i < 4 ; i++) {
            this.orden[i] = this.orden[i-1] +1;
            if (this.orden[i] > 3) {
                this.orden[i] = 0;
            }
        }
    }
    
    /**
     * Devuelve true si alguna de las parejas ha llegado a los 101 puntos. false en caso contrario.
     */
    hayGanador(): boolean {
        if (this.puntos[0] > 100 || this.puntos[1] > 100) {
            return true;
        }
        return false;
    }

    /**
     * Determina que pareja ha ganado: 
     * - Si la partida es de ida gana el que supera los 100 puntos. Si ambas parejas tienen más de 100, el que ha hecho la última baza
     * - Si es partida de vueltas el que tiene más puntos.
     * @param {*} indiceGanador - indice del jugador que ha ganado la última baza.
     */
    parejaGanadora(indiceGanador: number): number {
        if (this.vueltas == true) {
            if (this.puntos[0] > this.puntos[1]) {
                return 0;
            } else {
                return 1;
            }
        } else {
            if (this.puntos[0] > 100 && this.puntos[1] > 100) {
                return this.indicePareja(indiceGanador);
            } else {
                if (this.puntos[0] > 100) {
                    return 0;
                } else {
                    return 1;
                }
            }
        }
    }

    /**
     * Añade las 10 de últimas a la pareja ganadora de la última baza
     */
    pon10Ultimas(ultimoGanador: number) {
        this.puntos[this.indicePareja(ultimoGanador)] += 10;
    }

    /**
     * Devuelve quien es tu pareja. Se pasa como parámetro el indice del array de jugadores, y
     * devuelve el indice del array que es su pareja.
     * Es decir si index es 0, devuelve 2, si es 1, devuelve 3, etc.
     */
    miPareja(index: number): number {
        switch (index) {
            case 0:
                return 2;
            case 1:
                return 3;
            case 2: 
                return 0;
            case 3:
                return 1;
        }
        return -1;
    }

    /**
     * Devuelve el indice de la pareja a la que pertenece el indice que se pasa como parámetro
     * Osea si si index es 0 o 2, devuelve 0, si es 1 o 3 devuelve 1
     * @param {*} index 
     */
    indicePareja(index: number): number {
        switch (index) {
            case 0:
            case 2:
                return 0;
            case 1:
            case 3:
                return 1;
        }
        return -1;
    }

    guardaLog(tipo: string) {
        var i: number, j: number;
        for (i = 0; i < 4; i++) {
            switch (tipo) {
                case 'I':
                    for (j = 0; j < 4; j++) {
                        this.log[i].push('I ' + j + ' ' + this.jugadores[j].nombre);
                    }
                    break;
                case 'M':
                    if (this.vueltas) {
                        this.log[i].push('M 1 ' + this.puntos[0] + ' ' + this.puntos[1]);
                    } else {
                        this.log[i].push('M 0 0 0');
                    }
                    break;
                case 'T':
                    this.log[i].push('T ' + (this.triunfo.palo + 1) + ' ' + (this.triunfo.valor + 1));
                    break; 
                case 'C':
                    var txt = 'C';
                    this.jugadores[i].cartas.forEach( carta => {
                        txt = txt + ' ' + (carta.palo + 1) + ' ' + (carta.valor + 1);
                    });
                    this.log[i].push(txt);
                    break;
                case 'J':
                    j = this.baza.length - 1;
                    this.log[i].push('J ' + this.orden[this.turno] + ' ' + (this.baza[j].palo + 1) + ' ' + (this.baza[j].valor + 1));
                    break;
                case 'N':

            }  
       }
    }

    guardaLogCante(tipo:string , index: number, valor: number , palo: number) {
        var i: number, j: number;
        for (i = 0; i < 4; i++) {
            valor === 20 ? j = 0 : j = 1;
            this.log[i].push('N ' + index + ' ' + j + ' ' + (palo +1));
        }
    }

    guardaLog7(tipo: string, index: number) {
        var i: number, j: number;
        for (i = 0; i < 4; i++) {
            this.log[i].push('7 ' + index);
        }
    }

    guardaLogR(ganador: any) {
        var i: number, j: number;
        for (i = 0; i < 4; i++) {
            this.log[i].push('R ' + ganador + ' ' + this.puntos[0] + ' ' + this.puntos[1]);
        }
        this.saveFiles();
    }

    saveFiles() {
        var nombre: string , i: number , path: string,  todo: string;
        var d = new Date();
        nombre = 'F' + d.getFullYear() + '.' + (d.getMonth()+1) + '.' + d.getDate() + "-" + d.getHours() + "." + d.getMinutes() + 
                '.' + d.getSeconds() + '_';
        for (i = 0; i < 4; i++) {
            path = 'logs/' + nombre + this.jugadores[i].nombre + '.txt';
            console.log('Path:' , path);
            todo = '';
            this.log[i].forEach(linea => {
                todo += linea + os.EOL;
            });
            fs.writeFile(path, todo, function (err) {
                if (err) throw err;
                console.log('fichero salvado');
            });
        }        
    }

    snapshot(nombre: string) {
        if (this.triunfo == null) {
            this.handler.clock.setTimeout(() => {
                this.snapshot(nombre);
            } , 1000);  
            return;          
        }
        var xnombres: Array<string> = [];
        var xcartas: Array<Array<number>> = [];
        var xcantes: Array<Array<number>> = [];
        var nCartas = this.baraja.cartas.length;
        var xmazo = { triunfo: this.triunfo.id , numCartas : nCartas};
        this.jugadores.forEach(jugador => {
            xnombres.push(jugador.nombre);
            var cartasJugador: Array<number> = [];
            jugador.cartas.forEach(carta => {
                cartasJugador.push(carta.id);
            }) 
            xcartas.push(cartasJugador);
            xcantes.push(jugador.cantesCantados);
        });
        var i = 0;
        var bazaCartas = [] , bazaNombres = [];
        this.baza.forEach(carta => {
            bazaCartas.push(carta.id);
            bazaNombres.push(this.jugadores[this.orden[i]].nombre);
            i++;
        })
        var xbaza = {cartas: bazaCartas, nombres: bazaNombres};
        var xturno: string;
        if (this.turno <= 3) {
            xturno = this.jugadores[this.orden[this.turno]].nombre;
        }
        var xganadas = [];
        xganadas.push({nombre: this.jugadores[0].nombre, numCartas: this.cartasRecogidas[0].length});
        xganadas.push({nombre: this.jugadores[1].nombre, numCartas: this.cartasRecogidas[1].length});
        var xpuntos = {parejas: this.nombresPareja , puntos: this.puntos, vueltas: this.vueltas};
        var data = { nombres: xnombres , cartas : xcartas , baza: xbaza , mazo: xmazo , turno: xturno , 
                     ganadas: xganadas , cantes: xcantes, puntos: xpuntos};
        this.enviarEvento(nombre , { action: 'Snapshot' , data: data });
    }

    revisionBaza(nombre: string) {
        var indicePareja = this.indicePareja(this.getJugadorIndex(nombre));
        if (this.cartasRecogidas[indicePareja].length === 0) return;
        var ultimaBaza = [];
        var i: number;
        for (i = this.cartasRecogidas[indicePareja].length - 4; i < this.cartasRecogidas[indicePareja].length; i++) {
            ultimaBaza.push(this.cartasRecogidas[indicePareja][i].id);
        }
        this.enviarEvento('' , { action: 'RevisionBaza' , data: {nombre: nombre , ultimaBaza: ultimaBaza }});
    }
}
