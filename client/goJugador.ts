/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";
import { Room } from "colyseus.js";
import { GoComun } from "./goComun";
import { main, ui , debug } from "./main";

/**
 * Clase que maneja todas las acciones para el jugador, en el lado del cliente
 */
export class GoJugador extends GoComun {

    constructor(nombre: string, room: Room) {
        super(nombre, room);
    }

    protected nuevaPartida(data: any): void {
        super.nuevaPartida(data);
        for (var i = 0; i < 4; i++) {
            if (ui.jugadores[i].nombre === this.nombreJugador) {
                ui.jugadores[i].visible = true;
            } else {
                ui.jugadores[i].visible = false;
            }
        }
    }

    protected ponerParejas(data: any): void {
        if (data[0][0] === this.nombreJugador || data[0][1] === this.nombreJugador) {
            this.parejas[0] = data[0];
            this.parejas[1] = data[1];
        } else {
            this.parejas[0] = data[1];
            this.parejas[1] = data[0];
        }
        ui.ganadas.parejas[0] = this.parejas[0];
        ui.ganadas.parejas[1] = this.parejas[1];
        var x = [];
        x.push(data[0][0]);
        x.push(data[1][0]);
        x.push(data[0][1]);
        x.push(data[1][1]);
        var index: number;
        for (var i = 0; i < 4; i++) {
            if (x[i] === this.nombreJugador) {
                index = i;
                break;
            }
        }
        var jugador = ui.crearJugador(x[index], "abajo"); // jugador local siempre abajo
        if (debug) console.log(x[index], "abajo");
        jugador.visible = true;
        index < 3 ? index++ : index = 0;
        ui.crearJugador(x[index], "derecha");
        if (debug) console.log(x[index], "derecha");
        index < 3 ? index++ : index = 0;
        ui.crearJugador(x[index], "arriba");
        if (debug) console.log(x[index], "arriba");
        index < 3 ? index++ : index = 0;
        ui.crearJugador(x[index], "izquierda");
        if (debug) console.log(x[index], "izquierda");
    }

    public canvasClicked(e: MouseEvent): void {
        if (e.x < 50 && e.y < 50) {
            main.requestSnapshot();
        }
        if (this.turno) {
            var miclick = ui.click(e.x, e.y);
            if (miclick != null) {
                if (miclick.nombre === this.nombreJugador && miclick.carta != null) {
                    if (debug) console.log("Se ha pulsado " + miclick.carta);
                    main.enviarMensaje({ action: "EchoCarta", data: { jugador: this.nombreJugador, carta: miclick.carta.getId() } });
                    ui.sounds[0].play();
                }
            } else { // ver si ha pulsado en la zona de cartas para revisar
                var index = ui.ganadas.click(e.x, e.y);
                if (index >= 0) {
                    if (debug) console.log("Se ha pulsado cartas ganadas " + index);
                    main.enviarMensaje({ action: "RevisionBaza", data: ui.jugadores[index].nombre });
                }
            }
        }
    }

    public cantar(): void {
        main.enviarMensaje({ action: "Canto", data: this.nombreJugador });
    }

    public cambio7(): void {
        main.enviarMensaje({ action: "Cambio7", data: this.nombreJugador });
    }

    public ordenar(event: MouseEvent): void {
        var index = ui.indice(main.nombreJugador);
        var jugador = ui.jugadores[index];
        if (jugador.cartas.length === 0) return;
        jugador.ordenar();
        if (ui.mazo.triunfo == null) return;
        var triunfos = [];
        for (var i = jugador.cartas.length - 1; i >= 0; i--) {
            if (jugador.cartas[i].palo === ui.mazo.triunfo.palo) {
                triunfos.push(jugador.cartas[i]);
                jugador.cartas.splice(i, 1);
            }
        }
        if (event.shiftKey || event.ctrlKey) {
            for (i = triunfos.length - 1; i >= 0; i--) {
                jugador.cartas.push(triunfos[i]);
            }
        } else {
            for (i = 0; i < triunfos.length; i++) {
                jugador.cartas.unshift(triunfos[i]);
            }
        }
        ui.dibujar();
    }

    public mensajeSalir(): string {
        return "Salir terminará la partida. ¿Estas seguro?";
    }

    public cancelarPartida(): boolean {
        main.enviarMensaje({ action: "PartidaCancelada", data: main.nombreJugador });
        document.getElementById("modalsino").style.display = "none";
        return false;
    }

    protected cartaJugadaRespuesta(): void {
        main.enviarMensaje({ action: "CartaJugadaOk", data: main.nombreJugador });
    }

} // fin de clase
