/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
"use strict";

import { UI } from "./goGraficos";
import { GoMainMono } from "./goMainMono";
import { GoMainMulti } from "./goMainMulti";

// Punto de entrada del programa cliente
export var ui = new UI();
ui.primerInit();
export var main;
export var debug = false;

var option = document.getElementById("programmode").innerHTML;
if (debug) console.log("Opción es " , option);

if (option === "mono") {
    main = new GoMainMono();
    main.abrirDialogoInicio();
}
if (option === "multi") {
    main = new GoMainMulti();
    main.abrirWizard();
}

export function setDebug(value: boolean) {
    debug = value;
}