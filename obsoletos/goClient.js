/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";
/*
 * Variables globales
 */
var ui;
var nombreJugador;
var room;
var parejas = [];
var ronda;
var turno;
/**
 * partidaTerminada: Recoge datos de los eventos relacionados con el final de la partida. Elementos:
 * parejas [] => 2 elemento. nombres de las parejas tal como los manda el servidor
 * puntos [] =>  2 elementos. puntos de cada pareja. congruente con parejas
 * hayVuelta => true si va a haber partida de vuelta
 * ganadores => pareja ganadora (nombres)
 * marcador [] => dos elementos. partidas ganadas por cada pareja, compatible con parejas []
 * finCoto => true si hemos terminado el coto
 */
var partidaTerminada = {};


/* Programa principal */
ui = new UI(); // Prepara el entorno gráfico.
posicionarBotones();

abrirDialogoInicio();

var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
    document.getElementById("myModal").style.display = "none";
}

var stage= document.getElementById('canvas');
stage.addEventListener('click', canvasClicked, false);

/* Funciones */
/**
 * Coloca los botones en su posición y los deja como ocultos
 */
function posicionarBotones() {
    var botonCante = document.getElementById("cante");
    botonCante.style.position = "absolute";
    var x = Math.floor(window.innerWidth - 150);
    var y = Math.floor(window.innerHeight - 70);
    botonCante.style.left = Math.floor(window.innerWidth - 150) + "px";
    botonCante.style.top =  Math.floor(window.innerHeight - 70) + "px";
    var botoncambio7 = document.getElementById("cambio7");
    botoncambio7.style.position = "absolute";
    botoncambio7.style.left = Math.floor(window.innerWidth - 150) + "px";
    botoncambio7.style.top =  Math.floor(window.innerHeight - 120) + "px";
    var salir = document.getElementById("salir");
    salir.style.position = "absolute";
    salir.style.left = Math.floor(window.innerWidth - 150) + "px";
    salir.style.top =  Math.floor(30) + "px";     
    botonCante.style.display = "none"; 
    botoncambio7.style.display = "none";
    salir.style.display = "none";

    var ordenar = document.getElementById("ordenar");
    ordenar.style.position = "absolute";
    ordenar.style.left = Math.floor(window.innerWidth - 240) + "px";
    ordenar.style.top =  Math.floor(window.innerHeight - 70) + "px";
    ordenar.style.display = "none";

    var puntos = document.getElementById("puntos");
    puntos.style.position = "absolute";
    puntos.style.left = "10px";
    puntos.style.top =  "10px";   
    puntos.style.display = "none";
}

function mostrarBotones() {
    document.getElementById("cante").style.display = "block"; 
    document.getElementById("cambio7").style.display = "block";
    document.getElementById("salir").style.display = "block";
    document.getElementById("ordenar").style.display = "block";
}

function abrirDialogoInicio() {
    document.getElementById("myModal").style.display = "block"; // abrimos el diálogo
    document.getElementById("comenzar").disabled = true;
}

/**
 * Evento onclick lista usuarios. Mueve los jugadores a alguna de las listas de parejas, si no están completas.
 * Cuando las dos parejas están completas, habilita el botón comenzar
 */
function incluir() {
    var usuarios = document.getElementById("usuarios");
    var pareja1 = document.getElementById("pareja1");
    var pareja2 = document.getElementById("pareja2");
    var user = usuarios.value;
    if (user != '') {
        var index = usuarios.selectedIndex;
        var option = document.createElement("option");
        option.text = user;        
        if (pareja1.length < 2) {
            pareja1.add(option);
            usuarios.remove(index);
        } else {
            if (pareja2.length < 2) {
                pareja2.add(option);
                usuarios.remove(index);
            }
        } 
    }
    if (pareja1.length === 2 && pareja2.length === 2) {
        console.log("Habilito - incluir");
        document.getElementById("comenzar").disabled = false;
    } else {
        document.getElementById("comenzar").disabled = true;
    }
}

/**
 * Quita el elemento seleccionado de la lista de parejas donde se ha pulsado y lo pasa a la lista de jugadores.
 */
function excluir(selector) {
    var pareja = document.getElementById(selector);
    var user = pareja.value;
    var index = pareja.selectedIndex;
    var usuarios = document.getElementById("usuarios");
    var option = document.createElement("option");
    option.text = user;
    usuarios.add(option);
    pareja.remove(index);
    if (pareja1.length === 2 && pareja2.length === 2) {
        console.log("Habilito - excluir");
        document.getElementById("comenzar").disabled = false;
    } else {
        document.getElementById("comenzar").disabled = true;
    }
}

