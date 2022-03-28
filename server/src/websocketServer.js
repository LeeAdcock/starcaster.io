const WebSocket = require("ws");
const http = require("http");
const EventEmitter = require('events');
const getUniqueID = require("./util/uniqueIdGenerator.js");
const Connection = require('./types/connection')


class WebsocketServer extends EventEmitter {

    constructor(app) {
        super()

        this.activeConnections = {}
       
        let websocketServer = new WebSocket.Server({ noServer: true });        
        let server = http.createServer(app);
        server.listen(8080);

        server.on("upgrade", (request, socket, head) => {
            try {
                websocketServer.handleUpgrade(request, socket, head, (socket) => {

                    const connection = new Connection()
                    connection.id = getUniqueID()
                    connection.socket = socket

                    this.activeConnections[connection.getId()] = connection

                    socket.on("message", (message) => {
                        console.log(`Received message => ${message}`);
                        const data = JSON.parse(message)
                        this.emit(data.type, { connection, data })
                    });

                    // TODO ping keep alive?

                    socket.on("close", () => {
                        delete this.activeConnections[connection.connectionId]
                    });
                });
            } catch (err) {
                console.log("upgrade exception", err);
                socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                socket.destroy();
                return;
            }
        });
    }

    getConnections() {
        return this.activeConnections
    }
}

module.exports = WebsocketServer