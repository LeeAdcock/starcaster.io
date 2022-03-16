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
        size: 20,
        planets: {}
    }
    for(let i=0; i<2+Math.round(Math.random() * 10); i++) {
        const planet = createPlanet(sun.id)
        sun.planets[planet.id] = planet
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
        angle: {
            value: Math.random() * 2 * Math.PI,
            time: 0,
            speed: 1/20
        },
        size: 10,
        owner: null,
        strength: { value: 0, time: 0, max: 100},
        moons: {}
    }
    for(let i=0; i<Math.round(Math.random() * 3); i++) {
        const moon = createMoon(planet.id)
        planet.moons[moon.id] = moon
    }
    planets[planet.id] = planet
    return planet
}

const moons = {}
const createMoon = (planetId) => {
    const moon = {
        id: getUniqueID(),
        planetId,
        size: 3,
        strength: { value: 0, time: 0, max: 50},
        distance: 15+(Math.round(Math.random() * 3) * 6),
        angle: {
            value: Math.random() * 2 * Math.PI,
            time: 0,
            speed: 1/2
        },
    }
    moons[moon.id] = moon
    return moon;
}

const ships = {}
const connections = {}

const users = {}

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
    const cnxId = getUniqueID()
    connections[cnxId] = ctx
    ctx.send(JSON.stringify({time, type: 'userUpdated', user: {id: cnxId }}));

    const giftedPlanet = Object.entries(Object.entries(suns)[0][1].planets)[0][1];
    giftedPlanet.owner = cnxId
    giftedPlanet.strength = { value: 0, time}

    // handle message events
    // receive a message and echo it back
    ctx.on("message", (message) => {
        console.log(`Received message => ${message}`);

        data = JSON.parse(message)
        if(data.type==='ping') {
            ctx.send(JSON.stringify({time, type: 'ping' }));
        } else if(data.type==='launchFighter') {

            if(data.sourceType==='moon') {
                const planet = planets[data.source.planet.id]
                const moon = planet.moons[data.source.moon.id]

                if(moon.owner === cnxId) {
                    const sun = suns[planet.sunId]
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                    const moonAngle = moon.angle.value + (time * Math.PI/moon.distance * moon.angle.speed);
                    const moonX = planetX + (moon.distance * Math.sin(moonAngle));
                    const moonY = planetY + (moon.distance * Math.cos(moonAngle));

                    const moonStrength = moon.strength.value + Math.min(moon.strength.max, ((time-moon.strength.time) * 1));
                    if(moonStrength > 5) {

                        moon.strength = {
                            value: -5 + moonStrength,
                            time
                        }

                        const ship = {
                            id: getUniqueID(),
                            owner: cnxId, 
                            x: moonX + ((3+ (Math.random() * 2)) * Math.cos(data.angle)),
                            y: moonY + ((3+ (Math.random() * 2)) * Math.sin(data.angle)),
                            moonId: moon.id,
                            source: "moon",
                            angle: {
                                value: data.angle + (Math.random() * Math.PI/200) - Math.PI/100,
                                time: time
                            }
                        }
                        ships[ship.id] = ship
                        Object.entries(connections).forEach(([ctxId, ctx]) => {
                            ctx.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                            ctx.send(JSON.stringify({time, type: 'moonUpdate', sunId: sun.id, planetId: planet.id, moon }));
                        })
                    }
                }
            }

            if(data.sourceType==='planet') {
                const planet = planets[data.source.planet.id]

                if(planet.owner === cnxId) {
                    const sun = suns[planet.sunId]
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                    const planetStrength = planet.strength.value + Math.min(100, ((time-planet.strength.time) * 1));
                    if(planetStrength > 5) {

                        planet.strength = {
                            value: -5 + planetStrength,
                            time
                        }

                        const ship = {
                            id: getUniqueID(),
                            owner: cnxId, 
                            x: planetX + ((8+ (Math.random() * 5)) * Math.cos(data.angle)),
                            y: planetY + ((8+ (Math.random() * 5)) * Math.sin(data.angle)),
                            planetId: planet.id,
                            source: "planet",
                            angle: {
                                value: data.angle + (Math.random() * Math.PI/200) - Math.PI/100,
                                time: time
                            }
                        }
                        ships[ship.id] = ship
                        Object.entries(connections).forEach(([ctxId, ctx]) => {
                            ctx.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                            ctx.send(JSON.stringify({time, type: 'planetUpdate', sunId: sun.id, planet }));
                        })
                    }
                }
            }

        }

    });

    // handle close event
    ctx.on("close", () => {
        console.log("closed", wss.clients.size);
    });

    // sent a message that we're good to proceed
    ctx.send(JSON.stringify({time, type: 'update', suns, ships}));
});

var getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

setInterval(() => {
    Object.entries(ships).forEach(([shipId, ship]) => {
        let shipX = ship.x + (8 * (time - ship.angle.time) * Math.cos(ship.angle.value))
        let shipY = ship.y + (8 * (time - ship.angle.time) * Math.sin(ship.angle.value))

        Object.entries(suns).forEach(([sunId, sun]) => {
            const sunDistance = getDistance(shipX, shipY, sun.x, sun.y)
            if(sunDistance < sun.size) {
                Object.entries(connections).forEach(([ctxId, ctx]) => {
                    ctx.send(JSON.stringify({time, type: 'shipDestroyed', cause:'sun', sunId, ship }));
                    delete ships[shipId]
                })
            } else if (sunDistance < 1000) {
                Object.entries(sun.planets).forEach(([planetId, planet]) => {
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle))
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle))
                    const planetDistance = getDistance(shipX, shipY, planetX, planetY)
                    if(planetDistance < planet.size && ship.planetId !== planetId) {

                        // TODO weaken if this isn't owner by ship.owner
                        const planetStrength = (planet.owner ? planet.strength.value + Math.min(planet.strength.max, ((time-planet.strength.time) * 1)) : 0)
                        if(!planet.owner || planet.owner === ship.owner) {
                            planet.strength = {
                                value: 5 + planetStrength,
                                time
                            }
                            planet.owner = ship.owner
                        } else {
                            planet.strength = {
                                value: -5 + planetStrength,
                                time
                            }
                        }
                        delete ships[shipId]

                        Object.entries(connections).forEach(([ctxId, ctx]) => {
                            ctx.send(JSON.stringify({time, type: 'shipDestroyed', cause:'planet', sunId, planetId, ship }));
                            ctx.send(JSON.stringify({time, type: 'planetUpdate', sunId, planet }));
                        })
                    } else if (planetDistance < 500) {
                        Object.entries(planet.moons).forEach(([moonId, moon]) => {
                            const moonAngle = moon.angle.value + (time * Math.PI/moon.distance * moon.angle.speed);
                            const moonX = planetX + (moon.distance * Math.sin(moonAngle))
                            const moonY = planetY + (moon.distance * Math.cos(moonAngle))
                            const moonDistance = getDistance(shipX, shipY, moonX, moonY)
                            if(moonDistance < moon.size && ship.moonId !== planetId) {
                                Object.entries(connections).forEach(([ctxId, ctx]) => {
                                    ctx.send(JSON.stringify({time, type: 'shipDestroyed', cause:'moon', sunId, planetId, moonId, ship }));

                                    // TODO weaken if this isn't owner by ship.owner
                                    moon.strength = {
                                        value: 5 + (moon.owner ? moon.strength.value + Math.min(moon.strength.max, ((time-moon.strength.time) * 1)) : 0),
                                        time
                                    }
                                    moon.owner = ship.owner
                                    ctx.send(JSON.stringify({time, type: 'moonUpdate', sunId, planetId, moon }));
        
                                    delete ships[shipId]
                                })
                            }
                        })
                    }
                })
            }
        })

    })
}, 200);

server.listen(8080)