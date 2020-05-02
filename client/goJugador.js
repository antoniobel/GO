/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

/**
 * Clase que maneja todas las acciones para el jugador, en el lado del cliente
 */
class GoJugador extends GoComun {

    constructor(nombre, room, ui) {
        super(nombre, room, ui);
    }

ponerParejas(data) {
    this.parejas[0] = data[0][0] + data[0][1];
    this.parejas[1] = data[1][0] + data[1][1];
    // El jugador local debe ser siempre la pareja 0. Si esta en la 1, invertimos
    if (this.parejas[1].indexOf(this.nombreJugador) >= 0) {
        var p = this.parejas[0];
        this.parejas[0] = this.parejas[1];
        this.parejas[1] = p;
    }
    this.ui.ganadas.parejas.push(this.parejas[0]);
    this.ui.ganadas.parejas.push(this.parejas[1]);
    var x = [];
    x.push(data[0][0]);
    x.push(data[1][0]);
    x.push(data[0][1]);
    x.push(data[1][1]);
    var i, index;
    for (i = 0; i < 4; i++) {
        if (x[i] === this.nombreJugador) {
            index = i;
            break;
        }
    }
    var jugador = this.ui.crearJugador(x[index] , "abajo"); // jugador local siempre abajo
    console.log(x[index] , "abajo");
    jugador.visible = true;
    index < 3 ? index++ : index = 0;
    this.ui.crearJugador(x[index] , "derecha"); 
    console.log(x[index] , "derecha");
    index < 3 ? index++ : index = 0;
    this.ui.crearJugador(x[index] , "arriba"); 
    console.log(x[index] , "arriba");
    index < 3 ? index++ : index = 0;
    this.ui.crearJugador(x[index] , "izquierda"); 
    console.log(x[index] , "izquierda");
}

// Métodos que corresponden a eventos onclick de botones html
canvasClicked(e) {
    if (this.turno) {
        var miclick = this.ui.click(e.x , e.y);
        if (miclick != null) {
            if (miclick.nombre === this.nombreJugador && miclick.carta != null) { 
                console.log("Se ha pulsado " + miclick.carta);
                this.room.send({ action: "EchoCarta" , data: {jugador: this.nombreJugador , carta: miclick.carta.getId() }});
            }
        }   
    }
}

cantar() {
    this.room.send({ action: "Canto" , data: this.nombreJugador});
}

cambio7() {
    this.room.send({ action: "Cambio7" , data: this.nombreJugador});
}

ordenar(event) {
    var index = this.ui.indice(nombreJugador);
    var jugador = this.ui.jugadores[index];
    if (jugador.cartas.length === 0) return;
    jugador.ordenar();
    if (this.ui.mazo.triunfo == null) return;
    var i, triunfos = [];
    for (i = jugador.cartas.length-1 ; i >= 0 ; i--) {
        if (jugador.cartas[i].palo === this.ui.mazo.triunfo.palo) {
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
    this.ui.dibujar();
}

mensajeSalir() {
    return "Salir terminará la partida. ¿Estas seguro?";
}

cancelarPartida() {
    room.send({ action: "PartidaCancelada" , data: nombreJugador});
    document.getElementById("modalsino").style.display = "none";
    return false;
}

} // fin de clase
