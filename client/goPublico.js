/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

/**
 * Clase que procesa todas las acciones para los espectadores
 */
class GoPublico extends GoComun {

    constructor(nombre, room, ui) {
        super(nombre, room, ui);
   }

/* Este metodo es distinto para publico y para jugador */
ponerParejas(data) {
    this.parejas[0] = data[0];
    this.parejas[1] = data[1];
//    this.parejas[0] = data[0][0] + data[0][1];
//    this.parejas[1] = data[1][0] + data[1][1];
    this.ui.ganadas.parejas[0] = this.parejas[0];
    this.ui.ganadas.parejas[1] = this.parejas[1];

    this.ui.crearJugador(data[0][0] , "abajo");
    this.ui.crearJugador(data[1][0] , "derecha");
    this.ui.crearJugador(data[0][1] , "arriba");
    this.ui.crearJugador(data[1][1] , "izquierda");
}


// Métodos que corresponden a eventos onclick de botones html
canvasClicked(e) {
    this.ui.jugadores.forEach(jugador => {
        if (jugador.zonaGlobal.estaDentro(e.x / this.ui.canvas.escala() , e.y / this.ui.canvas.escala())) {
            if (jugador.visible) {
                jugador.visible = false;
            } else {
                jugador.visible = true;
            }
            this.ui.dibujar();
        }
    })
}

cantar() {
}

cambio7() {
}

ordenar(event) {
    var i;
    for (i = 0 ; i < 4 ; i++) {
        if (this.ui.jugadores[i].visible) {
            this.ordenarJugador(this.ui.jugadores[i]);
        }
    }
    this.ui.dibujar(); 
}
// ordena las cartas de un jugador. metodo propio de publico
ordenarJugador(jugador) {
    if (jugador.cartas.length === 0) return;
    jugador.ordenar();
    if (this.ui.mazo.triunfo == null) return;
    var i, triunfos = [];
    for (i = jugador.cartas.length-1 ; i >= 0 ; i--) {
        if (jugador.cartas[i].palo === ui.mazo.triunfo.palo) {
            triunfos.push(jugador.cartas[i]);
            jugador.cartas.splice(i,1);
        }
    }
    if (event.shiftKey || event.ctrlKey) {
        for (i = triunfos.length - 1 ; i >= 0; i--) {
            jugador.cartas.push(triunfos[i]);
        }
    } else {
        for (i = 0 ; i < triunfos.length; i++) {
            jugador.cartas.unshift(triunfos[i]);
        }
    }
}

mensajeSalir() {
    return "¿Quieres salir de la partida?";
}

cancelarPartida() {
    this.ui.canvas.fullScreen();
    vaciaSelect(document.getElementById("usuarios"));
    vaciaSelect(document.getElementById("pareja1"));
    vaciaSelect(document.getElementById("pareja2"));
    conectado = false;
    document.getElementById("modalsino").style.display = "none";
    this.room.leave();
    abrirDialogoInicio();
    return true; // Esto cancela el manejador, para que ya no sigan llegando eventos.
}

} // fin de clase
