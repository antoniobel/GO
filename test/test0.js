const GoGame = require("../server/gogame.js").GoGame;
const Handler = require("../server/handler").Handler;
const Baraja = require("../server/gobase").Baraja;
const Jugador = require("../server/gobase").Jugador;
const Carta = require("../server/gobase").Carta;

//arrastre();
//arrastre2();
cantar();

function test0() {
    var game = new GoGame(null);
    game.jugadores = [];
    game.jugadores.push(new Jugador("a"));
    game.jugadores.push(new Jugador("b"));
    game.jugadores.push(new Jugador("c"));
    game.jugadores.push(new Jugador("d"));
    game.nuevaPartida();
    // ponemos el orden para poder probar
    game.orden = [];
    game.orden.push(0);
    var i;
    for (i = 1; i<4;i++) {
        game.orden[i] = (game.orden[i-1] < 3) ? game.orden[i-1]+1 : 0;
    }
    console.log("Orden " + game.orden);
    game.baraja = new Baraja(); // nueva baraja con las cartas en orden para probar
    game.jugadores.forEach(jugador => {  // quitamos las cartas de los jugadores
        jugador.cartas = [];
    });
    game.repartirCartas();
    console.log(game.jugadores);
    console.log(game.jugadores[0].cartas);
    game.cartaJugada("a" , new Carta(1));
    game.cartaJugada("b" , new Carta(15));
    game.cartaJugada("c" , new Carta(20));
    game.cartaJugada("d" , new Carta(11));
}

function test1() {
    var game = new GoGame(null);
    game.jugadores = [];
    game.jugadores.push(new Jugador("a"));
    game.jugadores.push(new Jugador("b"));
    game.jugadores.push(new Jugador("c"));
    game.jugadores.push(new Jugador("d"));
    game.cartasRecogidas = [];
    game.cartasRecogidas[0] = [];
    game.cartasRecogidas[1] = [];        
    game.orden = [];
    game.orden.push(2);
    var i;
    for (i = 1; i<4;i++) {
        game.orden[i] = (game.orden[i-1] < 3) ? game.orden[i-1]+1 : 0;
    }
    game.triunfo = new Carta(6);
    game.baza = [];
    game.baza.push(new Carta(34));
    game.baza.push(new Carta(31));
    game.baza.push(new Carta(21));
    game.baza.push(new Carta(30));
    var indiceGanador = game.calculaGanadorBaza();
    console.log(indiceGanador);
    if (indiceGanador != 1) {
        Console.log(`****** Error *****. el indiceGanador es ${indiceGanador} y debería ser 2`);
    }
/*    game.recogeCartas(indiceGanador);
    if (game.jugadores[2].recogeCartas != true) {
        Console.log(`****** Error *****. el jugador 2 no tiene el flag recogeCartas`);
    }
    if (game.cartasRecogidas[0].length != 4) {
        Console.log(`****** Error *****. Falla cartasRecogidas ${game.cartasRecogidas[0].length}`);
    }
    game.recalculaOrden();
    if (game.orden[0] != 2) {
        Console.log(`****** Error *****. falla recalcular orden. `);
        Console.log(game.orden);
    } */
}

function arrastre() {
    console.log("arrastre");
    // va del contrario. varios casos
    var game = new GoGame(null);
    game.jugadores = [];
    game.jugadores.push(new Jugador("a"));
    game.jugadores[0].cartas.push(new Carta(0)); // as de oros
    game.jugadores[0].cartas.push(new Carta(15)); // 6 de copas
    game.jugadores[0].cartas.push(new Carta(22)); // tres de espadas
    game.jugadores[0].cartas.push(new Carta(1)); // dos de oros
    game.jugadores[0].cartas.push(new Carta(34)); // 5 de bastos
    game.jugadores[0].cartas.push(new Carta(17)); // sota de copas
    game.triunfo = new Carta(33); // 4 de bastos
    game.baza = [];
    game.baza.push(new Carta(6)) ; // 7 de oros
    game.orden = [];
    game.orden.push(3);
    game.orden.push(0);
    game.orden.push(1);
    game.orden.push(2);
    game.ronda = 5;
    var carta = new Carta(1);
    console.log("debe ser false " + game.cartaValida(carta , 0));
    carta = new Carta(0);
    console.log("debe ser true " + game.cartaValida(carta , 0));
    game.baza.push(new Carta(35)) ; // 6 de bastos (triunfo)
    game.orden = [];
    game.orden.push(2);
    game.orden.push(3);
    game.orden.push(0);
    game.orden.push(1);
    carta = new Carta(1);
    console.log("debe ser true " + game.cartaValida(carta , 0));
}

function arrastre2() {
    console.log("arrastre2");
    // va del compañero
    var game = new GoGame(null);
    game.jugadores = [];
    game.jugadores.push(new Jugador("a"));
    game.jugadores[0].cartas.push(new Carta(0)); // as de oros
    game.jugadores[0].cartas.push(new Carta(15)); // 6 de copas
    game.jugadores[0].cartas.push(new Carta(22)); // tres de espadas
    game.jugadores[0].cartas.push(new Carta(1)); // dos de oros
    game.jugadores[0].cartas.push(new Carta(34)); // 5 de bastos
    game.jugadores[0].cartas.push(new Carta(17)); // sota de copas
    game.triunfo = new Carta(33); // 4 de bastos
    game.baza = [];
    game.baza.push(new Carta(6)) ; // 7 de oros
    game.baza.push(new Carta(18)) ; // caballo de copas 
    game.orden = [];
    game.orden.push(2);
    game.orden.push(3);
    game.orden.push(0);
    game.orden.push(1);
    game.ronda = 5;
    var carta = new Carta(1);
    console.log("debe ser true " + game.cartaValida(carta , 0));
    carta = new Carta(0);
    console.log("debe ser true " + game.cartaValida(carta , 0));
    carta = new Carta(34);
    console.log("debe ser false " + game.cartaValida(carta , 0));
    carta = new Carta(17);
    console.log("debe ser false " + game.cartaValida(carta , 0));
}

function cantar() {
    var game = new GoGame(null);
    game.jugadores = [];
    game.baraja = new Baraja();
    game.puntos = [];
    game.puntos[0] = 0;
    game.puntos[1] = 0;
    game.jugadores.push(new Jugador("a"));
    game.jugadores[0].cartas.push(new Carta(0)); // as de oros
    game.jugadores[0].cartas.push(new Carta(37)); // sota de bastos
    game.jugadores[0].cartas.push(new Carta(9)); // rey de oros
    game.jugadores[0].cartas.push(new Carta(1)); // dos de oros
    game.jugadores[0].cartas.push(new Carta(7)); //sota de oros
    game.jugadores[0].cartas.push(new Carta(39)); // rey de bastos
    game.jugadores[0].inicioPartida();
    game.triunfo = new Carta(33); // 4 de bastos
    game.indiceGanador = 2;
    game.canto('a');
    console.log("Deben ser 60 " + game.puntos[0]);
    game.canto('a');
    console.log("Deben ser 60 " + game.puntos[0]);
    game.indiceGanador = 1;
    game.puntos[0] = 0;
    game.canto('a');
    console.log("Deben ser 0 " + game.puntos[0]);
}
