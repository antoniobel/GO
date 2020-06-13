/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { goMainBase } from "./goMainBase";
import { Client , Room } from "../colyseusclient/colyseus";
import { main, debug } from "./main";

export class GoMainMulti extends goMainBase {

    public movimiento: boolean = true;
    private usuariosConectados: Array<any>;
    private client: Client;

    constructor() {
        super();
        this.init();
        this.initRooms();
    }

    private init(): void {
        document.getElementById("siguiente").onclick = this.btnSiguiente;
        document.getElementById("crear").onclick = this.btnCrear;
        document.getElementById("unirse").onclick = this.btnUnirse;
        document.getElementById("volver1").onclick = this.volver1;
        document.getElementById("volver2").onclick = this.volver2;
    }

    private initRooms(): void {
        var host = window.document.location.host.replace(/:.*/, '');
        this.client = new Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));
    }

    private btnSiguiente(): void {
        var name = (<HTMLInputElement>document.getElementById("name"));
        if (!name.checkValidity()) {
            alert("El nombre es obligatorio");
            return;
        }
        main.nombreJugador = (<HTMLInputElement>document.getElementById("name")).value; 
//        if (main.nombreJugador == '') return;
        var crear = true;
        if ((<HTMLInputElement>document.getElementById("rdunirse")).checked) {
            crear = false;
        }
        if (crear){ // crear room
            (<HTMLInputElement>document.getElementById("nombreJugador1")).value = main.nombreJugador;
            main.verTab(1);
        } else { // unirse a una room
            (<HTMLInputElement>document.getElementById("nombreJugador2")).value = main.nombreJugador;
            main.vaciaSelect(document.getElementById("partidas"));
            main.client.getAvailableRooms("go_room").then((rooms: Array<Room>)  => {
                main.allRooms = rooms;
                main.allRooms.forEach( room => {
                    var option = document.createElement("option");
                    option.text = room.metadata.partida;
                    (<HTMLSelectElement>document.getElementById("partidas")).add(option);            
                });
                main.verTab(2);            
            })
            .catch((e: Error) => {
                if (debug) console.log(e.message);
            });
        }
    }

    private btnCrear(): void {
        if (!(<HTMLInputElement>document.getElementById("nombrepartida")).checkValidity()) {
            alert("El nombre de la partida es obligatorio");
            return;
        }
        if (!(<HTMLInputElement>document.getElementById("partidascoto")).checkValidity()) {
            alert("Debe ser un número entero entre 1 y 9");
            return;
        }
        var partida = (<HTMLInputElement>document.getElementById("nombrepartida")).value; 
        var partidasCoto = (<HTMLInputElement>document.getElementById("partidascoto")).value; 
        var publico = (<HTMLInputElement>document.getElementById("cbpublico")).checked; 
        main.client.getAvailableRooms("go_room").then((rooms: Array<Room>)  => {
            main.allRooms = rooms;
            var existeRoom = false;
            for (var i = 0; i < main.allRooms.length; i++) {
                if (main.allRooms[i].metadata.partida === partida) {
                    existeRoom = true;
                    break;
                }
            }
            if (existeRoom) {
                alert("El nombre de la partida ya existe en el servidor. Usa otro nombre");
                return;
            }
            var data = { nombre: main.nombreJugador , partida: partida, pcoto: partidasCoto, publico: publico};
            main.client.create("go_room" , data).then((room_instance: Room) => {
                main.defineCallback(room_instance);
            }).catch((e: Error) => {
                main.darAviso("Error al crear la partida " + e.message);
                if (debug) console.log("Se ha recibido un error", e.message);
          });
            (<HTMLInputElement>document.getElementById("nombreJugador3")).value = main.nombreJugador;
            (<HTMLInputElement>document.getElementById("nombrePartida3")).value = partida;
            main.verTab(3);
        })
    }

    private btnUnirse(): void {
        var partida = (<HTMLSelectElement>document.getElementById("partidas")).value; 
        if (debug) console.log("Nos unimos a " , partida);
        var roomId = main.obtenerRoomId(partida);
        main.client.joinById(roomId , { nombre: main.nombreJugador}).then((room_instance: Room) => {
            main.defineCallback(room_instance);
        }).catch((e: Error) => {
            main.darAviso("Error al conectar " + e.message);
            if (debug) console.log("Se ha recibido un error", e.message);
      });
    }

    private volver1(): void {
        main.verTab(0);
        document.getElementById("name").focus(); 
        (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
    }

    private volver2(): void {
        if (main.conectado) {
            main.room.leave();
            main.limpiarDatos();
            main.conectado = false;
        }
        main.verTab(0);
        document.getElementById("name").focus(); 
        (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
    }

    public defineCallback(room_instance: Room) {
        main.room = room_instance; // para poder manejarla fuera del then     
        main.conectado = true;         
        main.room.onMessage("mensajeGo" , function(message) {
            var d = new Date();
            if (debug) console.log(d.getTime() , message);
            if ('ping' in message) {
                main.enviarMensaje({ping: 0});
                return;
            }
            main.enviarMensaje({echo: message}); // Funcion eco. Mantener para verificar el log en el servidor. 
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

    // Métodos de acción
    // En estos métodos si se puede usar this (aunque sean llamados por métodos de eventos donde no se puede usar this. Como se llaman
    // con un main.xxxx entonces ya entiende this. !!!Hay que joderse!!!!)
    public abrirWizard(): void {
        this.vaciaPareja(document.getElementById("pareja1"));
        this.vaciaPareja(document.getElementById("pareja2"));
//        document.getElementById("wizard").style.display = "block"; // abrimos el asistente
        this.verTab(0); // Mostramos el primer panel
        document.getElementById("name").focus(); 
        (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
    }

    public abrirDialogoInicio(): void {
        this.abrirWizard();
    }

    private verTab(n: number): void {
        document.getElementById("wizard").style.display = "none";
        var w: string;
        for (var i = 0; i < 4; i++) {
            w = "w" + i;
            if (i === n) {
                document.getElementById(w).style.display = "block";
            } else {
                document.getElementById(w).style.display = "none";
            }
        }
        document.getElementById("wizard").style.display = "block";
    }

    public limpiarDatos(): void {
        this.vaciaSelect(document.getElementById("usuarios2"));
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
            (<HTMLSelectElement>document.getElementById("usuarios2")).add(option);    
            option = document.createElement("option");
            option.text = user.nombre;
            (<HTMLSelectElement>document.getElementById("usuarios")).add(option);    
        })
    }

}
