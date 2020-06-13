/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { Carta } from "./carta";
import { main, ui , debug } from "./main";

/**
 * Objeto que tiene las imágenes de todas las cartas
 */
export class GBaraja {
    private leidas: number;
    private imagenes: Array<HTMLImageElement>;
    public reverso: HTMLImageElement;
    public palos: Array<HTMLImageElement>;
    public paloReverso: HTMLImageElement;
    public cuarenta: HTMLImageElement;
    public veinte: HTMLImageElement;
    public cantes: Array<HTMLImageElement>;
    private sietes: Array<HTMLImageElement>;

    constructor() {
        this.leerCartas();
    }
    
    private leerCartas(): void {
        this.leidas = 0;
        this.imagenes = [];
        for (var i = 0 ; i < 40 ; i++) {
            this.imagenes[i] = new Image();
            this.imagenes[i].addEventListener('load', () => {
                this.leidas++;
                if (this.leidas == 40 && debug) console.log('Todas las cartas leidas');
           }, false);
           this.imagenes[i].src = '../client/img/' + i + '.png';             
        }
        this.reverso = new Image();
        this.reverso.src = '../client/img/reverso.png'; 
        this.palos = [];
        for (i = 0; i < 4; i++) {
            this.palos[i] = new Image();
            this.palos[i].src = '../client/img/palo' + i + '.png'; 
        }
        this.paloReverso = new Image();
        this.paloReverso.src = '../client/img/paloreverso.png'; 
        this.cuarenta = new Image();
        this.cuarenta.src = '../client/img/Cuarenta.png';
        this.veinte = new Image();
        this.veinte.src = '../client/img/Veinte.png';
        this.cantes = [];
        this.sietes = [];
        for (i = 0; i < 4 ; i++) {
            this.cantes[i] = new Image();
            this.cantes[i].src = '../client/img/Cante' + i +'.png';
            this.sietes[i] = new Image();
            this.sietes[i].src = '../client/img/Siete' + i +'.png';
        }
    } 

    public ancho(): number {
        return 123;
    }

    public alto(): number {
        return 190;
    }

    public imagen(i: number): HTMLImageElement {
        return this.imagenes[i];
    }
}

export class MiCanvas {
    private fondo: HTMLImageElement;
    private escalarFondo: boolean;
    private scale: number;

    constructor() {
        this.fondo = new Image();
        this.fondo.src = '../client/img/paperGreen_xgf.png';
        this.fondo.addEventListener('load', () => {
            this.escalarFondo = false;
            if (window.screen.width * window.devicePixelRatio > 1920) {
                this.escalarFondo = true;
            }
       }, false);    
    }

    public fullScreen(): void {
        this.canvas().height = window.innerHeight - 20;
        this.canvas().width = window.innerWidth - 20;
        this.fijarEscala();
        this.ponerFondo();
    }

    public ponerFondo(): void {
        var context = (<HTMLCanvasElement>document.getElementById("canvas")).getContext("2d");
        this.context().setTransform(1, 0, 0, 1, 0, 0);
        if (this.escalarFondo) {
            context.drawImage(this.fondo, 0, 0, this.canvas().width , this.canvas().height);
        } else {
            context.drawImage(this.fondo, 0, 0);
        }
        this.context().scale(this.scale , this.scale);
    }

    private fijarEscala(): void {
        var ratio = 5.5; // número de cartas enteras que quiero que quepan
        var alto = window.innerHeight - 20;
        var ancho = window.innerWidth - 20;
        if (alto < ancho) { // para pantallas alargadas (PC)
            var altoCartas = 190;
            this.scale = alto / (190 * ratio);
            if (debug) console.log(this.scale);
            this.context().scale(this.scale , this.scale);    
        } else { // para pantallas tipo móvil
            var anchoCartas = 123;
            this.scale = ancho / (123 * ratio);
            if (debug) console.log(this.scale);
            this.context().scale(this.scale , this.scale);    
        }
    }

    public ancho(): number {
        return (window.innerWidth - 20) / this.escala();
    }

    public alto(): number {
        return (window.innerHeight - 20) / this.escala();
    }

    public escala(): number {
        return this.scale;
    }

    public canvas(): HTMLCanvasElement {
        return <HTMLCanvasElement>document.getElementById("canvas");
    }

    public context(): CanvasRenderingContext2D {
        var canvas =  <HTMLCanvasElement>document.getElementById("canvas");
        return canvas.getContext("2d");
    }
}

export class Zona {
    readonly startx: number;
    readonly starty: number;
    readonly endx: number;
    readonly endy: number;

    constructor(startX:number , startY:number  , endX: number , endY: number) {
        this.startx = startX;
        this.starty = startY;
        this.endx = endX;
        this.endy = endY;
    } 

    public estaDentro(x:number , y:number): boolean {
        if (x >= this.startx && x <= this.endx) {
            if (y >= this.starty && y <= this.endy) {
                return true;
            }
        }
        return false;
    }
}

