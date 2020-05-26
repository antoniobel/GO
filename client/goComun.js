/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

/**
 * Clase base para GoJugador y GoPublico con los métodos comunes a ambas, como el selector de acciones (procesaAction) y otros
 * this.ui - Interface gráfico
 * this.ronda - ronda de juego
 * this.turno - true si el jugador local tiene el turno
 * this.partidaTerminada {} - Datos de la partida terminada (ver mas abajo)
 * this.parejas [] - 2 elemenots con los nombres (unidos) de la pareja
 * this.nombreJugador - nombre jugador local
 * this.room - Servidor. Para enviar mensajes
 */
/**
 * partidaTerminada: Recoge datos de los eventos relacionados con el final de la partida. Elementos:
 * parejas [] => 2 elemento. nombres de las parejas tal como los manda el servidor
 * puntos [] =>  2 elementos. puntos de cada pareja. congruente con parejas
 * hayVuelta => true si va a haber partida de vuelta
 * ganadores => pareja ganadora (nombres)
 * marcador [] => dos elementos. partidas ganadas por cada pareja, compatible con parejas []
 * finCoto => true si hemos terminado el coto
 */
class GoComun {

    constructor(nombre, room, ui) {
        this.nombreJugador = nombre;
        this.room = room;
        this.ui = ui;
        this.partidaTerminada = {};
        this.parejas = [];
    }

/**
 * Procesador de todas las acciones. Invocado desde el metodo room.onMessage. Llama a las funciones 
 * que ejecutan las acciones.
 * @param {*} action 
 * @param {*} data 
 */
procesaAction(action, data) {
    if (action === "ComienzaPartida") {
        document.getElementById("myModal").style.display = "none";
        document.getElementById("modalfin").style.display = "none";
        document.getElementById("ordenar").disabled = false;
        this.ui.canvas.fullScreen();
        mostrarBotones();
        this.ui.initCompleto();
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
        ui.mueveMazoJugador(data.jugador , carta);
    };    
    if (action === "Triunfo") {
        var carta = new Carta(data);
        this.ui.mazo.triunfo = carta;
        this.ui.dibujar();
    }
    if (action === "Ronda") {
        this.ui.baza.cartas = [];
        this.ui.baza.nombres = [];
        this.ronda = data;
        document.getElementById("cante").disabled = true;
        document.getElementById("cambio7").disabled = true;
    }
    if (action === "Turno") {
        var index = this.ui.indice(data);
        this.ui.ponerTurno(this.ui.jugadores[index]);
        this.ui.dibujar();
    }
    if (action === "Juega") {
        this.turno = true;
    }
    if (action === "CartaJugada") {
        var carta = new Carta(data.carta);
        this.cartaJugada(data.jugador , carta);
    }
    if (action === "BazaGanada") {
        this.bazaGanada(data);
    }
    if (action === "Puntos") {
        this.ponerPuntos(data);
    }
    if (action === "RecogeCartas") {
        this.ui.mueveBazaGanadas(data);
    }
    if (action === "PartidaTerminada") {
        this.partidaTerminada.parejas = data.parejas;
        this.partidaTerminada.puntos = data.puntos;
        this.partidaTerminada.hayVuelta = false;
        this.partidaTerminada.ganadores = '';
        this.partidaTerminada.marcador = [];
        this.partidaTerminada.finCoto = false;
        // Para que no quede ninguna luz de turno encendida.
        this.ui.quitarTurno();
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
        document.getElementById("cante").disabled = false;
    }
    if (action === "HaCantado") {
        this.haCantado(data);
    }
    if (action === "Cambio7Posible") {
        document.getElementById("cambio7").disabled = false;
    }
    if (action === "HaCambiado7") {
        this.haCambiado7(data.jugador , new Carta(data.carta));
    }
    if (action === "PartidaCancelada") {
        this.ui.init();
        document.getElementById("msg").innerHTML =  "La partida ha sido cancelada por " + data;
        document.getElementById("modalmsg").style.display = "block"; // abrimos el diálogo
        setTimeout(function() {
            this.ui.canvas.fullScreen();
            vaciaSelect(document.getElementById("usuarios"));
            vaciaSelect(document.getElementById("pareja1"));
            vaciaSelect(document.getElementById("pareja2"));
            conectado = false;
            document.getElementById("modalmsg").style.display = "none"; 
            abrirDialogoInicio();
        } , 3000);
    }
    if (action === "NoCanteCambio") {
        document.getElementById("cambio7").disabled = true;
        document.getElementById("cante").disabled = true;    
    }
    if (action === "Snapshot") {
        this.procesaSnapshot(data);
    }
    if (action === "NuevaConexion") {
        if (data !== this.nombreJugador) {
            var indice = this.ui.indice(data);
            if (indice == null) {
                document.getElementById("msg").innerHTML =  data + " se ha conectado a la partida como espectador";
            } else {
                document.getElementById("msg").innerHTML =  "El jugador " + data + " se ha reconectado a la partida";
            }
            document.getElementById("modalmsg").style.display = "block"; // abrimos el diálogo
            setTimeout(function() {
                document.getElementById("modalmsg").style.display = "none"; 
            } , 3000);   
        }
    }
    if (action === "JugadorDesconectado") {
        document.getElementById("msg").innerHTML =  "El jugador " + data + " se ha desconectado de la la partida.";
        document.getElementById("modalmsg").style.display = "block"; // abrimos el diálogo
        setTimeout(function() {
            document.getElementById("modalmsg").style.display = "none"; 
        } , 3000);   
    }
    if (action === "RevisionBaza") {
        this.revisionBaza(data);
    }    
    if (action === "CartaInvalida") {
        this.ui.sounds[1].play();
    }    
}

nuevaPartida(data) {
    var i;
    for (i = 0; i < 4; i++) {
        if (this.ui.jugadores[i].nombre === nombreJugador) {
            this.ui.jugadores[i].visible = true;
        } else {
            this.ui.jugadores[i].visible = false;
        }
    }
    document.getElementById("modalfin").style.display = "none";
    this.ui.init();
    this.ui.mazo.numCartas = 40;
    if (data.vuelta === true) { // vamos de vueltas
        document.getElementById("puntos").style.display = "block";
        this.ponerPuntos(data);
    } else {
        document.getElementById("puntos").style.display = "none";
    }
}

ponerPuntos(data) {
    var i;
    for (i = 0; i < 2; i++) {
        if (data.puntos[i] > 50) {
            data.puntos[i] = (data.puntos[i] - 50) + " buenas";
        } else {
            data.puntos[i] = data.puntos[i] + " malas";
        } 
    }
    var txt = data.parejas[0] + ": " + data.puntos[0] + "<br>" + data.parejas[1] + ": " + data.puntos[1];
    document.getElementById("puntos").innerHTML = txt;
}

cartaJugada(nombre , carta) {
    console.log('cartajugada' , nombre , carta);
    var indice = this.ui.indice(nombre);
    var jugador = this.ui.jugadores[indice];
    // quitar la carta y la zona
    var i;
    for (i = 0; i < jugador.cartas.length; i++) {
        if (jugador.cartas[i].getId() === carta.getId()) {
            this.ui.mueveJugadorBaza(nombre, carta, i);
            break;
        }
    }
    // poner luz en rojo
    this.ui.quitarTurno();
    if (this.nombreJugador === nombre) {
        this.turno = false;
    }
    this.cartaJugadaRespuesta();
    // Si ha jugado el jugador local deshabilitar botones de cante y cambio7
    if (nombre === this.nombreJugador) {
        document.getElementById("cambio7").disabled = true;
        document.getElementById("cante").disabled = true;
    }
    this.ui.dibujar();
}  

cartaJugadaRespuesta() {

}

bazaGanada(nombre) {
    this.ui.baza.ganador = nombre;
    this.ui.dibujar();
    this.ui.baza.ganador = '';
}

haCantado(data) {
    var imagen;
    if (data.valor === 40) {
        imagen  = this.ui.baraja.cuarenta; 
    } else {
        if (data.palo == '') {
            imagen  = this.ui.baraja.veinte; 
        } else {
            imagen = this.ui.baraja.cantes[data.indexPalo];
        }
    }
    imagen.style.position = "absolute";
    var indice = this.ui.indice(data.jugador);
    var punto = this.ui.jugadores[indice].posicionarCante(data.secuencia);
    imagen.style.left = punto.x + "px";
    imagen.style.top =  punto.y + "px";
    document.getElementById("divimage").appendChild(imagen);
    document.getElementById("modalcante").style.display = "block";
    this.ui.jugadores[indice].paloCantes.push(data.indexPalo);
    if (data.jugador === nombreJugador) {
        document.getElementById("cante").disabled = true;
    }
    if (data.valor === 40) {
        this.ui.jugadores[indice].paloCantes.push(data.indexPalo);
    }
    this.ui.dibujar();
    setTimeout(function() {
        document.getElementById("modalcante").style.display = "none";
        document.getElementById("divimage").removeChild(imagen);
    } , 3000);
}

haCambiado7(nombre , cartaTriunfo) {
    var indice = this.ui.indice(nombre);
    var jugador = this.ui.jugadores[indice];
    var i;
    for (i = 0; i < jugador.cartas.length; i++) {
        if (jugador.cartas[i].valor === 6 && jugador.cartas[i].palo === this.ui.mazo.triunfo.palo) {
            var c = jugador.cartas[i];
            var indiceCarta = i;
            break;
        } 
    }
    if (c != null) {
        document.getElementById("cambio7").disabled = true;
        this.ui.mueveCambio7(nombre, c, indiceCarta, cartaTriunfo);
    }
}

dialogoFinPartida() {
    var i;
    for (i = 0; i < 2; i++) {
        if (this.partidaTerminada.puntos[i] > 50) {
            this.partidaTerminada.puntos[i] = (this.partidaTerminada.puntos[i] - 50) + " buenas";
        } else {
            this.partidaTerminada.puntos[i] = this.partidaTerminada.puntos[i] + " malas";
        } 
    }
    if (this.partidaTerminada.hayVuelta) {
        document.getElementById("linea1").innerHTML  = this.partidaTerminada.parejas[0] + ": " + this.partidaTerminada.puntos[0];
        document.getElementById("linea2").innerHTML  = this.partidaTerminada.parejas[1] + ": " + this.partidaTerminada.puntos[1];
        document.getElementById("linea3").innerHTML  = "Hay partida de vuelta" ;
    } else {
        if (this.partidaTerminada.finCoto) {
            document.getElementById("linea1").innerHTML  = this.partidaTerminada.ganadores + " han ganado la partida y el coto. Marcador final:";
            conectado= false;
        } else {
            document.getElementById("linea1").innerHTML  = this.partidaTerminada.ganadores + " han ganado la partida. El marcador está así:" ;
        }
        document.getElementById("linea2").innerHTML  = this.partidaTerminada.parejas[0] + 
                " (" + this.partidaTerminada.puntos[0] + "): " + this.partidaTerminada.marcador[0];
        document.getElementById("linea3").innerHTML  = this.partidaTerminada.parejas[1] + 
        " (" + this.partidaTerminada.puntos[1] + "): " + this.partidaTerminada.marcador[1];
    }
    if (this.ui.jugadores[0].cartas.length > 0) {
        for (i = 0; i < 4 ; i++) {
            this.ui.jugadores[i].visible = true;
        }
        this.ui.dibujar();
    }
    document.getElementById("modalfin").style.display = "block"; // abrimos el diálogo fin partida
}

esFinCoto() {
    if (this.partidaTerminada.finCoto) {
        return true;
    }
    return false;
}

procesaSnapshot(data) {
    console.log('procesando snapshot');
    var xnombres = data.nombres;
    var xcartas = data.cartas;
    var xbaza = data.baza;
    var xmazo = data.mazo;
    var xturno = data.turno;
    var xganadas = data.ganadas;
    var xcantes = data.cantes; 
    var xpuntos = data.puntos;

    var i, j;
    // el mazo
    this.ui.mazo.triunfo = new Carta(xmazo.triunfo);
    this.ui.mazo.numCartas = xmazo.numCartas;
    // las cartas de los jugadores y sus cantes
    for (i = 0; i < xnombres.length; i++) {
        var indice = this.ui.indice(xnombres[i]);
        this.ui.jugadores[indice].turno = false;
        var xcartasNuevas = [];
        xcartas[i].forEach(id => {
            xcartasNuevas.push(new Carta(id));
        })
        this.cartasJugador(indice , xcartasNuevas);        
/*        this.ui.jugadores[indice].cartas = [];  
        xcartas[i].forEach( id => {
            this.ui.jugadores[indice].cartas.push(new Carta(id));
        })*/
        this.ui.jugadores[indice].paloCantes = [];
        for (j = 0 ; j < 4 ; j++) {
            var paloCante = xcantes[i][j];    
            if (paloCante != 0) {
                if (this.ui.mazo.triunfo.palo === j) { // Cante 40
                    this.ui.jugadores[indice].paloCantes.push(j);
                    this.ui.jugadores[indice].paloCantes.push(j);
                } else {
                    if (paloCante === 1) {
                        this.ui.jugadores[indice].paloCantes.push(j); // Cante 20 visto
                    } else {
                        this.ui.jugadores[indice].paloCantes.push(-1); // Cante 20 oculto
                    }
                }
            }
        }
    }
    // la baza
    this.ui.baza.cartas = [];
    xbaza.cartas.forEach(id => {
        this.ui.baza.cartas.push(new Carta(id));
    });
    this.ui.baza.nombres = xbaza.nombres;
    // las cartas ganadas
    this.ui.ganadas.init();
    this.ui.ganadas.addCartas(xganadas[0].nombre, xganadas[0].numCartas);
    this.ui.ganadas.addCartas(xganadas[1].nombre, xganadas[1].numCartas);
    // el turno
    if (xturno != null) {
        if (xturno === nombreJugador) {
            this.turno = true;
        }
        var index = this.ui.indice(xturno);
        this.ui.ponerTurno(this.ui.jugadores[index]);
    } else {
        this.ui.quitarTurno(); // Nadie tiene el turno
    }
//    this.ui.jugadores[index].ponerTurno();
    if (xpuntos.vueltas === true) { // vamos de vueltas
        document.getElementById("puntos").style.display = "block";
        this.ponerPuntos(xpuntos);
    } else {
        document.getElementById("puntos").style.display = "none";
    }
    console.log("Snapshot cargado");

    this.ui.dibujar();
}

cartasJugador(indice , cartasNuevas) {
    var i;
    var cartasJugador = this.ui.jugadores[indice].cartas;
    for (i = cartasJugador.length - 1 ; i >= 0; i--) {
        if (this.cartaEsta(cartasJugador[i] , cartasNuevas) === -1) {// Si la carta no esta en las nuevas la quitamos
            cartasJugador.splice(i,1);
        }
    }
    for (i = 0 ; i < cartasNuevas.length ; i++) {
        if (this.cartaEsta(cartasNuevas[i], cartasJugador) === -1) {// Si la carta no esta en las del jugador la añadimos al final
            cartasJugador.push(cartasNuevas[i]);
        }
    }  
    this.ui.jugadores[indice].cartas = cartasJugador;
}

cartaEsta(carta , cartas) {
    var i;
    for (i = 0; i < cartas.length; i++) {
        if (cartas[i].id === carta.id) {
            return i;
        }
    }
    return -1;
}
revisionBaza(data) {
    var ultimaBaza = data.ultimaBaza;
    var nombre = data.nombre;
    var i, imagen = [];
    var indicePareja = this.indicePareja(nombre);
    var punto = this.ui.ganadas.obtenerPunto(indicePareja);
    punto.x = Math.floor(punto.x * this.ui.canvas.escala()) - 100; 
    punto.y = Math.floor(punto.y * this.ui.canvas.escala()); 
    for (i = 0; i < 4; i++) {
        imagen[i] = this.ui.baraja.imagenes[ultimaBaza[i]];
        imagen[i].style.position = "absolute";
        imagen[i].style.left = punto.x + "px";
        imagen[i].style.top =  punto.y + "px";
        imagen[i].style.width =  Math.floor(this.ui.baraja.ancho() * this.ui.canvas.escala()) + "px";
        imagen[i].style.height =  Math.floor(this.ui.baraja.alto() * this.ui.canvas.escala()) + "px";
        document.getElementById("divimage").appendChild(imagen[i]);
        punto.x += 50;
    }
    document.getElementById("modalcante").style.display = "block";
    setTimeout(function() {
        document.getElementById("modalcante").style.display = "none";
        var i;
        for (i = 0; i < 4; i++) {
            document.getElementById("divimage").removeChild(imagen[i]);
        }
    } , 3000);
}

indicePareja(nombre) {
    if (this.parejas[0][0] === nombre || this.parejas[0][1] === nombre) {
        return 0;
    }
    if (this.parejas[1][0] === nombre || this.parejas[1][1] === nombre) {
        return 1;
    }
    return -1;
}
}