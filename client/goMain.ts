/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { UI } from "./goGraficos";
import { shortcut } from "./shortcut2";
import { Client , Room } from "../colyseusclient/colyseus";
import { GoJugador } from "./goJugador";
import { GoPublico } from "./goPublico";
import { GoComun } from "./goComun";

export class GoMain {

    private room: Room;
    private manejador: GoComun;
    public nombreJugador: string;
    public movimiento: boolean = true;
    private conectado: boolean = false;
    private usuariosConectados: Array<any>;

    constructor() {
        this.init();
        this.initShorcuts();
        this.posicionarBotones();
    }

    init() {
        document.getElementById("conectar").onclick = this.btnConectar;
        document.getElementById("desconectar").onclick = this.btnDesconectar;
        document.getElementById("usuarios").onclick = this.incluir;
        document.getElementById("pareja1").onclick = () => { this.excluir('pareja1');};
        document.getElementById("pareja2").onclick = () => { this.excluir('pareja2');};
        document.getElementById("comenzar").onclick = this.btnComenzar;
        document.getElementById("close1").onclick = this.close1;
        document.getElementById("close2").onclick = this.close2;
        document.getElementById("botonsi").onclick = this.botonsi;
        document.getElementById("botonno").onclick = this.botonno;
        document.getElementById("cante").onclick = this.cantar;
        document.getElementById("cambio7").onclick = this.cambio7;
        document.getElementById("ordenar").onclick = (event) => { this.ordenar(event); };
        document.getElementById("salir").onclick = this.salir;
        document.getElementById('canvas').onclick = (event) => { this.canvasClicked(event); };
    }

    initShorcuts() {
        var scut = new shortcut();
        scut.add("Ctrl+X",function() {
            main.requestSnapshot();
        } , '');
        scut.add("Ctrl+A",function() {
            if (main.movimiento) {
                main.movimiento = false;
            } else {
                main.movimiento = true;
            }
        }, '');
        scut.add("Alt+N",function() {
            if (ui.chupito.current === -1) {
                ui.chupito.ponerChupito();
            } else {
                ui.chupito.quitarChupito();
            }
            ui.dibujar();
        }, ''); 
    }

    /**
     * Coloca los botones en su posición y los deja como ocultos
     */
    private posicionarBotones() {
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
        puntos.style.left = "15px";
        puntos.style.top =  Math.floor(window.innerHeight - 100) + "px";
        puntos.style.display = "none";
        console.log("Fin Posicionar botones");
}