export class GJugador {
    readonly nombre: string; // Nombre del jugador
    readonly posicion: string; // Posición del jugador en la pantalla. 4 posibilidades: arriba, abajo, derecha e izquierda.
    public cartas: Array<Carta>; // Array de cartas del jugador
    public zonas: Array<Zona>; // Array de zonas (rectangulos) que son las posiciones fisicas ocupadas por las cartas (para el click)
    private margen: number; //Margen del borde de la pantalla que toque hasta las cartas.
    public visible: boolean; // true si las cartas son visibles (están boca arriba) o no (boca abajo)
    public turno: boolean; // true si el jugador tiene el turno de juego
    public paloCantes: Array<number>; // Array que indica para cada palo si se ha cantado o no
    private startx: number; // Posición x de inicio para dibujar las cartas
    private starty: number; // Posición y de inicio para dibujar las cartas
    private giro: boolean; // true si hay que girar las cartas (posiciones izquierda y derecha)
    private intervalo: number; // Distancia entre el borde de una carta y la siguiente. Puede ser negativo, y entonces las cartas se solapan
    public zonaGlobal: Zona; // Rectángulo formado por todas las cartas juntas (es el area de click para los espectadores)
    private nombrex: number; // Posición x de inicio para dibujar el nombre del jugador
    private nombrey: number; // Posición y de inicio para dibujar el nombre del jugador
    private cantex: number; // Posición x de inicio para dibujar el marcador de cantes
    private cantey: number; // Posición y de inicio para dibujar el marcador de cantes
    public luzx: number; // Posición x de inicio para dibujar la luz de turno
    public luzy: number; // Posición y de inicio para dibujar la luz de turno
    private longNombre: number; // Longitud (en pixels) del nombre del jugador. Se usa para la posición arriba
    public luzVerde: boolean; // true si la luz tiene que estar verde

    constructor(nombre: string, posicion: string) {
        this.nombre = nombre;
        this.posicion = posicion;
        this.cartas = [];
        this.zonas = [];
        this.margen = 10;
        this.visible = false;
        this.turno = false;
        this.paloCantes = [];
        this.calcularLongNombre();
    }

    public init(): void {
        this.cartas = [];
        this.paloCantes = [];
        this.turno = false;
    }

    public dibujar(): void {        
        var context = ui.canvas.context();
        // calculamos posiciones
        this.calcularPosiciones();
        // Dibujamos cartas
        this.zonas = [];
        this.cartas.forEach(carta => {
            this.zonas.push(new Zona(this.startx, this.starty , this.startx + ui.baraja.ancho() , this.starty + ui.baraja.alto()));
            if (!this.giro) {
                this.ponerImagen(carta , this.startx , this.starty);
                this.startx += ui.baraja.ancho() + this.intervalo;
            } else {
                var cx = this.startx  + ui.baraja.alto()/2;
                var cy = this.starty + ui.baraja.ancho()/2;
                // Hay que trasladarse al centro de la figura que se quiere girar, establecer la rotación y volver al origen
                context.translate(cx , cy);
                context.rotate((Math.PI / 180) * 90);
                context.translate(-cx , - cy);
                this.ponerImagen(carta , this.startx , this.starty);
                this.starty += ui.baraja.ancho() + this.intervalo;
                // después de dibujar hay que volver al punto central, deshacer el giro, y volver al origen
                context.translate(cx , cy);
                context.rotate(-(Math.PI / 180) * 90);
                context.translate(-cx , - cy);
            }
        });
        // Calculamos zonaGlobal (para los espectadores)
        var minx = 99999, miny = 99999, maxx = 0, maxy = 0;
        this.zonas.forEach(zona => {
            if (zona.startx < minx) minx = zona.startx;
            if (zona.starty < miny) miny = zona.starty;
            if (zona.endx > maxx) maxx = zona.endx;
            if (zona.endy > maxy) maxy = zona.endy;
        });
        this.zonaGlobal = new Zona(minx, miny, maxx, maxy);
        // Ponemos el nombre
        this.drawTextBG(context, this.nombre, "30px Arial", this.nombrex, this.nombrey);
        // Ponemos luz de turno
        this.ponerLuz();
        // Ponemos los cantes
        this.paloCantes.forEach(cante =>{
            if (cante === -1) {
                context.drawImage(ui.baraja.paloReverso, this.cantex , this.cantey , 32 , 32);
            } else {
                context.drawImage(ui.baraja.palos[cante], this.cantex , this.cantey , 32 , 32);
            }
            if (this.posicion === 'arriba') {
                this.cantex -= 36;
            } else {
                this.cantex += 36;
            }
        });
    }

    /**
     * Escribe un texto sobre el canvas 
     */
    private drawTextBG(ctx: CanvasRenderingContext2D, txt: string, font: string, x: number, y: number): void {
        /// lets save current state as we make a lot of changes        
        ctx.save();
        /// set font
        ctx.font = font;
        /// draw text from top - makes life easier at the moment
        ctx.textBaseline = 'top';
        // Letras en blanco.
        ctx.fillStyle = '#ffffff';
        /// draw text on top
        ctx.fillText(txt, x, y);
        /// restore original state
        ctx.restore();
    }