/**
 * Conecta con el servidor, identificándose con nombreJugador. Recibe una instancia de room
 * Invocado al pulsar el botón conectar
 */
function conectar() {
    nombreJugador = document.getElementById("name").value; 
    if (nombreJugador == '') return;
    var host = window.document.location.host.replace(/:.*/, '');
    var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));
    client.joinOrCreate("go_room" , { nombre: nombreJugador}).then(room_instance => {
        room = room_instance; // para poder manejarla fuera del then                   
        room.onMessage(function(message) {
            console.log(message);
            if ('action' in message) {
                procesaAction(message.action, message.data);
            }
/*            if ('message' in message) {
                mostrar(message.message);
            } */
        });            
        room.state.players.onAdd = function (player, sessionId) {
            console.log("Recibo: " + player.nombre);
            jugadorConectado(player.nombre);
        };                
        room.state.players.onChange = function(player , key) {
            console.log("recibo onChange para: " + player.nombre);
        };                    
    });  
}

/**
 * Invocado cuando se pulsa el botón comenzar partida. Lanza al servidor el mensaje ComenzarPartida con los jugadores 
 * que participan. Ojo como se envian los jugadores: jugador 1 pareja 1, jugador 1 pareja 2, jugador 2 pareja 1 y 
 * jugador 2 pareja 2. Esto se convertirá directamente en el array de jugadores que mantiene el servidor. 
 */
function comenzar() {
    var pareja1 = document.getElementById("pareja1");
    var pareja2 = document.getElementById("pareja2");
    if (pareja1.length < 2 || pareja2.length < 2)  {
        return;
    }    
    var jugadores = [];
    jugadores.push(pareja1.options[0].label);
    jugadores.push(pareja2.options[0].label);
    jugadores.push(pareja1.options[1].label);
    jugadores.push(pareja2.options[1].label);
    room.send({ action: "ComienzaPartida" , datos: jugadores });
}

function canvasClicked(e) {
    if (turno) {
        var miclick = ui.click(e.x , e.y);
        console.log("Se ha pulsado " + miclick.carta);
        room.send({ action: "EchoCarta" , data: {jugador: nombreJugador , carta: miclick.carta.getId() }});
    }
}

function cantar() {
    room.send({ action: "Canto" , data: nombreJugador});
}

function cambio7() {
    room.send({ action: "Cambio7" , data: nombreJugador});
}

function ordenar(event) {
    var index = ui.indice(nombreJugador);
    var jugador = ui.jugadores[index];
    if (jugador.cartas.length === 0) return;
    jugador.ordenar();
    if (ui.mazo.triunfo == null) return;
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
    ui.dibujar();
}

/**
 * Invocado cuando se recibe un mensaje de conexión de un jugador (player.onAdd)
 * Lo incluye en la lista de jugadores.
 */
function jugadorConectado(nombre) {
    var option = document.createElement("option");
    option.text = nombre;
    document.getElementById("usuarios").add(option);
}

/**
 * Procesador de todas las acciones. Invocado desde el metodo room.onMessage. Llama a las funciones 
 * que ejecutan las acciones.
 * @param {*} action 
 * @param {*} data 
 */
