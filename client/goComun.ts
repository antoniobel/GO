/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { Room } from "../colyseusclient/colyseus";
import { main, ui } from "./goMain";
import { Carta } from "./carta";

/**
 * partidaTerminada: Recoge datos de los eventos relacionados con el final de la partida. Elementos:
 * parejas [] => 2 elemento. nombres de las parejas tal como los manda el servidor
 * puntos [] =>  2 elementos. puntos de cada pareja. congruente con parejas
 * hayVuelta => true si va a haber partida de vuelta
 * ganadores => pareja ganadora (nombres)
 * marcador [] => dos elementos. partidas ganadas por cada pareja, compatible con parejas []
 * finCoto => true si hemos terminado el coto
 */
export class GoComun {

    readonly nombreJugador: string;  // nombre jugador local
    readonly room: Room; // Servidor. Para enviar mensajes
    public partidaTerminada: any; /// estructura con datos de la partida terminada
    public parejas: Array<Array<string>>; // Array de parejas. Cada elemento del array es otro array con los nombres de las parejas
    private ronda: number; // Ronda actual de juego
    public turno: boolean; // True si el jugador local tiene el turno

    constructor(nombre: string, room: Room) {
        this.nombreJugador = nombre;
        this.room = room;
        this.partidaTerminada = {};
        this.parejas = [];
    }

    /**
     * Procesador de todas las acciones. Invocado desde el metodo room.onMessage. Llama a las funciones 
     * que ejecutan las acciones.
     * @param {*} action 
     * @param {*} data 
     */
    public procesaAction(action: string, data: any): void {
        if (action === "ComienzaPartida") {
            document.getElementById("myModal").style.display = "none";
            document.getElementById("modalfin").style.display = "none";
            (<HTMLButtonElement>document.getElementById("ordenar")).disabled = false;
            ui.canvas.fullScreen();
            main.mostrarBotones();
            ui.initCompleto();
            return;
        }
        if (action === "NuevaPartida") {
            this.nuevaPartida(data);
        }
        if (action === "Parejas") {
            this.ponerParejas(data);
        };
        if (action === "Dar1Carta") {
            var carta = new Carta(data.carta);
            ui.mueveMazoJugador(data.jugador, carta);
        };
        if (action === "Triunfo") {
            var carta = new Carta(data);
            ui.mazo.triunfo = carta;
            ui.dibujar();
        }
        if (action === "Ronda") {
            ui.baza.cartas = [];
            ui.baza.nombres = [];
            this.ronda = data;
            (<HTMLButtonElement>document.getElementById("cante")).disabled = true;
            (<HTMLButtonElement>document.getElementById("cambio7")).disabled = true;
        }
        if (action === "Turno") {
            var index = ui.indice(data);
            ui.ponerTurno(ui.jugadores[index]);
            ui.dibujar();
        }
        if (action === "Juega") {
            this.turno = true;
        }
        if (action === "CartaJugada") {
            var carta = new Carta(data.carta);
            this.cartaJugada(data.jugador, carta);
        }
        if (action === "BazaGanada") {
            this.bazaGanada(data);
        }
        if (action === "Puntos") {
            this.ponerPuntos(data);
        }
        if (action === "RecogeCartas") {
            ui.mueveBazaGanadas(data);
        }
        if (action === "PartidaTerminada") {
            this.partidaTerminada.parejas = data.parejas;
            this.partidaTerminada.puntos = data.puntos;
            this.partidaTerminada.hayVuelta = false;
            this.partidaTerminada.ganadores = '';
            this.partidaTerminada.marcador = [];
            this.partidaTerminada.finCoto = false;
            // Para que no quede ninguna luz de turno encendida.
            ui.quitarTurno();
        }
        if (action === "HayVuelta") {
            this.partidaTerminada.hayVuelta = true;
            this.dialogoFinPartida();
        }
        if (action === "GanadorPartida") {
            this.partidaTerminada.ganadores = data;
        }
        if (action === "Marcador") {
            this.partidaTerminada.marcador = data.marcador;
            this.partidaTerminada.finCoto = data.finCoto;
            this.dialogoFinPartida();
        }
        if (action === "PuedesCantar") {
            (<HTMLButtonElement>document.getElementById("cante")).disabled = false;
        }
        if (action === "HaCantado") {
            this.haCantado(data);
        }
        if (action === "Cambio7Posible") {
            (<HTMLButtonElement>document.getElementById("cambio7")).disabled = false;
        }
        if (action === "HaCambiado7") {
            this.haCambiado7(data.jugador, new Carta(data.carta));
        }
        if (action === "PartidaCancelada") {
            ui.init();
            document.getElementById("msg").innerHTML = "La partida ha sido cancelada por " + data;
            document.getElementById("modalmsg").style.display = "block"; // abrimos el diálogo
            setTimeout(function () {
                this.ui.canvas.fullScreen();
                main.vaciaSelect(document.getElementById("usuarios"));
                main.vaciaSelect(document.getElementById("pareja1"));
                main.vaciaSelect(document.getElementById("pareja2"));
                main.setConectado(false);
                document.getElementById("modalmsg").style.display = "none";
                main.abrirDialogoInicio();
            }, 3000);
        }
        if (action === "NoCanteCambio") {
            (<HTMLButtonElement>document.getElementById("cambio7")).disabled = true;
            (<HTMLButtonElement>document.getElementById("cante")).disabled = true;
        }
        if (action === "Snapshot") {
            this.procesaSnapshot(data);
        }
        if (action === "NuevaConexion") {
            if (data !== this.nombreJugador) {
                var indice = ui.indice(data);
                if (indice == null) {
                    document.getElementById("msg").innerHTML = data + " se ha conectado a la partida como espectador";
                } else {
                    document.getElementById("msg").innerHTML = "El jugador " + data + " se ha reconectado a la partida";
                }
                document.getElementById("modalmsg").style.display = "block"; // abrimos el diálogo
                setTimeout(function () {
                    document.getElementById("modalmsg").style.display = "none";
                }, 3000);
            }
        }
        if (action === "JugadorDesconectado") {
            document.getElementById("msg").innerHTML = "El jugador " + data + " se ha desconectado de la la partida.";
            document.getElementById("modalmsg").style.display = "block"; // abrimos el diálogo
            setTimeout(function () {
                document.getElementById("modalmsg").style.display = "none";
            }, 3000);
        }
        if (action === "RevisionBaza") {
            this.revisionBaza(data);
        }
        if (action === "CartaInvalida") {
            ui.sounds[1].play();
        }
    }

