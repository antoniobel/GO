/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { goMainBase } from "./goMainBase";
import { main, debug } from "./main";
import { Client , Room } from "colyseus.js";

export class GoMainMono extends goMainBase {

    public movimiento: boolean = true;
    private usuariosConectados: Array<any>;
    private client: Client;

    constructor() {
        super();
        this.init();
    }

    private init():void {
        document.getElementById("conectar").onclick = this.btnConectar;
        document.getElementById("desconectar").onclick = this.btnDesconectar;
    }

    // Métodos que manejan eventos onclick de los diálogos modales y de los botones incrustados en el canvas
    // Ojo!! Estos métodos son llamados como respuestas a eventos y tienen un ámbito global. En ellos no se puede usar this para
    // referirse a propiedades / métodos de GoMain. En su lugar hay que usar main     
    /**
     * Conecta con el servidor, identificándose con nombreJugador. Recibe una instancia de room
     * Invocado al pulsar el botón conectar
     */
    private btnConectar(): void {
        if (main.conectado) return;
        main.nombreJugador = (<HTMLInputElement>document.getElementById("name")).value;
        if (debug) console.log(main.nombreJugador);
        if (main.nombreJugador == '') return;
        var host = window.document.location.host.replace(/:.*/, '');
        main.client = new Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));
        // Parámetros de la partida
        var nombrePartida = "GO2020-001";
        var partidasCoto = 2;
        var publico = true;
        main.client.getAvailableRooms("go_room").then((rooms: Array<Room>)  => {
            main.allRooms = rooms;
            var existeRoom = false;
            for (var i = 0; i < main.allRooms.length; i++) {
                if (main.allRooms[i].metadata.partida === nombrePartida) {
                    existeRoom = true;
                    break;
                }
            }
            if (!existeRoom) { // La partida no existe. se crea
                var data = { nombre: main.nombreJugador, partida: nombrePartida, pcoto: partidasCoto, publico: publico };
                main.client.create("go_room", data).then((room_instance: Room) => {
                    main.defineCallback(room_instance);
                }).catch((e: Error) => {
                    main.darAviso("Error al crear la partida " + e.message);
                    if (debug) console.log("Se ha recibido un error", e.message);
                });    
            } else { // La partida ya existe. nos unimos
                var roomId = main.obtenerRoomId(nombrePartida);
                main.client.joinById(roomId, { nombre: main.nombreJugador }).then((room_instance: Room) => {
                    main.defineCallback(room_instance);
                }).catch((e: Error) => {
                    main.darAviso("Error al conectar " + e.message);
                    if (debug) console.log("Se ha recibido un error", e.message);
                });    
            }
        })
        .catch((e: Error) => {
            if (debug) console.log(e.message);
        });
    }

    public defineCallback(room_instance: Room) {
        main.room = room_instance; // para poder manejarla fuera del then     
        main.conectado = true;
        main.room.onMessage("mensajeGo", function (message) {
            var d = new Date();
            if (debug) console.log(d.getTime(), message);
            if ('ping' in message) {
                main.enviarMensaje({ ping: 0 });
                return;
            }
            main.enviarMensaje({ echo: message }); // Funcion eco. Mantener para verificar el log en el servidor. 
            if ('code' in message) {
                if (message.code === 1) { // nombre repetido. hay que desconectarse.
                    main.nombreRepetido();
                }
            }
            if ('action' in message) {
                if (message.action === "Jugadores") {
                    main.jugadoresConectados(message.data);
                } else {
                    if (main.manejador !== undefined)
                        main.manejador.procesaAction(message.action, message.data);
                }
            }
            if ('conexiones' in message) {
                main.conexiones(message.conexiones);
            }
        });
    }

    /**
     * Cuando el usuario pulsa el botón desconectar.
     */
    private btnDesconectar(): void {
        main.room.leave();
        document.getElementById("wizard").style.display = "none";
    }

    // Métodos de acción
    // En estos métodos si se puede usar this (aunque sean llamados por métodos de eventos donde no se puede usar this. Como se llaman
    // con un main.xxxx entonces ya entiende this. !!!Hay que joderse!!!!)
    public abrirDialogoInicio() {
        this.vaciaPareja(document.getElementById("pareja1"));
        this.vaciaPareja(document.getElementById("pareja2"));
        document.getElementById("wizard").style.display = "block"; // abrimos el diálogo
        document.getElementById("name").focus();
        (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
    }

    public limpiarDatos(): void {
        this.vaciaSelect(document.getElementById("usuarios"));
        this.vaciaSelect(document.getElementById("pareja1"));
        this.vaciaSelect(document.getElementById("pareja2"));
    }

    /**
     * Se ejecuta cuando llega un mensaje 'conexiones'. Se vacian todos los selectores y se ponen todos
     * los usuarios conectados en el selector de usuarios.
     * El parámetro es un array de todos los usuarios conectados
     */
    private conexiones(conexiones) {
        this.usuariosConectados = conexiones;
        var option;
        this.limpiarDatos();
        this.usuariosConectados.forEach(user => {
            option = document.createElement("option");
            option.text = user.nombre;
            (<HTMLSelectElement>document.getElementById("usuarios")).add(option);
        })
    }

}