    private calcularPosiciones(): void {
        var ancho: number , alto: number;
        switch (this.posicion) {
            case 'abajo':
                this.intervalo = 10;
                ancho = ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = (ui.canvas.ancho() - ancho) / 2;
                this.starty = ui.canvas.alto() - ui.baraja.alto() - this.margen;
                this.giro = false;
                // Nombre
                this.nombrex = (ui.canvas.ancho() - ancho ) / 2 + ancho + this.margen;
                this.nombrey = ui.canvas.alto() - 50 ;
                // luz de turno
                this.luzx = (ui.canvas.ancho() - ancho ) / 2 + ancho + this.margen;
                this.luzy = ui.canvas.alto() - 85 ;
                // cantes
                this.cantex = (ui.canvas.ancho() - ancho ) / 2 + ancho + this.margen;
                this.cantey = ui.canvas.alto() - 115 ;
                break;
            case 'arriba':
                this.intervalo = 10;
                ancho = ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = (ui.canvas.ancho() - ancho) / 2;
                this.starty = this.margen;
                this.giro = false;
                // nombre
//                this.nombrex = (this.ui.canvas.ancho() - ancho ) / 2 + this.margen - 200;
                this.nombrex = (ui.canvas.ancho() - ancho ) / 2 + this.margen - this.longNombre - 35;
                this.nombrey = 50 ;
                // luz de turno
//                this.luzx = (this.ui.canvas.ancho() - ancho ) / 2 + this.margen - 200;
                this.luzx = this.nombrex;
                this.luzy = 85 ;
                // cantes
                this.cantex = (ui.canvas.ancho() - ancho ) / 2 + this.margen - this.longNombre - 35;
//                this.cantex = (ui.canvas.ancho() - ancho ) / 2 + this.margen - 200;
                this.cantey = 115 ;
                break;
            case 'izquierda':
                this.intervalo = -30;
                alto = ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = this.margen + (ui.baraja.alto() - ui.baraja.ancho()) / 2;
                this.starty = (ui.canvas.alto() - alto) / 2;
                this.giro = true;
                // nombre
                this.nombrex = 10;
                this.nombrey = (ui.canvas.alto() - alto ) / 2 + alto;
                // luz de turno
                this.luzx = 10;
                this.luzy = (ui.canvas.alto() - alto ) / 2 + alto + 35;
                // cantes
                this.cantex = 10;
                this.cantey = (ui.canvas.alto() - alto ) / 2 + alto + 65;
                break;
           case 'derecha':
                this.intervalo = -30;
                alto = ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = ui.canvas.ancho() - this.margen - ui.baraja.alto() + (ui.baraja.alto() - ui.baraja.ancho()) / 2;
                this.starty = (ui.canvas.alto() - alto) / 2;
                this.giro = true;
                // nombre
                this.nombrex = ui.canvas.ancho() - 200;
                this.nombrey = (ui.canvas.alto() - alto ) / 2 - ui.baraja.ancho()/2 - this.margen;
                // luz de turno
                this.luzx = ui.canvas.ancho() - 200;
                this.luzy = (ui.canvas.alto() - alto ) / 2 - ui.baraja.ancho()/2 - this.margen - 35;
                // cantes
                this.cantex = ui.canvas.ancho() - 200;
                this.cantey = (ui.canvas.alto() - alto ) / 2 - ui.baraja.ancho()/2 - this.margen - 65;
                break;    
        }
    }

    private calcularLongNombre(): void {
        var context = ui.canvas.context();
        context.save();
        context.font = "30px Arial";
        this.longNombre = context.measureText(this.nombre).width;
        context.restore();
        if (debug) console.log("Longitud nombre: " , this.longNombre);
    }

    private ponerImagen(carta: Carta , x: number , y: number): void {
        var context = ui.canvas.context();
        if (this.visible) {
            context.drawImage(ui.baraja.imagen(carta.id), x , y);
        } else {
            context.drawImage(ui.baraja.reverso, x , y);
        }
    }

    private ponerLuz(): void {
        var context = ui.canvas.context();
        if (this.turno) {
            context.drawImage(ui.verde, this.luzx , this.luzy);
        } else {
            context.drawImage(ui.roja, this.luzx , this.luzy);
        }

    }

    public ordenar(): void {
        this.cartas.sort((a,b) => {
            return a.id - b.id;
        });
    }

    public posicionarCante(indice: number): any {
        var x: number , y: number;
        switch (this.posicion) {
            case 'abajo':
                x = Math.floor(ui.canvas.ancho() * ui.canvas.escala() / 2  - 117 - 60 + 120* (indice -1));
                y = Math.floor(ui.canvas.alto() * ui.canvas.escala() - 245);
                break;
            case 'arriba':
                x = Math.floor(ui.canvas.ancho() * ui.canvas.escala() / 2 - 117 - 60 + 120* (indice -1));
                y = 20;
                break;
            case 'derecha':
                x = Math.floor(ui.canvas.ancho() * ui.canvas.escala() - 254);
                y = Math.floor(ui.canvas.alto() * ui.canvas.escala()  / 2 - 112 - 75 + 150* (indice -1));
                break;
            case 'izquierda':
                x = 20;
                y = Math.floor(ui.canvas.alto() * ui.canvas.escala() / 2 - 117 - 75 + 150* (indice -1));
                break;
        }
        return { x: x , y: y};
    }

    /**
     * Punto de salida o llegada para las animaciones. Index es el índice de la carta que sale o llega. Si llega
     * hacer que sea = cartas.length. Si sale puede ser cualquiera
     */
    public puntoMueve(index: number): any {
        this.calcularPosiciones();
        var x: number , y: number ;
        switch (this.posicion) {
            case 'abajo':
            case 'arriba':
                x = this.startx + (ui.baraja.ancho() + this.intervalo) * index;
                y = this.starty;
                break;
            case 'derecha':
            case 'izquierda':
                x = this.startx;
                y =this.starty + (ui.baraja.ancho() + this.intervalo) * index;
                break;
        }
        return { x: x , y: y};
    }