    protected ponerParejas(data: any): void {
    }

    public cantar(): void {
    }

    public cambio7(): void {
    }

    public ordenar(event: MouseEvent): void {
    }

    public mensajeSalir(): string {
        return '';
    }

    protected nuevaPartida(data: any): void {
        document.getElementById("modalfin").style.display = "none";
        ui.init();
        ui.mazo.numCartas = 40;
        if (data.vuelta === true) { // vamos de vueltas
            document.getElementById("puntos").style.display = "block";
            this.ponerPuntos(data);
        } else {
            document.getElementById("puntos").style.display = "none";
        }
    }

    protected ponerPuntos(data: any): void {
        for (var i = 0; i < 2; i++) {
            if (data.puntos[i] > 50) {
                data.puntos[i] = (data.puntos[i] - 50) + " buenas";
            } else {
                data.puntos[i] = data.puntos[i] + " malas";
            }
        }
        var txt = data.parejas[0] + ": " + data.puntos[0] + "<br>" + data.parejas[1] + ": " + data.puntos[1];
        document.getElementById("puntos").innerHTML = txt;
    }

    protected cartaJugada(nombre: string, carta: Carta): void {
        console.log('cartajugada', nombre, carta);
        var indice = ui.indice(nombre);
        var jugador = ui.jugadores[indice];
        // quitar la carta y la zona
        for (var i = 0; i < jugador.cartas.length; i++) {
            if (jugador.cartas[i].getId() === carta.getId()) {
                ui.mueveJugadorBaza(nombre, carta, i);
                break;
            }
        }
        // poner luz en rojo
        ui.quitarTurno();
        if (this.nombreJugador === nombre) {
            this.turno = false;
        }
        this.cartaJugadaRespuesta();
        // Si ha jugado el jugador local deshabilitar botones de cante y cambio7
        if (nombre === this.nombreJugador) {
            (<HTMLButtonElement>document.getElementById("cambio7")).disabled = true;
            (<HTMLButtonElement>document.getElementById("cante")).disabled = true;
        }
        ui.dibujar();
    }

    protected cartaJugadaRespuesta(): void {
    }

    public cancelarPartida(): boolean {
        return false;
    }

    public canvasClicked(e: MouseEvent): void {

    }

    protected bazaGanada(nombre: string): void {
        ui.baza.ganador = nombre;
        ui.dibujar();
        ui.baza.ganador = '';
    }

