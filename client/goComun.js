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
        console.log("Voy a fullScreen");
        this.ui.canvas.fullScreen();
        console.log("Voy a crear botones");
        mostrarBotones();
        console.log("Voy a init");
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
        this.ui.jugadores[index].ponerTurno();
    }
    if (action === "Juega") {
        this. turno = true;
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
        this.ui.jugadores.forEach(jugador => {
            jugador.quitarTurno();
        });
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
        this.haCambiado7(data.jugador , data.carta);
    }
    if (action === "PartidaCancelada") {
        this.ui.init();
        document.getElementById("msg").innerHTML =  "La partida ha sido cancelada por " + data;
        document.getElementById("modalmsg").style.display = "block"; // abrimos el diálogo
        setTimeout(function() {
            document.getElementById("modalmsg").style.display = "none"; 
            abrirDialogoInicio();
        } , 3000);
    }
    if (action === "NoCanteCambio") {
        document.getElementById("cambio7").disabled = true;
        document.getElementById("cante").disabled = true;    }
}

nuevaPartida(data) {
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
    var indice = this.ui.indice(nombre);
    var jugador = this.ui.jugadores[indice];
    // quitar la carta y la zona
    var i;
    console.log('cartajugada' , jugador , carta);
    for (i = 0; i < jugador.cartas.length; i++) {
        if (jugador.cartas[i].getId() === carta.getId()) {
            console.log("voy a mueve");
            this.ui.mueveJugadorBaza(nombre, carta, i);
            break;
        }
    }
    // poner luz en rojo
    jugador.quitarTurno();
    if (this.nombreJugador === nombre) {
        this.turno = false;
    }
    // Si ha jugado el jugador local deshabilitar botones de cante y cambio7
    if (nombre === this.nombreJugador) {
        document.getElementById("cambio7").disabled = true;
        document.getElementById("cante").disabled = true;
    }
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
    console.log("x " + punto.x + " y: " + punto.y);
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
        } else {
            document.getElementById("linea1").innerHTML  = this.partidaTerminada.ganadores + " han ganado la partida. El marcador está así:" ;
        }
        document.getElementById("linea2").innerHTML  = this.partidaTerminada.parejas[0] + 
                " (" + this.partidaTerminada.puntos[0] + "): " + this.partidaTerminada.marcador[0];
        document.getElementById("linea3").innerHTML  = this.partidaTerminada.parejas[1] + 
        " (" + this.partidaTerminada.puntos[1] + "): " + this.partidaTerminada.marcador[1];
    }
    document.getElementById("modalfin").style.display = "block"; // abrimos el diálogo fin partida
}

esFinCoto() {
    if (this.partidaTerminada.finCoto) {
        return true;
    }
    return false;
}
}