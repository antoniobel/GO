/*
 * Copyright (C) 2020 Antonio Bel Puchol
 */

import path from 'path';
import express from 'express';
import serveIndex from 'serve-index';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { monitor } from '@colyseus/monitor';

import { Handler } from './server/handler';

const port =3000;
const app = express();

app.use(cors());
app.use(express.json());

// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app),
  express: app,
  pingInterval: 0,
});

gameServer.define("go_room", Handler);

app.use('/', express.static(path.join(__dirname, "static")));
app.use('/', serveIndex(path.join(__dirname, "static"), {'icons': true}));
app.use('/colyseusclient', express.static(path.join(__dirname, "/colyseusclient")));
app.use('/server', express.static(path.join(__dirname, "/server")));
app.use('/client', express.static(path.join(__dirname, "/client")));

// (optional) attach web monitoring panel
app.use('/colyseus', monitor());

gameServer.onShutdown(function(){
  console.log(`Guiñote Server finalizando.`);
});

gameServer.listen(port);

process.on("uncaughtException", (e) => {
  console.log(e.stack);
  process.exit(1);
});

console.log(`Listening on http://localhost:${ port }`);