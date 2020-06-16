/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";
import { shortcut } from "./shortcut2";
import { main, ui , debug , setDebug } from "./main";
import { GoComun } from "./goComun";
import { GoJugador } from "./goJugador";
import { GoPublico } from "./goPublico";
import { RoomAvailable, Room } from "colyseus.js";

export class goMainBase {

    protected manejador: GoComun;
    public nombreJugador: string;
    protected room: Room;
    protected conectado: boolean = false;
    protected allRooms: Array<RoomAvailable<any>>;

    constructor() {
        this.initBase();
        this.initShorcuts();
        this.posicionarBotones();
    }

    private initBase() {
        document.getElementById("usuarios").onclick = this.incluir;
        document.getElementById("pareja1").onclick = () => { this.excluir('pareja1'); };
        document.getElementById("pareja2").onclick = () => { this.excluir('pareja2'); };
        document.getElementById("comenzar").onclick = this.btnComenzar;
        document.getElementById("close1").onclick = this.close1;
        document.getElementById("close2").onclick = this.close2;
        document.getElementById("botonsi").onclick = this.botonsi;
        document.getElementById("botonno").onclick = this.botonno;
        document.getElementById("cante").onclick = this.cantar;
        document.getElementById("cambio7").onclick = this.cambio7;
        document.getElementById("ordenar").onclick = (event) => { this.ordenar(event); };
        document.getElementById("salir").onclick = this.salir;
        document.getElementById('canvas').onclick = (event) => { this.canvasClicked(event); };

    }

    private initShorcuts(): void {
        var scut = new shortcut();
        scut.add("Ctrl+X", function () {
            main.requestSnapshot();
        }, '');
        scut.add("Ctrl+A", function () {
            if (main.movimiento) {
                main.movimiento = false;
            } else {
                main.movimiento = true;
            }
        }, '');
        scut.add("Alt+N", function () {
            if (ui.chupito.current === -1) {
                ui.chupito.ponerChupito();
            } else {
                ui.chupito.quitarChupito();
            }
            ui.dibujar();
        }, '');
        scut.add("Alt+D", function () {
            if (debug) {
                console.log("Debug desactivado");
                setDebug(false);
            } else {
                console.log("Debug activado");
                setDebug(true);
            }
        }, '');
    }

    /**
     * Coloca los botones en su posición y los deja como ocultos
     */
    private posicionarBotones() {
        if (debug) console.log("Posicionar botones");
        var botonCante = document.getElementById("cante");
        botonCante.style.position = "absolute";
        botonCante.style.left = Math.floor(window.innerWidth - 110) + "px";
        botonCante.style.top =  Math.floor(window.innerHeight - 70) + "px";
        var botoncambio7 = document.getElementById("cambio7");
        botoncambio7.style.position = "absolute";
        botoncambio7.style.left = Math.floor(window.innerWidth - 110) + "px";
        botoncambio7.style.top =  Math.floor(window.innerHeight - 120) + "px";
        var salir = document.getElementById("salir");
        salir.style.position = "absolute";
        salir.style.left = Math.floor(window.innerWidth - 150) + "px";
        salir.style.top =  Math.floor(30) + "px";     
        botonCante.style.display = "none"; 
        botoncambio7.style.display = "none";
        salir.style.display = "none";

        var ordenar = document.getElementById("ordenar");
        ordenar.style.position = "absolute";
        ordenar.style.left = Math.floor(window.innerWidth - 210) + "px";
        ordenar.style.top =  Math.floor(window.innerHeight - 70) + "px";
        ordenar.style.display = "none";

        var puntos = document.getElementById("puntos");
        puntos.style.position = "absolute";
        puntos.style.left = "15px";
        puntos.style.top =  Math.floor(window.innerHeight - 100) + "px";
        puntos.style.display = "none";
        if (debug) console.log("Fin Posicionar botones");
    }

