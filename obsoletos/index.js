/* global __dirname, process */

const path = require('path');
const express = require('express');
const serveIndex = require('serve-index');
const cors = require('cors');
const http = require('http');
const colyseus = require('colyseus');
const monitor = require('@colyseus/monitor').monitor;

// Import demo room handlers
const ChatRoom = require("./rooms/01-chat-room.js").ChatRoom;
const StateHandlerRoom = require("./rooms/02-state-handler").StateHandlerRoom;
//const AuthRoom = require("./rooms/03-auth");
//const ReconnectionRoom = require('./rooms/04-reconnection');

const port = Number(process.env.PORT || 2567) + Number(process.env.NODE_APP_INSTANCE || 0);
const app = express();

app.use(cors());
app.use(express.json());

// Attach WebSocket Server on HTTP Server.
const server = http.createServer(app);
const gameServer = new colyseus.Server({
  server: server,
  express: app,
  pingInterval: 0
});

// Register ChatRoom as "chat"
gameServer.define("chat", ChatRoom);

// Register ChatRoom with initial options, as "chat_with_options"
// onInit(options) will receive client join options + options registered here.
gameServer.define("chat_with_options", ChatRoom, {
    custom_options: "you can use me on Room#onCreate"
}); 

gameServer.define("state_handler", StateHandlerRoom);
//gameServer.define("auth", AuthRoom);
//gameServer.define("reconnection", ReconnectionRoom);

app.use('/', express.static(path.join(__dirname, "static")));
app.use('/js', express.static(path.join(__dirname, "js")));
app.use('/', serveIndex(path.join(__dirname, "static"), {'icons': true}));

// (optional) attach web monitoring panel
app.use('/colyseus', monitor());

gameServer.onShutdown(function(){
  console.log(`game server is going down.`);
});

gameServer.listen(port);

// process.on("uncaughtException", (e) => {
//   console.log(e.stack);
//   process.exit(1);
// });

console.log(`Listening on http://localhost:${ port }`);
