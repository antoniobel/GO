/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { Room } from "../colyseusclient/colyseus";
import { GoComun } from "./goComun";
import { GJugador } from "./goGraficos";
import { main, ui } from "./goMain";

/**
 * Clase que procesa todas las acciones para los espectadores
 */
export class GoPublico extends GoComun {

    constructor(nombre: string, room: Room) {
        super(nombre, room);
    }

    protected nuevaPartida(data: any): void {
        super.nuevaPartida(data);
    }

    protected ponerParejas(data: any): void {
        this.parejas[0] = data[0];
        this.parejas[1] = data[1];
        //    this.parejas[0] = data[0][0] + data[0][1];
        //    this.parejas[1] = data[1][0] + data[1][1];
        ui.ganadas.parejas[0] = this.parejas[0];
        ui.ganadas.parejas[1] = this.parejas[1];

        ui.crearJugador(data[0][0], "abajo");
        ui.crearJugador(data[1][0], "derecha");
        ui.crearJugador(data[0][1], "arriba");
        ui.crearJugador(data[1][1], "izquierda");
    }

    public canvasClicked(e: MouseEvent): void {
        ui.jugadores.forEach(jugador => {
            if (jugador.zonaGlobal.estaDentro(e.x / ui.canvas.escala(), e.y / ui.canvas.escala())) {
                if (jugador.visible) {
                    jugador.visible = false;
                } else {
                    jugador.visible = true;
                }
                ui.dibujar();
            }
        })
    }

    public cantar(): void {
    }

    public cambio7(): void {
    }

    public ordenar(event: MouseEvent): void {
        for (var i = 0; i < 4; i++) {
            if (ui.jugadores[i].visible) {
                this.ordenarJugador(ui.jugadores[i], event);
            }
        }
        ui.dibujar();
    }
    
    private ordenarJugador(jugador: GJugador, event: MouseEvent) {
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
    }

    public mensajeSalir(): string {
        return "¿Quieres salir de la partida?";
    }

    public cancelarPartida(): boolean {
        ui.canvas.fullScreen();
        main.vaciaSelect(document.getElementById("usuarios"));
        main.vaciaSelect(document.getElementById("pareja1"));
        main.vaciaSelect(document.getElementById("pareja2"));
        main.setConectado(false);
        document.getElementById("modalsino").style.display = "none";
        this.room.leave();
        main.abrirDialogoInicio();
        return true; // Esto cancela el manejador, para que ya no sigan llegando eventos.
    }

} // fin de clase