    public quitarCarta(carta: Carta): void {
        var i: number;
        for (i = 0; i < this.cartas.length; i++) {
            if (this.cartas[i].id === carta.id) {
                this.cartas.splice(i,1);
                break;
            }
        }
    }

    public ponerCarta(carta: Carta): void {
        var i: number;
        for (i = 0; i < this.cartas.length; i++) {
            if (this.cartas[i].id === carta.id) {
                return;
            }
        }
        this.cartas.push(carta);
    }
}

export class GBaza {
    public cartas: Array<Carta>; // Array de cartas con la baza actual, en el orden en que se han echado.
    public nombres: Array<string>; // Array de nombres de los jugadores, en el orden en que han jugado.
    public ganador: string; // ganador de la baza.
    private margen: number; 

    constructor() {
        this.init();
    }

    public init(): void {
        this.cartas = [];
        this.nombres = [];
        this.ganador = '';
    }

    public dibujar(): void {
        var context = ui.canvas.context();
        this.margen = 10;
        for (var i = 0; i < this.cartas.length; i++) {
            var posicion = ui.posicion(this.nombres[i]);
            var x: number , y: number;
            switch (posicion) {
                case "abajo":
                    x = (ui.canvas.ancho() - ui.baraja.ancho()) / 2;
                    y = ui.canvas.alto() - 2 * (ui.baraja.alto() + this.margen);
                    break;
                case "arriba":
                    x = (ui.canvas.ancho() - ui.baraja.ancho()) / 2;
                    y = ui.baraja.alto() + (2 * this.margen);
                    break;
                case "derecha":
                    x = ui.canvas.ancho() - (2 * this.margen) - ui.baraja.alto() - ui.baraja.ancho();
                    y = (ui.canvas.alto() - ui.baraja.alto()) / 2;
                    break;
                case "izquierda":
                    x = ui.baraja.alto() + (2 * this.margen);
                    y = (ui.canvas.alto() - ui.baraja.alto()) / 2;
                    break;
            }
            if (this.ganador === '') { 
                context.drawImage(ui.baraja.imagen(this.cartas[i].id), x , y);
            } else {
                if (this.nombres[i] === this.ganador) {
                    context.drawImage(ui.baraja.imagen(this.cartas[i].id), x , y);
                } else {
                    context.drawImage(ui.baraja.reverso, x , y);
                }
            }
        }
    } 

    public puntoMueve(nombre: string): any {
        var x: number , y: number;
        var posicion = ui.posicion(nombre);
        switch (posicion) {
            case "abajo":
                x = (ui.canvas.ancho() - ui.baraja.ancho()) / 2;
                y = ui.canvas.alto() - 2 * (ui.baraja.alto() + this.margen);
                break;
            case "arriba":
                x = (ui.canvas.ancho() - ui.baraja.ancho()) / 2;
                y = ui.baraja.alto() + (2 * this.margen);
                break;
            case "derecha":
                x = ui.canvas.ancho() - (2 * this.margen) - ui.baraja.alto() - ui.baraja.ancho();
                y = (ui.canvas.alto() - ui.baraja.alto()) / 2;
                break;
            case "izquierda":
                x = ui.baraja.alto() + (2 * this.margen);
                y = (ui.canvas.alto() - ui.baraja.alto()) / 2;
                break;
        }
        return { x: x, y: y};
    }
}

export class GMazo {
    public numCartas: number;
    public triunfo: any;

    constructor() {
        this.init();
    }

    public init(): void {
        this.numCartas = 0; // el número de cartas que hay en el mazo (incluyendo la carta de triunfo)
        this.triunfo = 0; // carta que marca triunfo. alguien la tendrá que poner
    }

    public dibujar(): void {
        var x: number , y: number;
        var context = ui.canvas.context();
        if (this.numCartas === 0 && this.triunfo != 0) {
            x = ui.canvas.ancho() / 2 - 32;
            y = ui.canvas.alto() / 2 - 32;
            context.drawImage(ui.baraja.palos[this.triunfo.palo] , x , y , 64 , 64);
            return;
        }        
        x = (ui.canvas.ancho() - ui.baraja.ancho()) / 2 ;
        y = (ui.canvas.alto() - ui.baraja.alto()) / 2;
        // Dibujamos carta de triunfo
        if (this.triunfo != 0) {
            var cx = x + ui.baraja.ancho()/2;
            var cy = y + ui.baraja.alto()/2;
            // Hay que trasladarse al centro de la figura que se quiere girar, establecer la rotación y volver al origen
            context.translate(cx , cy);
            context.rotate((Math.PI / 180) * 90);
            context.translate(-cx , - cy);
            context.drawImage(ui.baraja.imagen(this.triunfo.id) , x , y);
            context.translate(cx , cy);
            context.rotate(-(Math.PI / 180) * 90);
            context.translate(-cx , - cy);
        }
        // Dibujamos las cartas del mazo. Boca abajo, tantas como this.numCartas hay, menos 1 (el triunfo)
        // Vamos desplazando un poquito las cartas para que se vea mazo. (mola!)
        x -= ui.baraja.ancho() / 2 ;
        for (var i = 0 ; i < this.numCartas-1; i++) {
            context.drawImage(ui.baraja.reverso, x+i , y);
        }
    }

