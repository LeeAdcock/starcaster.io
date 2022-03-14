const express = require('express');
const WebSocket = require("ws");
var http = require('http');

const app = express();
const server = http.createServer(app);

let time = 0;
setInterval(() => time = time + .1, 100)

app.use(express.json());
  
app.get('/', (req, res) => {
    res.send('success');
});
 
const getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
  };

  const suns = {}
  const createSun = () => {
    const sun = {
        id: getUniqueID(),
        x: Math.random() * 5000,
        y: Math.random() * 5000,
        planets: []
    }
    for(let i=0; i<2+Math.round(Math.random() * 10); i++) {
        sun.planets.push(createPlanet(sun.id))
    }
    suns[sun.id] = sun
    return sun
}

const planets = {}
const createPlanet = (sunId) => {
    const planet = {
        id: getUniqueID(),
        sunId,
        distance: 25+(Math.round(Math.random() * 10) * 15),
        initialAngle: Math.random() * 2 * Math.PI,
        owner: null,
        strength: 0,
        moons: []
    }
    for(let i=0; i<Math.round(Math.random() * 3); i++) {
        planet.moons.push(createMoon(planet.id))
    }
    planets[planet.id] = planet
    return planet
}

const moons = {}
const createMoon = (planetId) => {
    const moon = {
        id: getUniqueID(),
        planetId,
        distance: 15+(Math.round(Math.random() * 3) * 6),
        initialAngle: Math.random() * 2 * Math.PI,
    }
    moons[moon.id] = moon
    return moon;
}

const ships = []

for(let i=0; i<10; i++) {
    createSun()
}

// ws instance
const wss = new WebSocket.Server({ noServer: true });

// handle upgrade of the request
server.on("upgrade", function upgrade(request, socket, head) {
    try {
        // authentication and some other steps will come here
        // we can choose whether to upgrade or not
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit("connection", ws, request);
        });
    } catch (err) {
        console.log("upgrade exception", err);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
    }
});

// what to do after a connection is established
wss.on("connection", (ctx) => {
    // print number of active connections
    console.log("connected", wss.clients.size);

    // handle message events
    // receive a message and echo it back
    ctx.on("message", (message) => {
        console.log(`Received message => ${message}`);

        data = JSON.parse(message)

        if(data.type==='launchFighter') {
            const planet = planets[data.planetId]
            const sun = suns[planet.sunId]
            const planetAngle = planet.initialAngle + (time * Math.PI/(20 * planet.distance));
            const planetX = sun.x + (planet.distance * Math.sin(planetAngle));
            const planetY = sun.y + (planet.distance * Math.cos(planetAngle));

            const ship = {
                id: getUniqueID(),
                x: planetX + ((8+ (Math.random() * 5)) * Math.cos(data.angle)),
                y: planetY + ((8+ (Math.random() * 5)) * Math.sin(data.angle)),
                initialAngle: data.angle + (Math.random() * Math.PI/200) - Math.PI/100,
                initialLaunch: time
            }

            ships.push(ship)
            ctx.send(JSON.stringify({time, type: 'update', suns, ships}));
        }

    });

    // handle close event
    ctx.on("close", () => {
        console.log("closed", wss.clients.size);
    });

    // sent a message that we're good to proceed
    ctx.send(JSON.stringify({time, type: 'update', suns, ships}));
});

server.listen(8080)