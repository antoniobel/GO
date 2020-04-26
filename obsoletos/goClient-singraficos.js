/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
/* global Colyseus */
"use strict";

var room;
var misCartas = [];
var nombreJugador;
var turno = false;
var parejas = [];
var tuPareja;
            
function mostrar(msg) {
    var p = document.createElement("p");
    p.innerText = msg;
    document.querySelector("#messages").appendChild(p);    
}

function conectar() {
    var host = window.document.location.host.replace(/:.*/, '');
    var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));
    nombreJugador = document.getElementById("name").value; 
    client.joinOrCreate("go_room" , { nombre: nombreJugador}).then(room_instance => {
    room = room_instance; // para poder manejarla fuera del then
                
        room.onMessage(function(message) {
            console.log(message);
            if ('action' in message) {
                procesaAction(message.action, message.data);
            }
            if ('message' in message) {
                mostrar(message.message);
            }
        });
                
        room.state.players.onAdd = function (player, sessionId) {
            mostrar("Se ha conectado: " + player.nombre);
        };
                    
        room.state.players.onChange = function(player , key) {
            console.log("recibo onChange para: " + player.nombre);
        };                    
    });                
}
            
function comenzar() {
    room.send({ action: "ComienzaPartida" });
    quitarCartas();
}
            
function procesaAction(action, data) {
    if (action === "ComienzaPartida") {
        mostrar("Comienza la partida");
        quitarCartas();
        return;
    }
    if (action === "Dar3Cartas") {
        Dar3Cartas(data);
    };
    if (action === "Dar1Carta") {
        carta = new Carta(data);
        Dar1Carta(carta);
    };

    if (action === "Parejas") {
        ponerParejas(data);
    };
    if (action === "Triunfo") {
        var carta = new Carta(data);
        document.getElementById("triunfo").innerHTML = "La carta de triunfo es: " + carta.toString();
    }
    if (action === "Ronda") {
        document.getElementById("ronda").innerHTML = "Ronda: " + data;
        var mesa = document.getElementById("mesa").innerHTML;
        mostrar(mesa);
        document.getElementById("mesa").innerHTML = "Cartas en la mesa: ";
    }
    if (action === "Turno") {
        document.getElementById("turno").innerHTML = "Turno de juego de: " + data;
        mostrar("Es el turno de juego de " + data);
    }
    if (action === "Juega") {
        turno = true;
        mostrar("Te toca jugar");
    }
    if (action === "CartaJugada") {
        var carta = new Carta(data.carta);
        cartaJugada(data.jugador , carta);
    }
    if (action === "BazaGanada") {
        mostrar("El jugador " + data + " ha ganado la baza ");
        document.getElementById("anterior").innerHTML = "Ronda anterior ganada por: " + data;
    }
    if (action === "RecogeCartas") {
        mostrar("El jugador " + data + " recoge las cartas ");
    }
    if (action === "PartidaTerminada") {
        mostrar("La partida ha terminado.");
        mostrar("Puntos de " + parejas[0][0] + " y " + parejas[0][1] + ": " + data[0]);
        mostrar("Puntos de " + parejas[1][0] + " y " + parejas[1][1] + ": " + data[1]);
    }
    if (action === "HayVuelta") {
        mostrar("Hay partida de vuelta.");
    }
    if (action === "GanadorPartida") {
        mostrar("Los ganadores son " + parejas[data][0] + " y " + parejas[data][1]);
        if (parejas[data][0] === nombreJugador || parejas[data][1] === nombreJugador) {
            mostrar("Hemos ganado, chaval. Somos los mejores");
        } else {
            mostrar("Hemos perdido, chaval");
        }
    }
    if (action === "CantesPendientes") {
        mostrar("Tienes cantes pendientes");
    }
    if (action === "HaCantado") {
        var texto = " El jugador " + data.jugador + " ha cantado " + data.valor + " en " + data.palo + ".";
        mostrar(texto);
        var txtEvento = document.getElementById("eventos").innerHTML + texto;
        document.getElementById("eventos").innerHTML = txtEvento;
    }
}

function ponerParejas(data) {
    parejas[0] = data[0];
    parejas[1] = data[1];
    var i;
    for (i = 0; i < 2; i++) {
        if (parejas[i][0] === nombreJugador) {
            tuPareja = parejas[i][1];
        }
        if (parejas[i][1] === nombreJugador) {
            tuPareja = parejas[i][0];
        }
    }
    document.getElementById("pareja").innerHTML = "Tu pareja es: " + tuPareja;
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
    mostrar("El jugador " + nombre + " ha jugado la carta " + carta.toString());
    var mesa = document.getElementById("mesa").innerHTML;
    mesa += carta.toString() + " (" + nombre + ")        ";
    document.getElementById("mesa").innerHTML = mesa;
    if (nombreJugador === nombre) {
        turno = false;
        quitarCarta(carta);
    }
}

function Dar3Cartas(data) {
    var carta, ele, i, txt = '';
    data.forEach(id => {
        carta = new Carta(id);
        for (i = 1; i <= 6; i++) {
            ele = "c" + i;
            if (document.getElementById(ele).firstChild.data === "---") {
                misCartas.push(carta);
                document.getElementById(ele).firstChild.data = carta.toString();
                txt += carta.toString() + " ";
                break;
            }
        }
    });  
    mostrar("Te han dado 3 cartas: " + txt);
}

function Dar1Carta(carta) {
    var i, ele;
    for (i = 1; i <= 6; i++) {
        ele = "c" + i;
        if (document.getElementById(ele).firstChild.data === "---") {
            document.getElementById(ele).firstChild.data = carta.toString();
            misCartas.push(carta);
            break;
        }
    }
    mostrar("Has tomado el " + carta.toString());
}

function quitarCarta(carta) {
    var i, ele;
    // quito la cartya de misCartas
    for (i = 0; i < 6; i++) {
        if (carta.id === misCartas[i].id) {
            misCartas.splice(i , 1);
            break;
        }
    }
    console.log(misCartas);
    // Reajusto los botones
    for (i = 1; i <= 6; i++) {
        ele = "c" + i;
        document.getElementById(ele).firstChild.data = "---";
        if (i <= misCartas.length) {
            document.getElementById(ele).firstChild.data =  misCartas[i-1].toString();
        }
    }

}

function quitarCartas() {
    var i, ele;
    for (i = 1; i <= 6; i++) {
        ele = "c" + i;
        document.getElementById(ele).firstChild.data = "---";
    }
}

function cantar() {
    room.send({ action: "Canto" , data: ''});
}

function ordenar() {
    misCartas.sort((a,b) => {
        if (a == null || b == null) return 0;
        return a.id - b.id;
    });
    console.log(misCartas);
    quitarCartas();
    var i , ele;
    for (i = 1; i <= 6; i++) {
        ele = "c" + i;
        document.getElementById(ele).firstChild.data = misCartas[i-1].toString();
    };  
}