function procesaAction(action, data) {
    if (action === "ComienzaPartida") {
        document.getElementById("myModal").style.display = "none";
        document.getElementById("modalfin").style.display = "none";
        document.getElementById("ordenar").disabled = false;
        ui.canvas.fullScreen();
        mostrarBotones();
        ui.init();
        return;
    }
    if (action === "NuevaPartida") {
        nuevaPartida(data);
    }
    if (action === "Parejas") {
        ponerParejas(data);
    };
    if (action === "Dar3Cartas") {
        Dar3Cartas(data);
    };
    if (action === "Dar1Carta") {
        carta = new Carta(data.carta);
        Dar1Carta(data.jugador , carta);
    };    
    if (action === "Triunfo") {
        var carta = new Carta(data);
        ui.mazo.triunfo = carta;
        ui.mazo.numCartas = 16;
        ui.dibujar();
    }
    if (action === "Ronda") {
        ui.baza.cartas = [];
        ui.baza.nombres = [];
        ronda = data;
        document.getElementById("cante").disabled = true;
        document.getElementById("cambio7").disabled = true;
    }
    if (action === "Turno") {
        var index = ui.indice(data);
        ui.jugadores[index].ponerTurno();
    }
    if (action === "Juega") {
        turno = true;
    }
    if (action === "CartaJugada") {
        var carta = new Carta(data.carta);
        cartaJugada(data.jugador , carta);
    }
    if (action === "BazaGanada") {
        bazaGanada(data);
    }
    if (action === "Puntos") {
        ponerPuntos(data);
    }
    if (action === "RecogeCartas") {
        recogeCartas(data);
    }
    if (action === "PartidaTerminada") {
        partidaTerminada.parejas = data.parejas;
        partidaTerminada.puntos = data.puntos;
        partidaTerminada.hayVuelta = false;
        partidaTerminada.ganadores = '';
        partidaTerminada.marcador = [];
        partidaTerminada.finCoto = false;
    }
    if (action === "HayVuelta") {
        partidaTerminada.hayVuelta = true;
        dialogoFinPartida();
    }
    if (action === "GanadorPartida") {
        partidaTerminada.ganadores = data;
    } 
    if (action === "Marcador") {
        partidaTerminada.marcador = data.marcador;
        partidaTerminada.finCoto = data.finCoto;
        dialogoFinPartida();
    }
    if (action === "PuedesCantar") {
        document.getElementById("cante").disabled = false;
    }
    if (action === "HaCantado") {
        haCantado(data);
    }
    if (action === "Cambio7Posible") {
        document.getElementById("cambio7").disabled = false;
    }
    if (action === "HaCambiado7") {
        haCambiado7(data);
    }
}

function nuevaPartida(data) {
    document.getElementById("modalfin").style.display = "none";
    ui.init();
    if (data.vuelta === true) { // vamos de vueltas
        document.getElementById("puntos").style.display = "block";
        ponerPuntos(data);
    } else {
        document.getElementById("puntos").style.display = "none";
    }
}