    protected haCantado(data: any): void {
        var imagen: HTMLImageElement;
        if (data.valor === 40) {
            imagen = ui.baraja.cuarenta;
        } else {
            if (data.palo == '') {
                imagen = ui.baraja.veinte;
            } else {
                imagen = ui.baraja.cantes[data.indexPalo];
            }
        }
        imagen.style.position = "absolute";
        var indice = ui.indice(data.jugador);
        var punto = ui.jugadores[indice].posicionarCante(data.secuencia);
        imagen.style.left = punto.x + "px";
        imagen.style.top = punto.y + "px";
        document.getElementById("divimage").appendChild(imagen);
        document.getElementById("modalcante").style.display = "block";
        ui.jugadores[indice].paloCantes.push(data.indexPalo);
        if (data.jugador === this.nombreJugador) {
            (<HTMLButtonElement>document.getElementById("cante")).disabled = true;
        }
        if (data.valor === 40) {
            ui.jugadores[indice].paloCantes.push(data.indexPalo);
        }
        ui.dibujar();
        setTimeout(function () {
            document.getElementById("modalcante").style.display = "none";
            document.getElementById("divimage").removeChild(imagen);
        }, 3000);
    }

    protected haCambiado7(nombre: string, cartaTriunfo: Carta): void {
        var indice = ui.indice(nombre);
        var jugador = ui.jugadores[indice];
        for (var i = 0; i < jugador.cartas.length; i++) {
            if (jugador.cartas[i].valor === 6 && jugador.cartas[i].palo === ui.mazo.triunfo.palo) {
                var c = jugador.cartas[i];
                var indiceCarta = i;
                break;
            }
        }
        if (c != null) {
            (<HTMLButtonElement>document.getElementById("cambio7")).disabled = true;
            ui.mueveCambio7(nombre, c, indiceCarta, cartaTriunfo);
        }
    }

    protected dialogoFinPartida() {
        for (var i = 0; i < 2; i++) {
            if (this.partidaTerminada.puntos[i] > 50) {
                this.partidaTerminada.puntos[i] = (this.partidaTerminada.puntos[i] - 50) + " buenas";
            } else {
                this.partidaTerminada.puntos[i] = this.partidaTerminada.puntos[i] + " malas";
            }
        }
        if (this.partidaTerminada.hayVuelta) {
            document.getElementById("linea1").innerHTML = this.partidaTerminada.parejas[0] + ": " + this.partidaTerminada.puntos[0];
            document.getElementById("linea2").innerHTML = this.partidaTerminada.parejas[1] + ": " + this.partidaTerminada.puntos[1];
            document.getElementById("linea3").innerHTML = "Hay partida de vuelta";
        } else {
            if (this.partidaTerminada.finCoto) {
                document.getElementById("linea1").innerHTML = this.partidaTerminada.ganadores + " han ganado la partida y el coto. Marcador final:";
                main.setConectado(false);
            } else {
                document.getElementById("linea1").innerHTML = this.partidaTerminada.ganadores + " han ganado la partida. El marcador está así:";
            }
            document.getElementById("linea2").innerHTML = this.partidaTerminada.parejas[0] +
                " (" + this.partidaTerminada.puntos[0] + "): " + this.partidaTerminada.marcador[0];
            document.getElementById("linea3").innerHTML = this.partidaTerminada.parejas[1] +
                " (" + this.partidaTerminada.puntos[1] + "): " + this.partidaTerminada.marcador[1];
        }
        if (ui.jugadores[0].cartas.length > 0) {
            for (i = 0; i < 4; i++) {
                ui.jugadores[i].visible = true;
            }
            ui.dibujar();
        }
        document.getElementById("modalfin").style.display = "block"; // abrimos el diálogo fin partida
    }

    protected esFinCoto(): boolean {
        if (this.partidaTerminada.finCoto) {
            return true;
        }
        return false;
    }

