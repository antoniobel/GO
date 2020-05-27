/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

var _ranking = [10 , 1 , 9 , 2 , 3 , 4 , 5 , 7 , 6 , 8];
var _puntos = [11 , 0 , 10 , 0 , 0 , 0 , 0 , 3 , 2 , 4]; 
var _palos = ["oros" , "copas" , "espadas" , "bastos"];
var _valores = ["as" , "dos" , "tres" , "cuatro" , "cinco" , "seis" , "siete" , "sota" , "caballo" , "rey"];

class Carta {
    
    /**
     * los palos van del 0 al 3 y los valores del 0 al 9
     * @param {type} id
     * @returns {nm$_gobase.Carta}
     */
    constructor(id) {
        this.id = id;
        this.palo = Math.floor(id / 10);
        this.valor = id % 10;
    }
    
    paloString() {
        return _palos[this.palo];
    }
    
    valorString() {
        return _valores[this.valor];
    }
    
    puntos() {
        return _puntos[this.valor];
    }
    
    toString() {
        return this.valorString() + " de " + this.paloString();
    }
    
    getId() {
        return this.id;
    }
        
    /**
     * Compara la carta con la que se pasa como parámetro, teniendo en cuenta la carta de triunfo. 
     * - si gana devuelve 1
     * - Si carta gana -1. si son iguales 0 (solo si ambas son la misma)
     * - Si ninguna de las dos cartas es triunfo y son de distinto palo gana la propia.
     * @param {type} carta
     * @param triunfo - carta que marca el triunfo
     * @returns {undefined}
     */
    compara(carta, triunfo) {
        // Si son del mismo palo el valor mayor manda (da igual si es triunfo o no)
        if (this.palo === carta.palo) {
            if (_ranking[this.valor] > _ranking[carta.valor]) {
                return 1;
            } else {
                if (_ranking[this.valor] < _ranking[carta.valor]) {
                    return -1;
                } else {
                    return 0;
                }
            }
        } 
        // Si no son del mismo palo manda el triunfo
        if (this.palo === triunfo.palo) {
            return 1;
        }
        if (carta.palo === triunfo.palo) {
            return -1;
        }
        // si no hay triunfo manda la carta 1
        return 1;
    }

}
try {
   exports.Carta = Carta;
} catch (e) {}


class Baraja {
    
    constructor() {
        this.cartas = [];
        var i , j;
        for (i = 0; i < 4; i++) {
            for (j = 0; j < 10; j++) {
                this.cartas.push(new Carta(i * 10 + j));
            }
        } 
    }
    
/*    barajar() {
        var siete = this.cartas[6];
//        var sota1 = this.cartas[7];
        var rey1 = this.cartas[9];
//        var sota2 = this.cartas[17];
//        var rey2 = this.cartas[19];
//        this.cartas.splice(19,1);
//        this.cartas.splice(17,1);
        this.cartas.splice(9,1);
//        this.cartas.splice(7,1);
        this.cartas.splice(6,1);
//        this.cartas.splice(6,1);
//        this.cartas.unshift(siete);
//        this.cartas.unshift(sota1);
        this.cartas.push(rey1);
        this.cartas.unshift(siete);
//        this.cartas.unshift(rey2);
//        this.cartas.splice(12 , 0 , sota2);
    } */
    
    barajar() {
        var i , carta , newi;
        for (i = this.cartas.length - 1; i > 0 ; i--) {
            newi = Math.floor(Math.random() * (i+1));
            carta = this.cartas[i];
            this.cartas[i] = this.cartas[newi];
            this.cartas[newi] = carta;
        }
    } 
    
    cogerCarta() {
        return this.cartas.shift();
    }
    
    devolverCarta(carta) {
        this.cartas.push(carta);
    }
    
    // Devuelve la última carta de la baraja, pero sin quitarla.
    triunfo() {
        return this.cartas[this.cartas.length -1];
    }