    /**
     * Devuelve la posicion de inicio para el movimiento de la carta
     */
    public puntoMueve(): any {
        var x =  (ui.canvas.ancho() - ui.baraja.ancho()) / 2 ;
        var y = (ui.canvas.alto() - ui.baraja.alto()) / 2;
        return { x: x, y: y};
    }
}

export class GGanadas {
    public parejas: Array<Array<string>>; // Nombres de los jugadores que forman las parejas. elem. 0  pareja 1, elem. 1 pareja 2
    private ganadas: Array<number>; // Número de cartas ganadas por cada pareja
    private giros: Array<number>; // Array de giros (angulos de giro) de cada carta en el montón.
    private zonas: Array<Zona>; // Zona para hacer click en el montón.

    constructor() {
        this.parejas = [];
        this.init();
    }

    public init() {
        this.ganadas = []; 
        this.ganadas.push(0);
        this.ganadas.push(0);
        this.giros = [];
        this.zonas = [];
        var punto = this.obtenerPunto(0);
        this.zonas[0] = new Zona(punto.x, punto.y , punto.x + ui.baraja.alto() , punto.y + ui.baraja.alto());
        punto = this.obtenerPunto(1);
        this.zonas[1] = new Zona(punto.x, punto.y , punto.x + ui.baraja.alto() , punto.y + ui.baraja.alto());
    }

    public dibujar(): void {
        var punto = this.obtenerPunto(0);
        this.dibujarCartas(0, punto.x , punto.y);
        punto = this.obtenerPunto(1);
        this.dibujarCartas(1, punto.x , punto.y);
    }

    public obtenerPunto(indice: number): any {
        var x: number , y: number;
        if (indice === 0) {
            x = ui.baraja.alto() * 1.5;
            y = ui.canvas.alto() - ui.baraja.alto() * 1.5;
            return {x: x , y: y};
        }
        if (indice === 1) {
            x = ui.canvas.ancho() - ui.baraja.alto() * 2.2;
            y = ui.baraja.alto() * 0.5;
            return {x: x , y: y};
        }
    }

    private dibujarCartas(index: number, x: number , y: number): void {
        var i: number;
        var context = ui.canvas.context();
        var cx = x + ui.baraja.ancho()/2;
        var cy = y + ui.baraja.alto()/2;
        for (i = 0 ; i < this.ganadas[index]; i++) {
            var giro;
            if (this.giros[i] != null) {
                giro = this.giros[i];
            } else {
                giro = Math.random()*90;
                this.giros[i] = giro;
            }
            context.translate(cx , cy);
            context.rotate((Math.PI / 180) * giro);
            context.translate(-cx , - cy);
            context.drawImage(ui.baraja.reverso , x , y);
            context.translate(cx , cy);
            context.rotate(-(Math.PI / 180) * giro);
            context.translate(-cx , - cy);
        }
    }

    public addCartas(nombre: string , numCartas: number): void {
        for (var i = 0; i < 2; i++) {
            if (this.parejas[i][0] === nombre || this.parejas[i][1] === nombre) {
                this.ganadas[i] += numCartas;
            }
        }
    }

    public puntoMueve(nombre: string): any {
        var punto: any;
        if (this.parejas[0][0] === nombre || this.parejas[0][1] === nombre) {
            punto = this.obtenerPunto(0);
        }
        if (this.parejas[1][0] === nombre || this.parejas[1][1] === nombre) {
            punto = this.obtenerPunto(1);
        }
        return { x : punto.x , y : punto.y };
    }

    /**
     * Detecta si se ha hecho click en alguno de los bloques de cartas ganadas. Si no se ha hecho click devuelve -1.
     * Si se ha hecho click en las cartas propias se devuelve 0 y en las ajenas 1.
     * @param {*} x 
     * @param {*} y 
     */
    public click(x: number , y: number): number {
        for (var i = 0; i < 2; i++) {
            if (this.ganadas[i] > 0) {
                if (this.zonas[i].estaDentro(x / ui.canvas.escala() , y / ui.canvas.escala())) {
                    return i;
                } 
            }
        }
        return -1;
    }
}

export class UI {
    public baraja: GBaraja; // Baraja con las imágenes de las cartas
    public canvas: MiCanvas; // Canvas
    public baza: GBaza; // Baza actual
    public mazo: GMazo; // Mazo. Cartas en el centro de la mesa
    public ganadas: GGanadas; // Cartas ganadas por las parejas.
    public jugadores: Array<GJugador>; // Array de jugadores
    public verde: HTMLImageElement; // Luz verde
    public roja: HTMLImageElement; // Luz roja
    private gris: HTMLImageElement; // Luz gris
    public animaciones: Array<Animacion>; // Array de animaciones en curso
    public sounds: Array<HTMLAudioElement>; // Array de sonidos
    public chupito: Chupito; // Chupito

    constructor() {
    }