    /**
     * Evento onclick lista usuarios. Mueve los jugadores a alguna de las listas de parejas, si no están completas.
     * Cuando las dos parejas están completas, habilita el botón comenzar
     */
    private incluir(): void {
        var usuarios = <HTMLSelectElement>document.getElementById("usuarios");
        var pareja1 = <HTMLSelectElement>document.getElementById("pareja1");
        var pareja2 = <HTMLSelectElement>document.getElementById("pareja2");
        var user = usuarios.value;
        if (user != '') {
            var index = usuarios.selectedIndex;
            var option = document.createElement("option");
            option.text = user;
            if (pareja1.length < 2) {
                pareja1.add(option);
                usuarios.remove(index);
            } else {
                if (pareja2.length < 2) {
                    pareja2.add(option);
                    usuarios.remove(index);
                }
            }
        }
        if (pareja1.length === 2 && pareja2.length === 2) {
            (<HTMLButtonElement>document.getElementById("comenzar")).disabled = false;
        } else {
            (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
        }
    }

    /**
     * Quita el elemento seleccionado de la lista de parejas donde se ha pulsado y lo pasa a la lista de jugadores.
     */
    private excluir(selector: string): void {
        var pareja = <HTMLSelectElement>document.getElementById(selector);
        var user = pareja.value;
        var index = pareja.selectedIndex;
        var usuarios = <HTMLSelectElement>document.getElementById("usuarios");
        var option = document.createElement("option");
        option.text = user;
        usuarios.add(option);
        pareja.remove(index);
        (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
    }

    /**
     * Cierre del diálogo de inicio
     */
    private close1(): void {
        document.getElementById("wizard").style.display = "none"; // cerramos el diálogo de inicio
        if (main.conectado) {
            main.room.leave();
            main.limpiarDatos();
            main.conectado = false;
        }
    }

    /**
     * Cierre del diálogo de fin de partida
     */
    private close2(): void {
        document.getElementById("modalfin").style.display = "none"; // cerramos el diálogo fin partida
        if (main.manejador.partidaTerminada.finCoto) { // Al final del coto el servidor desconecta a todos. Limpiamos selects y empezamos.
            ui.canvas.ponerFondo();
            main.limpiarDatos();
            main.abrirDialogoInicio();
        }
    }

    /**
     * Boton si del diálogo modal si/no
     */
    private botonsi(): void {
        if (main.manejador.cancelarPartida()) {
            main.manejador = undefined; // Anulamos el manejador para que no lleguen mensajes. (Solo para espectadores)
        };
    }

    /**
     * Boton no del diálogo modal si/no
     */
    private botonno(): void {
        document.getElementById("modalsino").style.display = "none";
    }

    private cantar(): void {
        main.manejador.cantar();
    }
    
    private cambio7(): void {
        main.manejador.cambio7();
    }
    
    private ordenar(event: MouseEvent): void {
        main.manejador.ordenar(event);
    }
    
    private salir(): void {
        document.getElementById("msgsino").innerHTML =  main.manejador.mensajeSalir();
        document.getElementById("modalsino").style.display = "block";
    }

    private canvasClicked(e: MouseEvent) {
        main.manejador.canvasClicked(e);
    }
 
    /**
     * Invocado cuando se pulsa el botón comenzar partida. Lanza al servidor el mensaje ComenzarPartida con los jugadores 
     * que participan. Ojo como se envian los jugadores: jugador 1 pareja 1, jugador 1 pareja 2, jugador 2 pareja 1 y 
     * jugador 2 pareja 2. Esto se convertirá directamente en el array de jugadores que mantiene el servidor. 
     */
    private btnComenzar(): void {
        var pareja1 = <HTMLSelectElement>document.getElementById("pareja1");
        var pareja2 = <HTMLSelectElement>document.getElementById("pareja2");
        if (pareja1.length < 2 || pareja2.length < 2)  {
            return;
        }    
        var jugadores = [];
        jugadores.push(pareja1.options[0].label);
        jugadores.push(pareja2.options[0].label);
        jugadores.push(pareja1.options[1].label);
        jugadores.push(pareja2.options[1].label);
        main.enviarMensaje({ action: "ComienzaPartida" , datos: jugadores });
    }

    // Métodos de acción
    // En estos métodos si se puede usar this (aunque sean llamados por métodos de eventos donde no se puede usar this. Como se llaman
    // con un main.xxxx entonces ya entiende this. !!!Hay que joderse!!!!)
    public mostrarBotones() {
        document.getElementById("cante").style.display = "block"; 
        document.getElementById("cambio7").style.display = "block";
        document.getElementById("salir").style.display = "block";
        document.getElementById("ordenar").style.display = "block";
    }

    /**
     * Accion enviada por el servidor con los jugadores. Los que no están en la lista son espectadores.
     * Se crea el manejador correspondiente. Si el usuario local está en la lista de jugadores se crea un 
     * manejador de jugador. Si no lo está se crea un manejador de público.
     * data es un array con los nombres de los jugadores.
     */
    protected jugadoresConectados(data) {
        var i: number;
        for (i = 0; i < data.length; i++) {
            if (data[i] === this.nombreJugador) {
                this.manejador = new GoJugador(this.nombreJugador, this.room); // el usuario es un jugador
                return;
            } 
        }
        this.manejador = new GoPublico(this.nombreJugador, this.room); // el usuario es un espectador
    }

    protected darAviso(mensaje: string): void {
        document.getElementById("msg").innerHTML = mensaje;
        document.getElementById("modalmsg").style.display = "block";
        setTimeout(function() {
            document.getElementById("modalmsg").style.display = "none";
            } , 2000);                                
    }

    /**
     * Se ha introudcido un nombre igual al de otro usuario ya conectado. Se da un aviso de nombre repetido y se limpian
     * los selectores
     */
    protected nombreRepetido() {
        if (debug) console.log("Nombre repetido. Me desconeto");
        this.conectado = false;
        this.darAviso("Nombre de jugador repetido. Usa otro nombre");
        this.room.leave();
        main.limpiarDatos();
    }

    public getConectado(): boolean {
        return this.conectado;
    }

    public setConectado(estado: boolean): void {
        this.conectado = estado;
    }

    protected obtenerRoomId(nombrePartida: string): string {
        for (var i = 0; i < this.allRooms.length; i++) {
            if (this.allRooms[i].metadata.partida === nombrePartida) {
                return this.allRooms[i].roomId;
            }
        }
        return null;
    }

    /**
     * Copia todos los elementos de una select de pareja a la select de jugadores
     */
    protected vaciaPareja(pareja) {
        var usuarios = <HTMLSelectElement>document.getElementById("usuarios");
        var nombre, option;
        while (pareja.options.length > 0) {
            nombre = pareja.options[0].text;
            option = document.createElement("option");
            option.text = nombre;
            usuarios.add(option);
            pareja.options.remove(0);
        }
    }

    /**
     * Elimina todas las entradas de una select
     */
    protected vaciaSelect(sel) {
        while (sel.options.length > 0) {
            sel.options.remove(0);
        }
    }

    protected requestSnapshot() {
        this.enviarMensaje({ action: "Snapshot" , data: this.nombreJugador});
    }

    protected enviarMensaje(data:any ): void {
        this.room.send("mensajeGo" , data);
    }

}