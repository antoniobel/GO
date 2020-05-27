/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */
/* global __dirname, path */

const path = require('path');
const express = require('express');
const serveIndex = require('serve-index');
const cors = require('cors');
const http = require('http');
const colyseus = require('colyseus');
const monitor = require('@colyseus/monitor').monitor;

const Handler = require("./server/handler").Handler;

const port = 3000;
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new colyseus.Server({
    server: server,
    express: app,
    pingInterval: 0
});

gameServer.define("go_room", Handler);

app.use('/', express.static(path.join(__dirname, "static")));
app.use('/', serveIndex(path.join(__dirname, "static"), {'icons': true}));
app.use('/colyseus', monitor(gameServer));
app.use('/colyseusclient', express.static(path.join(__dirname, "/colyseusclient")));
app.use('/server', express.static(path.join(__dirname, "/server")));
app.use('/client', express.static(path.join(__dirname, "/client")));

gameServer.onShutdown(function(){
    console.log(`Guiñote Server finalizando.`);
});

gameServer.listen(port);

console.log(`Guiñote Server funcionando en http://localhost:${ port }`);
