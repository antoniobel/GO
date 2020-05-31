/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

export class Carta {

    static _ranking = [10 , 1 , 9 , 2 , 3 , 4 , 5 , 7 , 6 , 8];
    static _puntos = [11 , 0 , 10 , 0 , 0 , 0 , 0 , 3 , 2 , 4]; 
    static _palos = ["oros" , "copas" , "espadas" , "bastos"];
    static _valores = ["as" , "dos" , "tres" , "cuatro" , "cinco" , "seis" , "siete" , "sota" , "caballo" , "rey"];
    
    readonly id: number;
    readonly palo: number;
    readonly valor: number;

    /**
     * los palos van del 0 al 3 y los valores del 0 al 9
     * @param {type} id
     */
    constructor(id: number) {
        this.id = id;
        this.palo = Math.floor(id / 10);
        this.valor = id % 10;
    }
    
    public paloString(): string {
        return Carta._palos[this.palo];
    }
    
    public valorString(): string {
        return Carta._valores[this.valor];
    }
    
    public puntos(): number {
        return Carta._puntos[this.valor];
    }
    
    public toString(): string {
        return this.valorString() + " de " + this.paloString();
    }
    
    public getId(): number {
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
    public compara(carta: Carta, triunfo: Carta): number {
        // Si son del mismo palo el valor mayor manda (da igual si es triunfo o no)
        if (this.palo === carta.palo) {
            if (Carta._ranking[this.valor] > Carta._ranking[carta.valor]) {
                return 1;
            } else {
                if (Carta._ranking[this.valor] < Carta._ranking[carta.valor]) {
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