    public primerInit(): void {
        this.baraja = new GBaraja();
        this.canvas = new MiCanvas();
        this.baza = new GBaza();
        this.mazo = new GMazo();
        this.ganadas = new GGanadas();
        this.jugadores = [];
        this.verde = new Image();
        this.verde.src = '../client/img/Luz-verde.png';             
        this.roja = new Image();
        this.roja.src = '../client/img/Luz-roja.png';             
        this.gris = new Image();
        this.gris.src = '../client/img/Luz-off.png';   
        this.animaciones = [];    
        this.sounds = [];
        this.sounds[0] = new Audio('../client/img/playcard.mp3');
        this.sounds[1] = new Audio('../client/img/error.mp3');
        this.chupito = new Chupito();
        setInterval(this.parpadeo , 600);    // Arranco el timer. Un solo timer para todas las partidas
    }

    /**
     * Aqui se inicializa todo lo necesario cuando comienza una partida (evento NuevaPartida)
     */
    public init(): void {
        this.animaciones = [];
        this.baza.init();
        this.mazo.init();
        this.ganadas.init();
        this.jugadores.forEach(jugador => {
            jugador.init();
        })
    }

    /**
     * Cuando comienza un coto nuevo (Evento ComienzaPartida)
     */
    public initCompleto(): void {
        this.jugadores = [];
        this.init();
    }

    public crearJugador(nombre: string, posicion: string): GJugador {
        var jugador = new GJugador(nombre, posicion);
        this.jugadores.push(jugador);
        return jugador;
    }

    public dibujar(): void {
        redibujar();
    }

    /**
     * Rastrea la carta donde se ha hecho click, donde x e y son las coordenadas del canvas (sin escalar) donde se ha pulsado
     * el ratón. Si el click se ha hecho sobre una carta de los jugadores devuelve un objeto click. Si las cartas son 
     * visibles devuelve la información completa (nombre del jugador, carta e indice). Si las cartas no son visibles, 
     * no devuelve la carta.
     * @param {*} x 
     * @param {*} y 
     */
    public click(x:number , y: number): Click {
        var jugador:GJugador , zona: Zona, miclick: Click;
        for (var i = 0; i < this.jugadores.length; i++) {
            jugador = this.jugadores[i];
            for (var j = 0; j < jugador.zonas.length; j++) {
                zona = jugador.zonas[j];
                if (zona.estaDentro(x / this.canvas.escala() , y / this.canvas.escala())) {
                    if (jugador.visible) {
                        miclick = new Click(jugador.nombre , jugador.cartas[j] , j);
                    } else {
                        miclick = new Click(jugador.nombre , null , j);
                    }
                    return miclick;
                    break;
                }
            }
        }
        return null;
    }