    protected procesaSnapshot(data: any): void {
        console.log('procesando snapshot');
        var xnombres = data.nombres;
        var xcartas = data.cartas;
        var xbaza = data.baza;
        var xmazo = data.mazo;
        var xturno = data.turno;
        var xganadas = data.ganadas;
        var xcantes = data.cantes;
        var xpuntos = data.puntos;

        // el mazo
        ui.mazo.triunfo = new Carta(xmazo.triunfo);
        ui.mazo.numCartas = xmazo.numCartas;
        // las cartas de los jugadores y sus cantes
        for (var i = 0; i < xnombres.length; i++) {
            var indice = ui.indice(xnombres[i]);
            ui.jugadores[indice].turno = false;
            var xcartasNuevas = [];
            xcartas[i].forEach((id: number) => {
                xcartasNuevas.push(new Carta(id));
            })
            this.cartasJugador(indice, xcartasNuevas);
            ui.jugadores[indice].paloCantes = [];
            for (var j = 0; j < 4; j++) {
                var paloCante = xcantes[i][j];
                if (paloCante != 0) {
                    if (ui.mazo.triunfo.palo === j) { // Cante 40
                        ui.jugadores[indice].paloCantes.push(j);
                        ui.jugadores[indice].paloCantes.push(j);
                    } else {
                        if (paloCante === 1) {
                            ui.jugadores[indice].paloCantes.push(j); // Cante 20 visto
                        } else {
                            ui.jugadores[indice].paloCantes.push(-1); // Cante 20 oculto
                        }
                    }
                }
            }
        }
        // la baza
        ui.baza.cartas = [];
        xbaza.cartas.forEach(id => {
            ui.baza.cartas.push(new Carta(id));
        });
        ui.baza.nombres = xbaza.nombres;
        // las cartas ganadas
        ui.ganadas.init();
        ui.ganadas.addCartas(xganadas[0].nombre, xganadas[0].numCartas);
        ui.ganadas.addCartas(xganadas[1].nombre, xganadas[1].numCartas);
        // el turno
        if (xturno != null) {
            if (xturno === this.nombreJugador) {
                this.turno = true;
            }
            var index = ui.indice(xturno);
            ui.ponerTurno(ui.jugadores[index]);
        } else {
            ui.quitarTurno(); // Nadie tiene el turno
        }
        //    this.ui.jugadores[index].ponerTurno();
        if (xpuntos.vueltas === true) { // vamos de vueltas
            document.getElementById("puntos").style.display = "block";
            this.ponerPuntos(xpuntos);
        } else {
            document.getElementById("puntos").style.display = "none";
        }
        console.log("Snapshot cargado");

        ui.dibujar();
    }

    protected cartasJugador(indice: number, cartasNuevas: Array<Carta>): void {
        var cartasJugador = ui.jugadores[indice].cartas;
        for (var i = cartasJugador.length - 1; i >= 0; i--) {
            if (this.cartaEsta(cartasJugador[i], cartasNuevas) === -1) {// Si la carta no esta en las nuevas la quitamos
                cartasJugador.splice(i, 1);
            }
        }
        for (i = 0; i < cartasNuevas.length; i++) {
            if (this.cartaEsta(cartasNuevas[i], cartasJugador) === -1) {// Si la carta no esta en las del jugador la añadimos al final
                cartasJugador.push(cartasNuevas[i]);
            }
        }
        ui.jugadores[indice].cartas = cartasJugador;
    }

    protected cartaEsta(carta: Carta, cartas: Array<Carta>): number {
        var i;
        for (i = 0; i < cartas.length; i++) {
            if (cartas[i].id === carta.id) {
                return i;
            }
        }
        return -1;
    }

    protected revisionBaza(data: any): void {
        var ultimaBaza = data.ultimaBaza;
        var nombre = data.nombre;
        var imagen: Array<HTMLImageElement> = [];
        var indicePareja = this.indicePareja(nombre);
        var punto = ui.ganadas.obtenerPunto(indicePareja);
        punto.x = Math.floor(punto.x * ui.canvas.escala()) - 100;
        punto.y = Math.floor(punto.y * ui.canvas.escala());
        for (var i = 0; i < 4; i++) {
            imagen[i] = ui.baraja.imagen(ultimaBaza[i]);
            imagen[i].style.position = "absolute";
            imagen[i].style.left = punto.x + "px";
            imagen[i].style.top = punto.y + "px";
            imagen[i].style.width = Math.floor(ui.baraja.ancho() * ui.canvas.escala()) + "px";
            imagen[i].style.height = Math.floor(ui.baraja.alto() * ui.canvas.escala()) + "px";
            document.getElementById("divimage").appendChild(imagen[i]);
            punto.x += 50;
        }
        document.getElementById("modalcante").style.display = "block";
        setTimeout(function () {
            document.getElementById("modalcante").style.display = "none";
            for (var i = 0; i < 4; i++) {
                document.getElementById("divimage").removeChild(imagen[i]);
            }
        }, 3000);
    }

    protected indicePareja(nombre: string): number {
        if (this.parejas[0][0] === nombre || this.parejas[0][1] === nombre) {
            return 0;
        }
        if (this.parejas[1][0] === nombre || this.parejas[1][1] === nombre) {
            return 1;
        }
        return -1;
    }
}