function ponerPuntos(data) {
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

function ponerParejas(data) {
    parejas[0] = data[0][0] + data[0][1];
    parejas[1] = data[1][0] + data[1][1];
    // El jugador local debe ser siempre la pareja 0. Si esta en la 1, invertimos
    if (parejas[1].indexOf(nombreJugador) >= 0) {
        var p = parejas[0];
        parejas[0] = parejas[1];
        parejas[1] = p;
    }
    ui.ganadas.parejas.push(parejas[0]);
    ui.ganadas.parejas.push(parejas[1]);
    var x = [];
    x.push(data[0][0]);
    x.push(data[1][0]);
    x.push(data[0][1]);
    x.push(data[1][1]);
    var i, index;
    for (i = 0; i < 4; i++) {
        if (x[i] === nombreJugador) {
            index = i;
            break;
        }
    }
    var jugador = ui.crearJugador(x[index] , "abajo"); // jugador local siempre abajo
    console.log(x[index] , "abajo");
    jugador.visible = true;
    index < 3 ? index++ : index = 0;
    ui.crearJugador(x[index] , "derecha"); 
    console.log(x[index] , "derecha");
    index < 3 ? index++ : index = 0;
    ui.crearJugador(x[index] , "arriba"); 
    console.log(x[index] , "arriba");
    index < 3 ? index++ : index = 0;
    ui.crearJugador(x[index] , "izquierda"); 
    console.log(x[index] , "izquierda");
}

function Dar3Cartas(data) {
    var carta, ele, i, txt = '';
    var nombre = data.jugador;
    var cartas = data.cartas;
    var index = ui.indice(nombre);
    cartas.forEach(id => {
        carta = new Carta(id);
        ui.jugadores[index].cartas.push(carta);
    });  
    ui.dibujar();
}

function Dar1Carta(nombre , carta) {
    var indice = ui.indice(nombre);
    ui.jugadores[indice].cartas.push(carta);
    ui.mazo.numCartas -= 1;
    ui.dibujar();
}

function juegaCarta(index) {
    console.log("Se ha pulsado " + index);
    if (turno) {
        room.send({ action: "EchoCarta" , data: {jugador: nombreJugador , carta: misCartas[index-1].getId() }});
    } else {
        mostrar("No es tu turno. No te impacientes");
    }
}

function cartaJugada(nombre , carta) {
    var indice = ui.indice(nombre);
    var jugador = ui.jugadores[indice];
    // quitar la carta y la zona
    var i;
    for (i = 0; i < jugador.cartas.length; i++) {
        if (jugador.cartas[i].getId() === carta.getId()) {
            jugador.cartas.splice(i,1);
            jugador.zonas.splice(i,1);
            break;
        }
    }
    // poner luz en rojo
    jugador.quitarTurno();
    // poner carta en la baza
    ui.baza.cartas.push(carta);
    ui.baza.nombres.push(nombre);
    if (nombreJugador === nombre) {
        turno = false;
    }
    ui.dibujar();
}

function bazaGanada(nombre) {
    ui.baza.ganador = nombre;
    ui.dibujar();
    ui.baza.ganador = '';
}

function recogeCartas(nombre) {
    console.log("Recogiendo cartas");
    ui.ganadas.addCartas(nombre , 4);
    ui.baza.cartas = [];
    ui.baza.nombres = [];
    ui.dibujar();
}

function haCantado(data) {
    var texto;
    if (data.palo != '') {
        texto = " El jugador " + data.jugador + " ha cantado " + data.valor + " en " + data.palo + ".";
    } else {
        texto = " El jugador " + data.jugador + " ha cantado " + data.valor + ".";
    }
    var indice = ui.indice(data.jugador);
    ui.jugadores[indice].paloCantes.push(data.indexPalo);
    if (data.valor === 40) {
        ui.jugadores[indice].paloCantes.push(data.indexPalo);
    }
    document.getElementById("msg").innerHTML = texto;
    document.getElementById("modalmsg").style.display = "block";
    if (data.jugador === nombreJugador) {
        document.getElementById("cante").disabled = true;
    }
    ui.dibujar();
    setTimeout(function() {
        document.getElementById("modalmsg").style.display = "none";
    } , 3000);
}

function haCambiado7(nombre) {
    var indice = ui.indice(nombre);
    var jugador = ui.jugadores[indice];
    var carta = jugador.cambia7(ui.mazo.triunfo);
    ui.mazo.triunfo = carta;
    ui.dibujar();

    var texto = " El jugador " + nombre + " ha cambiado el 7.";
    document.getElementById("msg").innerHTML = texto;
    document.getElementById("modalmsg").style.display = "block";
    document.getElementById("cambio7").disabled = true;
    setTimeout(function() {
        document.getElementById("modalmsg").style.display = "none";
    } , 3000);
}
function dialogoFinPartida() {
    console.log("dialogo fin de partida");
    if (partidaTerminada.hayVuelta) {
        var i;
        for (i = 0; i < 2; i++) {
            if (partidaTerminada.puntos[i] > 50) {
                partidaTerminada.puntos[i] = (partidaTerminada.puntos[i] - 50) + " buenas";
            } else {
                partidaTerminada.puntos[i] = partidaTerminada.puntos[i] + " malas";
            } 
        }
        document.getElementById("linea1").innerHTML  = partidaTerminada.parejas[0] + ": " + partidaTerminada.puntos[0];
        document.getElementById("linea2").innerHTML  = partidaTerminada.parejas[1] + ": " + partidaTerminada.puntos[1];
        document.getElementById("linea3").innerHTML  = "Hay partida de vuelta" ;
    } else {
        if (partidaTerminada.finCoto) {
            document.getElementById("linea1").innerHTML  = partidaTerminada.ganadores + " han ganado la partida y el coto. Marcador final:";
        } else {
            document.getElementById("linea1").innerHTML  = partidaTerminada.ganadores + " han ganado la partida. El marcador está así:" ;
        }
        document.getElementById("linea2").innerHTML  = partidaTerminada.parejas[0] + ": " + partidaTerminada.marcador[0];
        document.getElementById("linea3").innerHTML  = partidaTerminada.parejas[1] + ": " + partidaTerminada.marcador[1];
    }
    console.log("Voy a abrir dialog");
    document.getElementById("modalfin").style.display = "block"; // abrimos el diálogo fin partida
    console.log("dialogo abierto");
}

function close2() {
    document.getElementById("modalfin").style.display = "none"; // cerramos el diálogo fin partida
    if (partidaTerminada.finCoto) {
        abrirDialogoInicio();
    }
}

function close1() {
    document.getElementById("myModal").style.display = "none"; // cerramos el diálogo de inicio
}

