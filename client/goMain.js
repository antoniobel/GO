/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

/*
 * Variables globales
 */
var room;
var manejador; // gestor de los mensajes. Distinto para jugadores y publico. 
var nombreJugador; // Nombre del jugador declarado en el diálogo inicial.
var usuariosConectados = []; // Todos los usuarios conectados. Debe coincidir con la lista que se ve en jugadores.


/* Programa principal */
var ui = new UI();
var movimiento = true;
setInterval(ui.parpadeo , 600);    // Arranco el timer. Un solo timer para todas las partidas
var conectado = false;
shortcut.add("Ctrl+X",function() {
	requestSnapshot();
});
shortcut.add("Ctrl+A",function() {
    if (movimiento) {
        movimiento = false;
    } else {
        movimiento = true;
    }
});
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
    console.log("Posicionar botones");
    var botonCante = document.getElementById("cante");
    botonCante.style.position = "absolute";
    botonCante.style.left = Math.floor(window.innerWidth - 110) + "px";
    botonCante.style.top =  Math.floor(window.innerHeight - 70) + "px";
    var botoncambio7 = document.getElementById("cambio7");
    botoncambio7.style.position = "absolute";
    botoncambio7.style.left = Math.floor(window.innerWidth - 110) + "px";
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
    ordenar.style.left = Math.floor(window.innerWidth - 210) + "px";
    ordenar.style.top =  Math.floor(window.innerHeight - 70) + "px";
    ordenar.style.display = "none";

    var puntos = document.getElementById("puntos");
    puntos.style.position = "absolute";
    puntos.style.left = "10px";
    puntos.style.top =  "10px";   
    puntos.style.display = "none";
    console.log("Fin Posicionar botones");
}

function mostrarBotones() {
    document.getElementById("cante").style.display = "block"; 
    document.getElementById("cambio7").style.display = "block";
    document.getElementById("salir").style.display = "block";
    document.getElementById("ordenar").style.display = "block";
}

function abrirDialogoInicio() {
    vaciaPareja(document.getElementById("pareja1"));
    vaciaPareja(document.getElementById("pareja2"));
    document.getElementById("myModal").style.display = "block"; // abrimos el diálogo
    document.getElementById("name").focus(); 
    document.getElementById("comenzar").disabled = true;
}

/**
 * Copia todos los elementos de una select de pareja a la select de jugadores
 */
function vaciaPareja(pareja) {
    var usuarios = document.getElementById("usuarios");
    var nombre, option;
    while (pareja.options.length > 0) {
        nombre = pareja.options[0].text;
        option = document.createElement("option");
        option.text = nombre;
        usuarios.add(option);
        pareja.options.remove(0);
    }
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
 * Elimina todas las entradas de una select
 */
function vaciaSelect(sel) {
    while (sel.options.length > 0) {
        sel.options.remove(0);
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
    if (conectado) return;
    nombreJugador = document.getElementById("name").value; 
    if (nombreJugador == '') return;
    var host = window.document.location.host.replace(/:.*/, '');
    var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));
    client.joinOrCreate("go_room" , { nombre: nombreJugador}).then(room_instance => {
        room = room_instance; // para poder manejarla fuera del then     
        conectado = true;              
        room.onMessage(function(message) {
            var d = new Date();
            console.log(d.getTime() , message);
            if ('ping' in message) {
                room.send({ping: 0});
                return;
            }
            room.send({echo: message}); // Funcion eco. Mantener para verificar el log en el servidor. 
            if ('code' in message) {
                if (message.code === 1) { // nombre repetido. hay que desconectarse.
                    nombreRepetido();
                }
            }
            if ('action' in message) {
                if (message.action === "Jugadores") {
                    jugadoresConectados(message.data);
                } else {
                    if (manejador !== undefined)  
                        manejador.procesaAction(message.action, message.data);
                }
            }
            if ('conexiones' in message) {
                conexiones(message.conexiones);
            }
        });            
    }).catch(e => {
        console.error("Se ha recibido un error", e);
      });;  
}

/**
 * Cuando el usuario pulsa el botón desconectar.
 */
function desconectar() {
    room.leave();
    document.getElementById("myModal").style.display = "none";
}

/**
 * Accion enviada por el servidor con los jugadores. Los que no están en la lista son espectadores.
 * Se crea el manejador correspondiente. Si el usuario local está en la lista de jugadores se crea un 
 * manejador de jugador. Si no lo está se crea un manejador de público.
 * data es un array con los nombres de los jugadores.
 */
function jugadoresConectados(data) {
    var i;
    for (i = 0; i < data.length; i++) {
        if (data[i] === nombreJugador) {
            manejador = new GoJugador(nombreJugador, room, ui); // el usuario es un jugador
            return;
        } 
    }
    manejador = new GoPublico(nombreJugador, room, ui); // el usuario es un espectador
}

/**
 * Se ejecuta cuando llega un mensaje 'conexiones'. Se vacian todos los selectores y se ponen todos
 * los usuarios conectados en el selector de usuarios.
 * El parámetro es un array de todos los usuarios conectados
 */
function conexiones(conexiones) {
    usuariosConectados = conexiones;
    var option;
    vaciaSelect(document.getElementById("usuarios"));
    vaciaSelect(document.getElementById("pareja1"));
    vaciaSelect(document.getElementById("pareja2"));
    usuariosConectados.forEach(user => {
        option = document.createElement("option");
        option.text = user.nombre;
        document.getElementById("usuarios").add(option);    
    })
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
    manejador.canvasClicked(e);
}

function cantar() {
    manejador.cantar();
}

function cambio7() {
    manejador.cambio7();
}

function ordenar(event) {
    manejador.ordenar(event);
}

function salir() {
    document.getElementById("msgsino").innerHTML =  manejador.mensajeSalir();
    document.getElementById("modalsino").style.display = "block";
}

function botonsi() {
    if (manejador.cancelarPartida()) {
        manejador = undefined; // Anulamos el manejador para que no lleguen mensajes. (Solo para espectadores)
    };
}

function botonno() {
    document.getElementById("modalsino").style.display = "none";
}

/**
 * Cierre del diálogo de fin de partida
 */
function close2() {
    document.getElementById("modalfin").style.display = "none"; // cerramos el diálogo fin partida
    if (manejador.partidaTerminada.finCoto) { // Al final del coto el servidor desconecta a todos. Limpiamos selects y empezamos.
        vaciaSelect(document.getElementById("usuarios"));
        vaciaSelect(document.getElementById("pareja1"));
        vaciaSelect(document.getElementById("pareja2"));
        abrirDialogoInicio();
    }
}

/**
 * Cierre del diálogo de inicio
 */
function close1() {
    document.getElementById("myModal").style.display = "none"; // cerramos el diálogo de inicio
}

/**
 * Se ha introudcido un nombre igual al de otro usuario ya conectado. Se da un aviso de nombre repetido y se limpian
 * los selectores
 */
function nombreRepetido() {
    console.log("Nombre repetido. Me desconeto");
    conectado = false;
    var texto = " Nombre de jugador repetido. Usa otro nombre";
    document.getElementById("msg").innerHTML = texto;
    document.getElementById("modalmsg").style.display = "block";
    setTimeout(function() {
        document.getElementById("modalmsg").style.display = "none";
        vaciaSelect(document.getElementById("usuarios"));
        vaciaSelect(document.getElementById("pareja1"));
        vaciaSelect(document.getElementById("pareja2"));
        } , 2000);                                
    room.leave();
}

function requestSnapshot() {
    room.send({ action: "Snapshot" , data: nombreJugador});
}