    // Métodos que manejan eventos onclick de los diálogos modales y de los botones incrustados en el canvas
    // Ojo!! Estos métodos son llamados como respuestas a eventos y tienen un ámbito global. En ellos no se puede usar this para
    // referirse a propiedades / métodos de GoMain. En su lugar hay que usar main     
    /**
     * Conecta con el servidor, identificándose con nombreJugador. Recibe una instancia de room
     * Invocado al pulsar el botón conectar
     */
    private btnConectar(): void {
        if (main.conectado) return;
        main.nombreJugador = (<HTMLInputElement>document.getElementById("name")).value; 
        console.log(main.nombreJugador);
        if (main.nombreJugador == '') return;
        var host = window.document.location.host.replace(/:.*/, '');
        var client = new Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));
        client.joinOrCreate("go_room" , { nombre: main.nombreJugador}).then((room_instance: Room) => {
            main.room = room_instance; // para poder manejarla fuera del then     
            main.conectado = true;         
            main.room.onMessage("mensajeGo" , function(message) {
                var d = new Date();
                console.log(d.getTime() , message);
                if ('ping' in message) {
                    main.enviarMensaje({ping: 0});
                    return;
                }
                main.enviarMensaje({echo: message}); // Funcion eco. Mantener para verificar el log en el servidor. 
                if ('code' in message) {
                    if (message.code === 1) { // nombre repetido. hay que desconectarse.
                        main.nombreRepetido();
                    }
                }
                if ('action' in message) {
                    if (message.action === "Jugadores") {
                        main.jugadoresConectados(message.data);
                    } else {
                        if (main.manejador !== undefined)  
                        main.manejador.procesaAction(message.action, message.data);
                    }
                }
                if ('conexiones' in message) {
                    main.conexiones(message.conexiones);
                }
            });            
        }).catch(e => {
            console.error("Se ha recibido un error", e);
        });;  
}

    /**
     * Cuando el usuario pulsa el botón desconectar.
     */
    private btnDesconectar(): void {
        main.room.leave();
        document.getElementById("myModal").style.display = "none";
    }

    /**
     * Evento onclick lista usuarios. Mueve los jugadores a alguna de las listas de parejas, si no están completas.
     * Cuando las dos parejas están completas, habilita el botón comenzar
     */
    private incluir(): void {
        var usuarios = <HTMLSelectElement>document.getElementById("usuarios");
        var pareja1 = <HTMLSelectElement>document.getElementById("pareja1");
        var pareja2 = <HTMLSelectElement>document.getElementById("pareja2");
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
            (<HTMLButtonElement>document.getElementById("comenzar")).disabled = false;
        } else {
            (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
        }
    }

    /**
     * Quita el elemento seleccionado de la lista de parejas donde se ha pulsado y lo pasa a la lista de jugadores.
     */
    private excluir(selector: string): void {
        var pareja = <HTMLSelectElement>document.getElementById(selector);
        var user = pareja.value;
        var index = pareja.selectedIndex;
        var usuarios = <HTMLSelectElement>document.getElementById("usuarios");
        var option = document.createElement("option");
        option.text = user;
        usuarios.add(option);
        pareja.remove(index);
        (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
    }

    /**
     * Invocado cuando se pulsa el botón comenzar partida. Lanza al servidor el mensaje ComenzarPartida con los jugadores 
     * que participan. Ojo como se envian los jugadores: jugador 1 pareja 1, jugador 1 pareja 2, jugador 2 pareja 1 y 
     * jugador 2 pareja 2. Esto se convertirá directamente en el array de jugadores que mantiene el servidor. 
     */
    private btnComenzar(): void {
        var pareja1 = <HTMLSelectElement>document.getElementById("pareja1");
        var pareja2 = <HTMLSelectElement>document.getElementById("pareja2");
        if (pareja1.length < 2 || pareja2.length < 2)  {
            return;
        }    
        var jugadores = [];
        jugadores.push(pareja1.options[0].label);
        jugadores.push(pareja2.options[0].label);
        jugadores.push(pareja1.options[1].label);
        jugadores.push(pareja2.options[1].label);
        main.enviarMensaje({ action: "ComienzaPartida" , datos: jugadores });
    }

    /**
     * Cierre del diálogo de inicio
     */
    private close1(): void {
        document.getElementById("myModal").style.display = "none"; // cerramos el diálogo de inicio
    }

    /**
     * Cierre del diálogo de fin de partida
     */
    private close2(): void {
        document.getElementById("modalfin").style.display = "none"; // cerramos el diálogo fin partida
        if (main.manejador.partidaTerminada.finCoto) { // Al final del coto el servidor desconecta a todos. Limpiamos selects y empezamos.
            main.vaciaSelect(document.getElementById("usuarios"));
            main.vaciaSelect(document.getElementById("pareja1"));
            main.vaciaSelect(document.getElementById("pareja2"));
            main.abrirDialogoInicio();
        }
    }

    /**
     * Boton si del diálogo modal si/no
     */
    private botonsi(): void {
        if (main.manejador.cancelarPartida()) {
            main.manejador = undefined; // Anulamos el manejador para que no lleguen mensajes. (Solo para espectadores)
        };
    }

    /**
     * Boton no del diálogo modal si/no
     */
    private botonno(): void {
        document.getElementById("modalsino").style.display = "none";
    }

    private cantar(): void {
        main.manejador.cantar();
    }
    
    private cambio7(): void {
        main.manejador.cambio7();
    }
    
    private ordenar(event: MouseEvent): void {
        main.manejador.ordenar(event);
    }
    
    private salir(): void {
        document.getElementById("msgsino").innerHTML =  main.manejador.mensajeSalir();
        document.getElementById("modalsino").style.display = "block";
    }

    private canvasClicked(e: MouseEvent) {
        main.manejador.canvasClicked(e);
    }
    
    // Métodos de acción
    // En estos métodos si se puede usar this (aunque sean llamados por métodos de eventos donde no se puede usar this. Como se llaman
    // con un main.xxxx entonces ya entiende this. !!!Hay que joderse!!!!)
    public mostrarBotones() {
        document.getElementById("cante").style.display = "block"; 
        document.getElementById("cambio7").style.display = "block";
        document.getElementById("salir").style.display = "block";
        document.getElementById("ordenar").style.display = "block";
    }
    
    public abrirDialogoInicio() {
        this.vaciaPareja(document.getElementById("pareja1"));
        this.vaciaPareja(document.getElementById("pareja2"));
        document.getElementById("myModal").style.display = "block"; // abrimos el diálogo
        document.getElementById("name").focus(); 
        (<HTMLButtonElement>document.getElementById("comenzar")).disabled = true;
    }

    /**
     * Copia todos los elementos de una select de pareja a la select de jugadores
     */
    private vaciaPareja(pareja) {
        var usuarios = <HTMLSelectElement>document.getElementById("usuarios");
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
     * Elimina todas las entradas de una select
     */
    public vaciaSelect(sel) {
        while (sel.options.length > 0) {
            sel.options.remove(0);
        }
    }

    /**
     * Se ejecuta cuando llega un mensaje 'conexiones'. Se vacian todos los selectores y se ponen todos
     * los usuarios conectados en el selector de usuarios.
     * El parámetro es un array de todos los usuarios conectados
     */
    private conexiones(conexiones) {
        this.usuariosConectados = conexiones;
        var option;
        this.vaciaSelect(document.getElementById("usuarios"));
        this.vaciaSelect(document.getElementById("pareja1"));
        this.vaciaSelect(document.getElementById("pareja2"));
        this.usuariosConectados.forEach(user => {
            option = document.createElement("option");
            option.text = user.nombre;
            (<HTMLSelectElement>document.getElementById("usuarios")).add(option);    
        })
    }

    /**
     * Accion enviada por el servidor con los jugadores. Los que no están en la lista son espectadores.
     * Se crea el manejador correspondiente. Si el usuario local está en la lista de jugadores se crea un 
     * manejador de jugador. Si no lo está se crea un manejador de público.
     * data es un array con los nombres de los jugadores.
     */
    private jugadoresConectados(data) {
        var i: number;
        for (i = 0; i < data.length; i++) {
            if (data[i] === this.nombreJugador) {
                this.manejador = new GoJugador(this.nombreJugador, this.room); // el usuario es un jugador
                return;
            } 
        }
        this.manejador = new GoPublico(this.nombreJugador, this.room); // el usuario es un espectador
    }

    /**
     * Se ha introudcido un nombre igual al de otro usuario ya conectado. Se da un aviso de nombre repetido y se limpian
     * los selectores
     */
    private nombreRepetido() {
        console.log("Nombre repetido. Me desconeto");
        this.conectado = false;
        var texto = " Nombre de jugador repetido. Usa otro nombre";
        document.getElementById("msg").innerHTML = texto;
        document.getElementById("modalmsg").style.display = "block";
        setTimeout(function() {
            document.getElementById("modalmsg").style.display = "none";
            main.vaciaSelect(document.getElementById("usuarios"));
            main.vaciaSelect(document.getElementById("pareja1"));
            main.vaciaSelect(document.getElementById("pareja2"));
            } , 2000);                                
        this.room.leave();
    }

    public requestSnapshot() {
        this.enviarMensaje({ action: "Snapshot" , data: this.nombreJugador});
    }
    
    public enviarMensaje(data) {
        this.room.send("mensajeGo" , data);
    }
    
    public getConectado(): boolean {
        return this.conectado;
    }
    
    public setConectado(estado: boolean): void {
        this.conectado = estado;
    }
    
}

// Equivale al main()
export var ui = new UI();
ui.primerInit();
export var main = new GoMain();
main.abrirDialogoInicio();