    /**
     * Devuelve en que posición (arriba, abajo...) está el jugador cuyo nombre se pasa como parametro.
     * @param {*} nombre - nombre del jugador
     */
    public posicion(nombre: string): string {
        for(var i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nombre === nombre) {
                return this.jugadores[i].posicion;
            }
        }
        return null;
    }

    public indice(nombre: string): number {
        for(var i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nombre === nombre) {
                return i;
            }
        }
        return null;
    }

    public ponerTurno(jugador: GJugador): void {
        this.quitarTurno();
        jugador.turno = true;
        jugador.luzVerde = false;
    }

    public quitarTurno(): void {
        this.jugadores.forEach(jugador => {
            jugador.turno = false;
        });
    }

    public parpadeo(): void {
        var context = ui.canvas.context();
        var jugador: GJugador , mantener = false;
        for (var i = 0; i < ui.jugadores.length; i++) {
            jugador = ui.jugadores[i];
            if (jugador.turno) {
                if (!jugador.luzVerde) {
                    jugador.luzVerde = true;
                    context.drawImage(ui.verde , jugador.luzx , jugador.luzy);
                } else {
                    jugador.luzVerde = false;
                    context.drawImage(ui.gris , jugador.luzx , jugador.luzy);        
                }
                break;
            }
        }
    }

    /**
     * Movimiento de carta desde el mazo a las cartas de un jugador (Acción Dar1Carta)
     * @param {*} nombre - Nombre del jugador que recibe la carta
     * @param {*} carta - Carta que se mueve
     */
    public mueveMazoJugador(nombre: string, carta: Carta): void {
        if (debug) console.log('mueveMazoJugador' , nombre, carta);
        var desde = this.mazo.puntoMueve();
        var indice = this.indice(nombre);
        var hasta = this.jugadores[indice].puntoMueve(this.jugadores[indice].cartas.length); // añadimos al final
        var animacion = new Animacion(this.baraja.reverso , desde , hasta);
        animacion.xindice = indice;
        animacion.xcarta = carta;
        animacion.callback = ui.callbackMazoJugador;
        this.animaciones.push(animacion);
        this.mazo.numCartas -= 1; // quito carta del origen
        this.dibujar();
    }

    /**
     * Callback para el movimiento MazoJugador (Método que se invoca para finalizar el movimiento)
     * Añade la carta a las del jugador
     * @param {*} animacion 
     */
    public callbackMazoJugador(animacion: Animacion): void {
        if (debug) console.log("callbackMazoJugador" , animacion.xcarta ,animacion.xindice);
//        ui.jugadores[animacion.xindice].cartas.push(animacion.xcarta);
        ui.jugadores[animacion.xindice].ponerCarta(animacion.xcarta);
    }

    /**
     * Movimiento de carta desde el jugador a la baza (Acción CartaJugada)
     * @param {*} nombre - nombre del jugador que echa la carta
     * @param {*} carta - Carta que se juega
     * @param {*} indiceCarta - Indice de la carta en el array de cartas del jugador
     */
    public mueveJugadorBaza(nombre: string, carta: Carta, indiceCarta: number): void {
        if (debug) console.log('mueveJugadorBaza' , nombre, carta, indiceCarta);
        var indice = this.indice(nombre);
        var desde = this.jugadores[indice].puntoMueve(indiceCarta);
        var hasta = this.baza.puntoMueve(nombre);
        var animacion = new Animacion(this.baraja.imagen(carta.id) , desde , hasta);
        animacion.xnombre = nombre;
        animacion.xcarta = carta;
        animacion.callback = ui.callbackJugadorBaza;
        this.animaciones.push(animacion);
        this.jugadores[indice].cartas.splice(indiceCarta,1); // Quitamos carta del jugador
        this.jugadores[indice].zonas.splice(indiceCarta,1); // quitamos zona
        this.dibujar();
    } 

    /**
     * Callback para el movimiento Jugador Baza. Añade la carta en la baza
     * @param {} animacion 
     */
    private callbackJugadorBaza(animacion: Animacion): void {
        if (debug) console.log("callbackJugadorBaza" , animacion.xnombre ,animacion.xcarta);
        ui.baza.cartas.push(animacion.xcarta);
        ui.baza.nombres.push(animacion.xnombre);
    }

    /**
     * Movimiento para recoger cartas. Mueve simultáneamente las cartas desde la baza (4 areas) a la zona de 
     * recogida. (Evento RecogeCartas)
     * @param {*} nombre - nombre de uno de los jugadores de la pareja que ha ganado la baza 
     */
    public mueveBazaGanadas(nombre: string): void {
        while (this.baza.nombres.length > 0) {
            var desde = this.baza.puntoMueve(this.baza.nombres[0]);
            var hasta = this.ganadas.puntoMueve(nombre);
            var animacion = new Animacion(this.baraja.imagen(this.baza.cartas[0].id) , desde , hasta);
            animacion.xnombre = nombre;
            animacion.callback = ui.callbackBazaGanadas;
            this.animaciones.push(animacion);
            this.baza.cartas.shift();
            this.baza.nombres.shift();
            this.dibujar();
        }
    }

    /**
     * Callback para el movimiento BazaGandas. Añade la carta en ui.ganadas.
     * @param {*} animacion 
     */
    private callbackBazaGanadas(animacion: Animacion): void {
        ui.ganadas.addCartas(animacion.xnombre , 1);
    }

    /**
     * Movimiento del cambio del 7. Realiza los dos movimientos: La ida del 7, desde al jugador al mazo, y la vuelta
     * de la carta sustituida, del mazo al jugador. El segundo movimiento se hace en el callback del primero, para que
     * los movimientos se hagan uno tras otro.
     * @param {*} nombre - Jugador que cambia el 7.
     * @param {*} carta - El 7 que estamos moviendo
     * @param {*} indiceCarta - Indice del 7 en el array del jugador
     * @param {*} cartaTriunfo - Carta que recoge el jugador (la que marcaba el triunfo)
     */
    public mueveCambio7(nombre: string, carta: Carta, indiceCarta: number, cartaTriunfo: Carta): void {
        if (debug) console.log("mueveCambio7" , nombre, carta, indiceCarta);
        var indice = this.indice(nombre);
        var desde = this.jugadores[indice].puntoMueve(indiceCarta);
        var hasta = this.mazo.puntoMueve();
        var animacion = new Animacion(this.baraja.imagen(carta.id) , desde , hasta);
        animacion.xnombre = nombre;
        animacion.xcarta = carta;
        animacion.xindice = indiceCarta;
        animacion.xcartaTriunfo = cartaTriunfo;
        animacion.callback = ui.callbackCambio7Ida;
        this.animaciones.push(animacion);
        this.jugadores[indice].quitarCarta(carta);
        this.dibujar();
    }

    /**
     * Callbak para el primer movimiento del cambio del 7. Coloca el 7 como carta de triunfo y lanza el movimiento 
     * de vuelta
     * @param {*} animacion 
     */
    private  callbackCambio7Ida(animacion: Animacion): void {
        if (debug) console.log("callbackCambio7Ida" , animacion);
        ui.mazo.triunfo = animacion.xcarta;
        // Hacer el movimiento de vuelta
        var indice = ui.indice(animacion.xnombre);
        var desde = ui.mazo.puntoMueve();
        var hasta = ui.jugadores[indice].puntoMueve(ui.jugadores[indice].cartas.length);
        var animacion2 = new Animacion(ui.baraja.imagen(animacion.xcartaTriunfo.id) , desde , hasta);
        animacion2.xnombre = animacion.xnombre;
        animacion2.xcarta = animacion.xcartaTriunfo;
        animacion2.xindice = animacion.xindice;
        animacion2.callback = ui.callbackCambio7Vuelta;
        ui.animaciones.push(animacion2);
        window.requestAnimationFrame(redibujar);
    }

    /**
     * Callback del segundo movimiento del cambio del 7. Movimiento de vuelta de la carta sustituida, desde el 
     * mazo al jugador
     * @param {*} animacion 
     */
    private callbackCambio7Vuelta(animacion: Animacion): void {
        if (debug) console.log("callbackCambio7Vuelta" , animacion);
        var indice = ui.indice(animacion.xnombre);
        ui.jugadores[indice].ponerCarta(animacion.xcarta);
    }
}

