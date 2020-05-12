/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

/**
 * Objeto que tiene las imágenes de todas las cartas
 */
class GBaraja {
    constructor() {
        this.leerCartas();
    }
    
    leerCartas() {
        this.leidas = 0;
        this.imagenes = [];
        var i;
        for (i = 0 ; i < 40 ; i++) {
            this.imagenes[i] = new Image();
            this.imagenes[i].addEventListener('load', () => {
                this.leidas++;
                if (this.leidas == 40) console.log('Todas las cartas leidas');
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

    ancho() {
        return 123;
    }

    alto() {
        return 190;
    }

    get(i) {
        return this.imagenes[i];
    }
}

class MiCanvas {

    constructor() {
        this.fondo = new Image();
        this.fondo.src = '../client/img/paperGreen.png';
        this.fondo.addEventListener('load', () => {
            // create pattern
            var context = document.getElementById("canvas").getContext("2d");
            this.ptrn = context.createPattern(this.fondo, 'repeat'); // Create a pattern with this image, and set it to "repeat".
       }, false);    }

    fullScreen() {
        this.canvas().height = window.innerHeight - 20;
        this.canvas().width = window.innerWidth - 20;
        this.fijarEscala();
        this.ponerFondo();
    }

    ponerFondo() {
        var context = document.getElementById("canvas").getContext("2d");
        context.fillStyle = this.ptrn;
        context.fillRect(0, 0, window.innerWidth / this.scale, window.innerHeight / this.scale); // context.fillRect(x, y, width, height);
    }

    fijarEscala() {
        var ratio = 5.5; // número de cartas enteras que quiero que quepan
        var alto = window.innerHeight - 20;
        var ancho = window.innerWidth - 20;
        if (alto < ancho) { // para pantallas alargadas (PC)
            var altoCartas = 190;
            this.scale = alto / (190 * ratio);
            console.log(this.scale);
            this.context().scale(this.scale , this.scale);    
        } else { // para pantallas tipo móvil
            var anchoCartas = 123;
            this.scale = ancho / (123 * ratio);
            console.log(this.scale);
            this.context().scale(this.scale , this.scale);    
        }
    }

    ancho() {
        return (window.innerWidth - 20) / this.escala();
    }

    alto() {
        return (window.innerHeight - 20) / this.escala();
    }

    escala() {
        return this.scale;
    }

    canvas() {
        return document.getElementById("canvas");
    }

    context() {
        var canvas = document.getElementById("canvas");
        return canvas.getContext("2d");
    }
}

class Zona {
    constructor(startX , startY , endX, endY) {
        this.startx = startX;
        this.starty = startY;
        this.endx = endX;
        this.endy = endY;
    } 

    estaDentro(x , y) {
        if (x >= this.startx && x <= this.endx) {
            if (y >= this.starty && y <= this.endy) {
                return true;
            }
        }
        return false;
    }
}

class GJugador {
    /* Variables
    * this.cartas [] - Array de cartas
    * this.nombre - Nombre del jugador  
    * this.posicion - Posición del jugador en la pantalla. 4 posibilidades: arriba, abajo, derecha e izquierda. 
    *                 Al asignar la posición se calculan las posiciones de las cartas.
    * this.visible - true (se ven las cartas por su lado bueno) or false (solo se ve el reverso).
    * this.margen - Margen del borde de la pantalla que toque hasta las cartas.
    * this.intervalo - Distancia entre el borde de una carta y la siguiente. Puede ser negativo, y entonces las cartas se solapan
    * this.turno - true si el jugador tiene el turno
    * this.zonas [] - Array de zonas (rectangulos) que son las posiciones fisicas ocupadas por las cartas (para el click)
    */
    constructor(ui, nombre, posicion) {
        this.ui = ui;
        this.nombre = nombre;
        this.posicion = posicion;
        this.cartas = [];
        this.zonas = [];
        this.margen = 10;
        this.visible = false;
        this.turno = false;
        this.paloCantes = [];
        this.intervalId = 0;
    }

    init() {
        this.cartas = [];
        this.paloCantes = [];
//        this.quitarTurno();
        this.turno = false;
    }

    dibujar() {        
        var context = this.ui.canvas.context();
        // calculamos posiciones
        this.calcularPosiciones();
        // Dibujamos cartas
        this.zonas = [];
        this.cartas.forEach(carta => {
            this.zonas.push(new Zona(this.startx, this.starty , this.startx + this.ui.baraja.ancho() , this.starty + this.ui.baraja.alto()));
            if (!this.giro) {
                this.ponerImagen(carta , this.startx , this.starty);
                this.startx += this.ui.baraja.ancho() + this.intervalo;
            } else {
                var cx = this.startx  + this.ui.baraja.alto()/2;
                var cy = this.starty + this.ui.baraja.ancho()/2;
                // Hay que trasladarse al centro de la figura que se quiere girar, establecer la rotación y volver al origen
                context.translate(cx , cy);
                context.rotate((Math.PI / 180) * 90);
                context.translate(-cx , - cy);
                this.ponerImagen(carta , this.startx , this.starty);
                this.starty += this.ui.baraja.ancho() + this.intervalo;
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
        drawTextBG(context, this.nombre, "30px Arial", this.nombrex, this.nombrey);
        // Ponemos luz de turno
        this.ponerLuz();
        // Ponemos los cantes
        var i;
        var escala = this.ui.canvas.escala();
        this.paloCantes.forEach(cante =>{
            if (cante === -1) {
                context.drawImage(this.ui.baraja.paloReverso, this.cantex , this.cantey , 32 , 32);
            } else {
                context.drawImage(this.ui.baraja.palos[cante], this.cantex , this.cantey , 32 , 32);
            }
            this.cantex += 36;
        });
    }

    calcularPosiciones() {
        var ancho , alto;
        switch (this.posicion) {
            case 'abajo':
                this.intervalo = 10;
                ancho = this.ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = (this.ui.canvas.ancho() - ancho) / 2;
                this.starty = this.ui.canvas.alto() - this.ui.baraja.alto() - this.margen;
                this.giro = false;
                // Nombre
                this.nombrex = (this.ui.canvas.ancho() - ancho ) / 2 + ancho + this.margen;
                this.nombrey = this.ui.canvas.alto() - 50 ;
                // luz de turno
                this.luzx = (this.ui.canvas.ancho() - ancho ) / 2 + ancho + this.margen;
                this.luzy = this.ui.canvas.alto() - 85 ;
                // cantes
                this.cantex = (this.ui.canvas.ancho() - ancho ) / 2 + ancho + this.margen;
                this.cantey = this.ui.canvas.alto() - 115 ;
                break;
            case 'arriba':
                this.intervalo = 10;
                ancho = this.ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = (this.ui.canvas.ancho() - ancho) / 2;
                this.starty = this.margen;
                this.giro = false;
                // nombre
                this.nombrex = (this.ui.canvas.ancho() - ancho ) / 2 + this.margen - 200;
                this.nombrey = 50 ;
                // luz de turno
                this.luzx = (this.ui.canvas.ancho() - ancho ) / 2 + this.margen - 200;
                this.luzy = 85 ;
                // cantes
                this.cantex = (this.ui.canvas.ancho() - ancho ) / 2 + this.margen - 200;
                this.cantey = 115 ;
                break;
            case 'izquierda':
                this.intervalo = -30;
                alto = this.ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = this.margen + (this.ui.baraja.alto() - this.ui.baraja.ancho()) / 2;
                this.starty = (this.ui.canvas.alto() - alto) / 2;
                this.giro = true;
                // nombre
                this.nombrex = 10;
                this.nombrey = (this.ui.canvas.alto() - alto ) / 2 + alto;
                // luz de turno
                this.luzx = 10;
                this.luzy = (this.ui.canvas.alto() - alto ) / 2 + alto + 35;
                // cantes
                this.cantex = 10;
                this.cantey = (this.ui.canvas.alto() - alto ) / 2 + alto + 65;
                break;
           case 'derecha':
                this.intervalo = -30;
                alto = this.ui.baraja.ancho() * this.cartas.length + this.intervalo * (this.cartas.length - 1);
                this.startx = this.ui.canvas.ancho() - this.margen - this.ui.baraja.alto() + (this.ui.baraja.alto() - this.ui.baraja.ancho()) / 2;
                this.starty = (this.ui.canvas.alto() - alto) / 2;
                this.giro = true;
                // nombre
                this.nombrex = this.ui.canvas.ancho() - 200;
                this.nombrey = (this.ui.canvas.alto() - alto ) / 2 - this.ui.baraja.ancho()/2 - this.margen;
                // luz de turno
                this.luzx = this.ui.canvas.ancho() - 200;
                this.luzy = (this.ui.canvas.alto() - alto ) / 2 - this.ui.baraja.ancho()/2 - this.margen - 35;
                // cantes
                this.cantex = this.ui.canvas.ancho() - 200;
                this.cantey = (this.ui.canvas.alto() - alto ) / 2 - this.ui.baraja.ancho()/2 - this.margen - 65;
                break;    
        }
    }

    ponerImagen(carta , x , y) {
        var context = this.ui.canvas.context();
        if (this.visible) {
            context.drawImage(this.ui.baraja.imagenes[carta.id], x , y);
        } else {
            context.drawImage(this.ui.baraja.reverso, x , y);
        }
    }

    ponerLuz() {
        var context = this.ui.canvas.context();
        if (this.turno) {
            context.drawImage(this.ui.verde, this.luzx , this.luzy);
        } else {
            context.drawImage(this.ui.roja, this.luzx , this.luzy);
        }

    }

    cambia7(carta){
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

    posicionarCante(indice) {
        var x ,y;
        switch (this.posicion) {
            case 'abajo':
                x = Math.floor(this.ui.canvas.ancho() * this.ui.canvas.escala() / 2  - 117 - 60 + 120* (indice -1));
                y = Math.floor(this.ui.canvas.alto() * this.ui.canvas.escala() - 245);
                break;
            case 'arriba':
                x = Math.floor(this.ui.canvas.ancho() * this.ui.canvas.escala() / 2 - 117 - 60 + 120* (indice -1));
                y = 20;
                break;
            case 'derecha':
                x = Math.floor(this.ui.canvas.ancho() * this.ui.canvas.escala() - 254);
                y = Math.floor(this.ui.canvas.alto() * this.ui.canvas.escala()  / 2 - 112 - 75 + 150* (indice -1));
                break;
            case 'izquierda':
                x = 20;
                y = Math.floor(this.ui.canvas.alto() * this.ui.canvas.escala() / 2 - 117 - 75 + 150* (indice -1));
                break;
        }
        return { x: x , y: y};
    }

    /**
     * Punto de salida o llegada para las animaciones. Index es el índice de la carta que sale o llega. Si llega
     * hacer que sea = cartas.length. Si sale puede ser cualquiera
     */
    puntoMueve(index) {
        this.calcularPosiciones();
        var x , y ;
        switch (this.posicion) {
            case 'abajo':
            case 'arriba':
                x = this.startx + (this.ui.baraja.ancho() + this.intervalo) * index;
                y = this.starty;
                break;
            case 'derecha':
            case 'izquierda':
                x = this.startx;
                y =this.starty + (this.ui.baraja.ancho() + this.intervalo) * index;
                break;
        }
        return { x: x , y: y};
    }

    quitarCarta(carta) {
        var i;
        for (i = 0; i < this.cartas.length; i++) {
            if (this.cartas[i].id === carta.id) {
                this.cartas.splice(i,1);
                break;
            }
        }
    }
}

class GBaza {
    constructor(ui) {
        this.ui = ui;
        this.init();
    }

    init() {
        this.cartas = [];
        this.nombres = [];
        this.ganador = '';
    }

    dibujar() {
        var context = this.ui.canvas.context();
        this.margen = 10;
        var i;
        for (i = 0; i < this.cartas.length; i++) {
            var posicion = this.ui.posicion(this.nombres[i]);
            var x , y;
            switch (posicion) {
                case "abajo":
                    x = (this.ui.canvas.ancho() - this.ui.baraja.ancho()) / 2;
                    y = this.ui.canvas.alto() - 2 * (this.ui.baraja.alto() + this.margen);
                    break;
                case "arriba":
                    x = (this.ui.canvas.ancho() - this.ui.baraja.ancho()) / 2;
                    y = this.ui.baraja.alto() + (2 * this.margen);
                    break;
                case "derecha":
                    x = this.ui.canvas.ancho() - (2 * this.margen) - this.ui.baraja.alto() - this.ui.baraja.ancho();
                    y = (this.ui.canvas.alto() - this.ui.baraja.alto()) / 2;
                    break;
                case "izquierda":
                    x = this.ui.baraja.alto() + (2 * this.margen);
                    y = (this.ui.canvas.alto() - this.ui.baraja.alto()) / 2;
                    break;
            }
            if (this.ganador === '') { 
                context.drawImage(this.ui.baraja.imagenes[this.cartas[i].id], x , y);
            } else {
                if (this.nombres[i] === this.ganador) {
                    context.drawImage(this.ui.baraja.imagenes[this.cartas[i].id], x , y);
                } else {
                    context.drawImage(this.ui.baraja.reverso, x , y);
                }
            }
        }
    } 

    puntoMueve(nombre) {
        var x , y;
        var posicion = this.ui.posicion(nombre);
        switch (posicion) {
            case "abajo":
                x = (this.ui.canvas.ancho() - this.ui.baraja.ancho()) / 2;
                y = this.ui.canvas.alto() - 2 * (this.ui.baraja.alto() + this.margen);
                break;
            case "arriba":
                x = (this.ui.canvas.ancho() - this.ui.baraja.ancho()) / 2;
                y = this.ui.baraja.alto() + (2 * this.margen);
                break;
            case "derecha":
                x = this.ui.canvas.ancho() - (2 * this.margen) - this.ui.baraja.alto() - this.ui.baraja.ancho();
                y = (this.ui.canvas.alto() - this.ui.baraja.alto()) / 2;
                break;
            case "izquierda":
                x = this.ui.baraja.alto() + (2 * this.margen);
                y = (this.ui.canvas.alto() - this.ui.baraja.alto()) / 2;
                break;
        }
        return { x: x, y: y};
    }
}

class GMazo {
    constructor(ui) {
        this.ui = ui;
        this.init();
    }

    init() {
        this.numCartas = 0; // el número de cartas que hay en el mazo (incluyendo la carta de triunfo)
        this.triunfo = 0; // carta que marca triunfo. alguien la tendrá que poner
    }

    dibujar() {
        var x , y;
        var context = this.ui.canvas.context();
        if (this.numCartas === 0 && this.triunfo != 0) {
            x = this.ui.canvas.ancho() / 2 - 32;
            y = this.ui.canvas.alto() / 2 - 32;
            context.drawImage(this.ui.baraja.palos[this.triunfo.palo] , x , y , 64 , 64);
            return;
        }        
        x = (this.ui.canvas.ancho() - this.ui.baraja.ancho()) / 2 ;
        y = (this.ui.canvas.alto() - this.ui.baraja.alto()) / 2;
        // Dibujamos carta de triunfo
        if (this.triunfo != 0) {
            var cx = x + this.ui.baraja.ancho()/2;
            var cy = y + this.ui.baraja.alto()/2;
            // Hay que trasladarse al centro de la figura que se quiere girar, establecer la rotación y volver al origen
            context.translate(cx , cy);
            context.rotate((Math.PI / 180) * 90);
            context.translate(-cx , - cy);
            context.drawImage(this.ui.baraja.imagenes[this.triunfo.id] , x , y);
            context.translate(cx , cy);
            context.rotate(-(Math.PI / 180) * 90);
            context.translate(-cx , - cy);
        }
        // Dibujamos las cartas del mazo. Boca abajo, tantas como this.numCartas hay, menos 1 (el triunfo)
        // Vamos desplazando un poquito las cartas para que se vea mazo. (mola!)
        var i;
        x -= this.ui.baraja.ancho() / 2 ;
        for (i = 0 ; i < this.numCartas-1; i++) {
            context.drawImage(this.ui.baraja.reverso, x+i , y);
        }
    }

    /**
     * Devuelve la posicion de inicio para el movimiento de la carta
     */
    puntoMueve() {
        var x =  (this.ui.canvas.ancho() - this.ui.baraja.ancho()) / 2 ;
        var y = (this.ui.canvas.alto() - this.ui.baraja.alto()) / 2;
        return { x: x, y: y};
    }
}

class GGanadas {
    constructor(ui) {
        this.ui = ui;
        this.parejas = [];
        this.init();
    }

    init() {
        this.ganadas = []; 
        this.ganadas.push(0);
        this.ganadas.push(0);
        this.giros = [];
        this.zonas = [];
        var punto = this.obtenerPunto(0);
        this.zonas[0] = new Zona(punto.x, punto.y , punto.x + this.ui.baraja.alto() , punto.y + this.ui.baraja.alto());
        punto = this.obtenerPunto(1);
        this.zonas[1] = new Zona(punto.x, punto.y , punto.x + this.ui.baraja.alto() , punto.y + this.ui.baraja.alto());
    }

    dibujar() {
        var context = this.ui.canvas.context();
        var i = 0;
        var punto = this.obtenerPunto(0);
        this.dibujarCartas(0, punto.x , punto.y);
        punto = this.obtenerPunto(1);
        this.dibujarCartas(1, punto.x , punto.y);
    }

    obtenerPunto(indice) {
        var x , y;
        if (indice === 0) {
            x = this.ui.baraja.alto() * 1.5;
            y = this.ui.canvas.alto() - this.ui.baraja.alto() * 1.5;
            return {x: x , y: y};
        }
        if (indice === 1) {
            x = this.ui.canvas.ancho() - this.ui.baraja.alto() * 2.2;
            y = this.ui.baraja.alto() * 0.5;
            return {x: x , y: y};
        }
    }

    dibujarCartas(index, x , y) {
        var i;
        var context = this.ui.canvas.context();
        var cx = x + this.ui.baraja.ancho()/2;
        var cy = y + this.ui.baraja.alto()/2;
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
            context.drawImage(this.ui.baraja.reverso , x , y);
            context.translate(cx , cy);
            context.rotate(-(Math.PI / 180) * giro);
            context.translate(-cx , - cy);
        }
    }

    addCartas(nombre , numCartas) {
        var i;
        for (i = 0; i < 2; i++) {
            if (this.parejas[i][0] === nombre || this.parejas[i][1] === nombre) {
                this.ganadas[i] += numCartas;
            }
        }
    }

    puntoMueve(nombre) {
        var punto;
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
    click(x , y) {
        var i ;
        for (i = 0; i < 2; i++) {
            if (this.ganadas[i] > 0) {
                if (this.zonas[i].estaDentro(x / this.ui.canvas.escala() , y / this.ui.canvas.escala())) {
                    return i;
                } 
            }
        }
        return -1;
    }
}

class UI {
    constructor() {
        this.baraja = new GBaraja();
        this.canvas = new MiCanvas();
        this.baza = new GBaza(this);
        this.mazo = new GMazo(this);
        this.ganadas = new GGanadas(this);
        this.jugadores = [];
        this.verde = new Image();
        this.verde.src = '../client/img/Luz-verde.png';             
        this.roja = new Image();
        this.roja.src = '../client/img/Luz-roja.png';             
        this.gris = new Image();
        this.gris.src = '../client/img/Luz-off.png';   
        this.animaciones = [];    
    }

    /**
     * Aqui se inicializa todo lo necesario cuando comienza una partida (evento NuevaPartida)
     */
    init() {
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
    initCompleto() {
        this.jugadores = [];
        this.init();
    }

    crearJugador(nombre, posicion) {
        var jugador = new GJugador(this, nombre, posicion);
        this.jugadores.push(jugador);
        return jugador;
    }

    dibujar() {
        ui = this;
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
    click(x , y) {
        var i,j, jugador, zona, miclick;
        for (i = 0; i < this.jugadores.length; i++) {
            jugador = this.jugadores[i];
            for (j = 0; j < jugador.zonas.length; j++) {
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
    posicion(nombre) {
        var i;
        for(i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nombre === nombre) {
                return this.jugadores[i].posicion;
            }
        }
        return null;
    }

    indice(nombre) {
        var i;
        for(i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nombre === nombre) {
                return i;
            }
        }
        return null;
    }

    ponerTurno(jugador) {
        this.quitarTurno();
        jugador.turno = true;
        jugador.luzVerde = false;
    }

    quitarTurno() {
        this.jugadores.forEach(jugador => {
            jugador.turno = false;
        });
    }

    parpadeo() {
        var context = ui.canvas.context();
        var i , jugador , mantener = false;
        for (i = 0; i < ui.jugadores.length; i++) {
            jugador = ui.jugadores[i];
            if (jugador.turno) {
                if (!jugador.luzVerde) {
                    jugador.luzVerde = true;
                    context.drawImage(jugador.ui.verde , jugador.luzx , jugador.luzy);
                } else {
                    jugador.luzVerde = false;
                    context.drawImage(jugador.ui.gris , jugador.luzx , jugador.luzy);        
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
    mueveMazoJugador(nombre, carta) {
        console.log('mueveMazoJugador' , nombre, carta);
        var desde = this.mazo.puntoMueve();
        var indice = this.indice(nombre);
        var hasta = this.jugadores[indice].puntoMueve(this.jugadores[indice].cartas.length); // añadimos al final
        var animacion = new Animacion(ui , this.baraja.reverso , desde , hasta);
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
    callbackMazoJugador(animacion) {
        console.log("callbackMazoJugador" , animacion.xcarta ,animacion.xindice);
        ui.jugadores[animacion.xindice].cartas.push(animacion.xcarta);
    }

    /**
     * Movimiento de carta desde el jugador a la baza (Acción CartaJugada)
     * @param {*} nombre - nombre del jugador que echa la carta
     * @param {*} carta - Carta que se juega
     * @param {*} indiceCarta - Indice de la carta en el array de cartas del jugador
     */
    mueveJugadorBaza(nombre, carta, indiceCarta) {
        console.log('mueveJugadorBaza' , nombre, carta, indiceCarta);
        var indice = this.indice(nombre);
        var desde = this.jugadores[indice].puntoMueve(indiceCarta);
        var hasta = this.baza.puntoMueve(nombre);
        var animacion = new Animacion(ui , this.baraja.imagenes[carta.id] , desde , hasta);
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
    callbackJugadorBaza(animacion) {
        console.log("callbackJugadorBaza" , animacion.xnombre ,animacion.xcarta);
        ui.baza.cartas.push(animacion.xcarta);
        ui.baza.nombres.push(animacion.xnombre);
    }

    /**
     * Movimiento para recoger cartas. Mueve simultáneamente las cartas desde la baza (4 areas) a la zona de 
     * recogida. (Evento RecogeCartas)
     * @param {*} nombre - nombre de uno de los jugadores de la pareja que ha ganado la baza 
     */
    mueveBazaGanadas(nombre) {
        var i;
//        for (i = 0; i < 4; i++) {
        while (this.baza.nombres.length > 0) {
            var desde = this.baza.puntoMueve(this.baza.nombres[0]);
            var hasta = this.ganadas.puntoMueve(nombre);
            var animacion = new Animacion(ui , this.baraja.imagenes[this.baza.cartas[0].id] , desde , hasta);
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
    callbackBazaGanadas(animacion) {
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
    mueveCambio7(nombre, carta, indiceCarta, cartaTriunfo) {
        console.log("mueveCambio7" , nombre, carta, indiceCarta);
        var indice = this.indice(nombre);
        var desde = this.jugadores[indice].puntoMueve(indiceCarta);
        var hasta = this.mazo.puntoMueve();
        var animacion = new Animacion(ui , this.baraja.imagenes[carta.id] , desde , hasta);
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
    callbackCambio7Ida(animacion) {
        console.log("callbackCambio7Ida" , animacion);
        ui.mazo.triunfo = animacion.xcarta;
        // Hacer el movimiento de vuelta
        var indice = ui.indice(animacion.xnombre);
        var desde = ui.mazo.puntoMueve();
        var hasta = ui.jugadores[indice].puntoMueve(ui.jugadores[indice].cartas.length);
        var animacion2 = new Animacion(ui , ui.baraja.imagenes[animacion.xcartaTriunfo.id] , desde , hasta);
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
    callbackCambio7Vuelta(animacion) {
        console.log("callbackCambio7Vuelta" , animacion);
        var indice = ui.indice(animacion.xnombre);
        ui.jugadores[indice].cartas.push(animacion.xcarta);
    }
}

class Click {
    constructor(nombre , carta , indice) {
        this.nombre = nombre;
        this.carta = carta;
        this.indice = indice;
    }
}

/**
 * Animación. Mueve una imagen desde unas coordenadas de inicio, hasta unas de fin. 
 * this.velocidad - Velocidad en pixeles / milisegundo a la que se desplaza la imagen
 * this.ui - Interfaz grafico
 * this.imagen - Imagen que se mueve
 * this.inicio - Coordenadas del punto de partida
 * this.fin - Coordenadas del punto de destino
 * this.terminado - true cuando la imagen ha llegdo a su punto de destino.
 * this.a - distancia ente inicio y fin.
 */
class Animacion {
    constructor(ui, imagen , inicio, fin) {
        this.velocidad = 1.2;
        this.ui = ui;
        this.imagen = imagen;
        this.inicio = inicio;
        this.fin = fin;
        this.milis = 0;
        this.a = Math.sqrt((this.fin.x - this.inicio.x)*(this.fin.x - this.inicio.x) + (this.fin.y - this.inicio.y)*(this.fin.y - this.inicio.y)); // distancia entre inicio y fin
        this.terminado = false;
    }

    dibujar() {
        if (this.terminado) {
            return;
        }
        var context = this.ui.canvas.context();
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
 * Escribe un texto sobre el canvas 
 * @param {*} ctx 
 * @param {*} txt 
 * @param {*} font 
 * @param {*} x 
 * @param {*} y 
 */
function drawTextBG(ctx, txt, font, x, y) {
    /// lets save current state as we make a lot of changes        
    ctx.save();
    /// set font
    ctx.font = font;
    /// draw text from top - makes life easier at the moment
    ctx.textBaseline = 'top';
    /// color for background
//    ctx.fillStyle = '#b0cfac';
    ctx.fillStyle = '#ffffff';
    /// get width of text
    var width = ctx.measureText(txt).width;
    /// draw background rect assuming height of font
    ctx.fillRect(x, y, width, parseInt(font, 10));
    /// text color
    ctx.fillStyle = '#000';
    /// draw text on top
    ctx.fillText(txt, x, y);
    /// restore original state
    ctx.restore();
}
var ui;

var tick = new Date(); 
/**
 * Dibuja todo el canvas. Primero dibuja las animaciones, si las hay, y después
 * los objetos estáticos: Jugador, baza, mazo y cartas ganadas.
 */
function redibujar() {
    if (navegador === 'Chrome' || navegador === 'Opera') { // para estos navegadoress, demasiadas llamadas a redibujar estropean el rendimiento
        // No pasa en Firefox y Edge. Safari no se ha probado.
        var t = new Date();
        if (t.getTime() - tick.getTime() < 5) {
            console.log(t.getTime() - tick.getTime());
            return;
        }
        tick = t; 
   }
    ui.canvas.ponerFondo();
    var i;
    // Dibujamos las animaciones primero
    for (i = ui.animaciones.length - 1 ; i >= 0 ; i--) {
        var animacion = ui.animaciones[i];
        if (movimiento) {
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
    // Si hay animaciones en marcha invocamos de nuevo redibujar para que continue.
    if (ui.animaciones.length > 0) {
        window.requestAnimationFrame(redibujar);
//        setTimeout(redibujar , 20);
    }
}