    paloToString(i) {
        return _palos[i];
    }

    valorToString(i) {
        return _valores[i];
    }
}
try {
   exports.Baraja = Baraja;
} catch (e) {}

/**
 * this.nombre - Nombre del jugador
 * this.cartas [] - sus cartas
 * this.recogeCartas - flag que indica si recoge las cartas en esta partida
 * this.cantesCantados [] - array con los cantes que ya ha cantado. (4 elementos, uno para cada palo)
 * this.cantes [] - Los cantes que tiene el jugador en un momento dado en la mano. Pueden estar ya cantados o no. 
 *                  Calculado por el método calcularCantes.
 */
class Jugador {

    constructor(nombre) {
        this.nombre = nombre;
        this.cartas = [];
        this.recogeCartas = false;
    }
    
    tomaCarta(carta) {
        this.cartas.push(carta);
    }
    
    jugarCarta(i) {
        return this.cartas.splice(i , 1);
    }
    
    inicioPartida() {
        this.cartas = [];
        this.recogeCartas = false;
        this.cantes = [];
        this.cantesCantados = [];
        var i;
        for (i = 0; i < 4; i++) {
            this.cantes[i] = false;
            this.cantesCantados[i] = 0;
        }
    }

    /**
     * Calcula los cantes que lleva en la mano. Rellena la variable this.cantes[]
     */
    calcularCantes() {
        var patas = [];
        this.cantes = [];
        var i;
        for (i = 0; i < 4; i++) {
            patas[i] = 0;
            this.cantes[i] = 0;
        }
        this.cartas.forEach(carta => {
            if (carta.valor === 7 || carta.valor === 9) {
                patas[carta.palo]++;
            }
        })
        for (i = 0; i < 4; i++) {
            if (patas[i] === 2) {
                this.cantes[i] = 1;
            }
        }
    }

    /**
     * Devuelve true si tiene algun cante pendiente.
     */
    cantesPendientes() {
        this.calcularCantes();
        var i;
        for (i = 0; i < 4; i++) {
            if (this.cantes[i] - Math.abs(this.cantesCantados[i]) > 0) {
                return true;
            }
        }
    }

    /**
     * Canta el primer cante que tenga pendiente. Sólo hace un cante. si hay más hay que volver a invocar el método.
     * Devuelve el palo que ha cantado. Si no tiene nada para cantar devuelve -1; 
     */
    cantar(ronda) {
        var pendientes = this.cantesPendientes();
        if (!pendientes) {
            return -1;
        }
        var i;
        for (i = 0; i < 4; i++) {
            if (this.cantes[i] - Math.abs(this.cantesCantados[i]) > 0) {
                (ronda < 5) ? this.cantesCantados[i] = 1 : this.cantesCantados[i] = -1;
                return i;
            }
        }
    }


    /**
     * Devuelve true si tiene el 7 del mismo palo que la carta de triunfo (que se pasa como parámetro) y ademas el valor de
     * la carta de triunfo es as, 3, sota, caballo o rey.
     */
    cambio7Posible(triunfo) {
        if (triunfo.valor === 0 || triunfo.valor === 2 || triunfo.valor > 6) {
            var i;
            var paloTriunfo = triunfo.palo;
            for (i = 0; i < this.cartas.length; i++) {
                if (this.cartas[i].palo === paloTriunfo && this.cartas[i].valor === 6) {
                    return true;
                } 
            }
        }
        return false;
    }

    cambia7(carta) {
        var i;
        for (i = 0; i < this.cartas.length; i++) {
            if (this.cartas[i].valor === 6 && this.cartas[i].palo === carta.palo) {
                var c = this.cartas[i];
                this.cartas.splice(i,1);
                this.cartas.push(carta);
                return c;
            } 
        }
        return null;
    }

    ordenar() {
        this.cartas.sort((a,b) => {
            return a.id - b.id;
        });
    }
}

try {
   exports.Jugador = Jugador;
} catch (e) {}