export class Click {
    readonly nombre: string;
    readonly carta: Carta;
    readonly indice: number;

    constructor(nombre: string , carta: Carta , indice: number) {
        this.nombre = nombre;
        this.carta = carta;
        this.indice = indice;
    }
}

export class Animacion {
    private velocidad: number; // Velocidad en pixeles / milisegundo a la que se desplaza la imagen
    private imagen: HTMLImageElement; // Imagen que se mueve
    private inicio: any; // Coordenadas del punto de partida
    private fin: any; // Coordenadas del punto de destino
    private milis: number;
    private a: number;
    public terminado: boolean; // cuando es true, la animación ha terminado (se ha llegado al punto de destino)
    private actual: any; // posición actual de la imagen
    public callback: any; // función de callback a la que se llama una vez que la animación ha finalizado
    public xnombre: string; // Las propiedades que empiezan por x son valores que usan las funciones de callback
    public xindice: number;
    public xcarta: Carta;
    public xcartaTriunfo: Carta;

    constructor(imagen: HTMLImageElement , inicio: any, fin: any) {
        this.velocidad = 1.2;
        this.imagen = imagen;
        this.inicio = inicio;
        this.fin = fin;
        this.milis = 0;
        this.a = Math.sqrt((this.fin.x - this.inicio.x)*(this.fin.x - this.inicio.x) + (this.fin.y - this.inicio.y)*(this.fin.y - this.inicio.y)); // distancia entre inicio y fin
        this.terminado = false;
    }

    public dibujar(): void {
        if (this.terminado) {
            return;
        }
        var context = ui.canvas.context();
        var time = new Date();
        if (this.milis === 0) { // la primera vez
            this.milis = time.getTime();
            context.drawImage(this.imagen, this.inicio.x , this.inicio.y);
            this.actual = this.inicio;
            this.terminado = false;
            return;
        }
        var t = time.getTime();
        var delta = t - this.milis;
        this.milis = t;
        var d = this.velocidad * delta; // Distancia recorrida en el intervalo
        this.actual.x = this.actual.x + ((this.fin.x - this.actual.x) * d) / this.a; // posicion actual
        this.actual.y = this.actual.y + ((this.fin.y - this.actual.y)) * d / this.a;
        if (this.a < d) { // Si la distancia que avanzamos es mayor que lo que nos queda ya hemos llegado
            this.terminado = true;
            this.actual.x = this.fin.x; 
            this.actual.y = this.fin.y;   
        }
        context.drawImage(this.imagen, this.actual.x , this.actual.y);
        this.a = Math.sqrt((this.fin.x - this.actual.x)*(this.fin.x - this.actual.x) + (this.fin.y - this.actual.y)*(this.fin.y - this.actual.y));
    }
}

/**
 * Dibuja todo el canvas. Primero dibuja las animaciones, si las hay, y después
 * los objetos estáticos: Jugador, baza, mazo y cartas ganadas.
 */
function redibujar() {
    ui.canvas.ponerFondo();
    // Dibujamos las animaciones primero
    for (var i = ui.animaciones.length - 1 ; i >= 0 ; i--) {
        var animacion = ui.animaciones[i];
        if (main.movimiento) {
            if (!animacion.terminado) {
                animacion.dibujar();
            } else { // animacion terminada. La función de callback hace las acciones posteriores al movimiento.
                animacion.callback(animacion); // llamo a la funcion de callback de la animación que está en ui!!! calback...
                ui.animaciones.splice(i,1); // quitamos la animacion de la lista
            }; 
        } else {// sin movimiento equivale a animación terminada. Se llama al callback y se elimina de la lista
            animacion.callback(animacion); 
            ui.animaciones.splice(i,1); 
        }
    }
    // Dibujamos los objetos estaticos
    ui.jugadores.forEach(jugador => {
        jugador.dibujar();
    });
    ui.baza.dibujar();
    ui.mazo.dibujar();
    ui.ganadas.dibujar();
    ui.chupito.dibujar();
    // Si hay animaciones en marcha invocamos de nuevo redibujar para que continue.
    if (ui.animaciones.length > 0) {
        window.requestAnimationFrame(redibujar);
    }
}

export class Chupito {

    private imgs: Array<HTMLImageElement>; // array de imágenes de chupito
    public current: number; // Indice del array de imagenes que apunta a la imagen actual

    constructor() {
        this.imgs = [];
        for (var i = 0; i < 7; i++) {
            this.imgs[i] = new Image();
            this.imgs[i].src = '../client/img/chupito' + i + '.png';
        }
        this.current = -1;
    }

    public ponerChupito(): void {
        if (main.nombreJugador.toLowerCase().indexOf("rafa") >= 0 ||
            main.nombreJugador.toLowerCase().indexOf("ferruz") >= 0) { // Rafa siempre chupito blanco.
            this.current = 1;
        } else {
            this.current =  Math.floor(Math.random() * 7);
        }
    }

    public quitarChupito(): void {
        this.current = -1;
    }

    public dibujar(): void {
        if (this.current >= 0) {
            var context = ui.canvas.context();
            var x = Math.floor(window.innerWidth - 210) / ui.canvas.escala();
            var y = Math.floor(window.innerHeight - 180) / ui.canvas.escala() ;
            context.drawImage(this.imgs[this.current], x , y);
        }
    }
}