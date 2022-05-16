require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require("socket.io");
const webserver = require('./service/webserver');
const port = parseFloat(process.argv[2]) || 5000;
const dbrun = require('./database/index').connect;
const socketserver = require('./service/socketserver');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const main = async() => {
    await dbrun();

    webserver(app);
    socketserver(io);

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/www/index.html');
    });

    server.listen(port, () => {
        console.log('listening on *:' + port);
        console.log("Ready!");
    });
}
main()