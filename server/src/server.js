const express = require('express');
const WebSocket = require("ws");
const http = require('http');
const fs = require('fs');

const {createSun} = require('./generator.js')
const {getUniqueID} = require('./id.js')

const app = express();
const server = http.createServer(app);

// Backup each two minutes
setInterval(() => {
    let data = JSON.stringify(
        {
            time: Date.now()/1000,
            planets, 
            suns,
            ships, 
            users
        }
    );
    fs.writeFileSync('backup.json', data);
}, 1000*60*2)

app.use(express.json());
app.use(express.static('build'))

app.use('/static', express.static('build/static'))
app.use('/', express.static('build', {index: "index.html"}));

app.get('/health', (req, res) => {
    res.send('healthy');
});

const planets = {}
const suns = {}
const ships = {}
const connections = {}
const users = {}

const shipTypes = {
    "fighter": {
        strength: 5,
        cost: 5,
        shipDamage: 5,
        planetDamage: 5,
        people: 5,
        speed: 8,
        width: 5,
    }, 
    "missile": {
        strength: 1,
        cost: 2,
        shipDamage: 7,
        planetDamage: 7,
        people: 0,
        speed: 12,
        width: 2,
    },
    "missile2": {
        splashDamage: true,
        splashDamageDistance: 20,
        strength: 1,
        cost: 5,
        shipDamage: 7,
        planetDamage: 7,
        people: 0,
        speed: 12,
        width: 2,
    },
    "missile3": {
        splashDamage: true,
        splashDamageDistance: 40,
        spreads: true,        
        strength: 1,
        cost: 50,
        shipDamage: 7,
        planetDamage: 7,
        people: 0,
        speed: 12,
        width: 2,
    },
    "carrier": {
        strength: 75,
        cost: 75,
        shipDamage: 75,
        planetDamage: 5,
        people: 0,
        speed: 6,
        width: 8,
    },
    "carrier2": {
        strength: 100,
        cost: 100,
        shipDamage: 75,
        planetDamage: 5,
        people: 0,
        speed: 6,
        width: 8,
    },
    "carrier3": {
        strength: 125,
        cost: 125,
        shipDamage: 75,
        planetDamage: 5,
        people: 0,
        speed: 6,
        width: 8,
    },
    "commander": {
        strength: 15,
        cost: 25,
        shipDamage: 5,
        planetDamage: 5,
        people: 2,
        speed: 6,
        width: 8,
    }
}

for(let i=0; i<40; i++) {
    const sun = createSun()
    suns[sun.id] = sun
    Object.entries(sun.planets).forEach(([planetId, planet])=> {
        planets[planetId] = planet
    })
}

// ws instance
const wss = new WebSocket.Server({ noServer: true });

// handle upgrade of the request
server.on("upgrade", function upgrade(request, socket, head) {
    console.log("upgrade")
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
wss.on("connection", (socket) => {
    console.log("connection")

    let connectionId = null
    let userId = null

    // handle message events
    // receive a message and echo it back
    socket.on("message", (message) => {
        console.log(`Received message => ${message}`);
        let time = Date.now()/1000

        data = JSON.parse(message)
        if(data.type==='ping') {
            socket.send(JSON.stringify({time, type: 'ping' }));
        } else if(data.type==='auth') {
            if(data.user && data.secret && users[data.user] && users[data.user].secret === data.secret) {
                userId = data.user
                connectionId = getUniqueID()
                connections[connectionId] = {
                    socket: socket,
                    user: userId
                }

            } else {
                connectionId = getUniqueID()
                connections[connectionId] = {
                    socket: socket,
                    user: data.user
                }

                userId = getUniqueID()
                users[userId] = {
                    secret: getUniqueID()+"-"+getUniqueID()
                }

                const giftSun = Object.entries(suns)[Math.floor(Math.random()*Object.entries(suns).length)][1]
                const giftPlanet = Object.entries(giftSun.planets)[Math.floor(Math.random()*Object.entries(giftSun.planets).length)][1]
                giftPlanet.owner = userId
                giftPlanet.strength.value = 50
                giftPlanet.strength.time = Date.now()/1000

                Object.entries(connections).forEach(([connectionId, connection]) => {
                    connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId: giftSun.id, planet: giftPlanet }));
                })
            }
            socket.send(JSON.stringify({time, type: 'auth', user: userId, secret: users[userId].secret}))
            socket.send(JSON.stringify({time, type: 'update', suns, ships}))

        } else if(data.type==='navigate') {

            if(data.sourceType==='sun') {
                const sun = suns[data.source.sunId]
                if(sun.owner===userId) {
                    Object.entries(ships).forEach(([shipId, ship]) => {
                        if(ship.owner === userId) {
                            let shipX = ship.x + (ship.speed * (time - ship.angle.time) * Math.cos(ship.angle.value))
                            let shipY = ship.y + (ship.speed * (time - ship.angle.time) * Math.sin(ship.angle.value))
                                        
                            const sunDistance = getDistance(shipX, shipY, sun.x, sun.y)

                            if(sunDistance<200) {
                                ship.x = shipX
                                ship.y = shipY
                                ship.prevAngle = {
                                    time: time,
                                    value: ship.angle.value
                                }
                                ship.angle.time=time
                                ship.angle.value=data.angle + (Math.random() * Math.PI/20) - Math.PI/40
                                Object.entries(connections).forEach(([connectionId, connection]) => {
                                    connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                                })
                            }
                        }
                    })
                }
            } else if(data.sourceType==='commander') {
                const commander = ships[data.source.shipId]
                if(commander.owner===userId) {
                    let commanderX = commander.x + (commander.speed * (time - commander.angle.time) * Math.cos(commander.angle.value))
                    let commanderY = commander.y + (commander.speed * (time - commander.angle.time) * Math.sin(commander.angle.value))
                    Object.entries(ships).forEach(([shipId, ship]) => {
                        if(ship.owner === userId) {
                            let shipX = ship.x + (ship.speed * (time - ship.angle.time) * Math.cos(ship.angle.value))
                            let shipY = ship.y + (ship.speed * (time - ship.angle.time) * Math.sin(ship.angle.value))
                                        
                            const shipDistance = getDistance(shipX, shipY, commanderX, commanderY)

                            if(shipDistance<150) {
                                ship.x = shipX
                                ship.y = shipY
                                ship.prevAngle = {
                                    time: time,
                                    value: ship.angle.value
                                }
                                ship.angle.time=time
                                ship.angle.value=data.angle + (Math.random() * Math.PI/20) - Math.PI/40
                                Object.entries(connections).forEach(([connectionId, connection]) => {
                                    connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                                })
                            }
                        }
                    })
                }
            }
        } else if(data.type==='shield') {

            const planet = planets[data.planetId]
            if(planet.owner === userId) {
                const sun = suns[data.sunId]
                const planetStrength = Math.min(planet.strength.max, planet.strength.value + ((time-planet.strength.time) * planet.strength.speed));

                if(data.shieldType==='shield' && planet.strength.max == 100 && planetStrength > 75) {
                    planet.strength.value = planetStrength - 75
                    planet.strength.max = 125
                    planet.strength.time = time

                    Object.entries(connections).forEach(([connectionId, connection]) => {
                        connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId: sun.id, planet }));
                    })
                } else if(data.shieldType==='shield2' && planet.strength.max == 125 && planetStrength > 100) {
                    planet.strength.value = planetStrength - 100
                    planet.strength.max = 150
                    planet.strength.time = time

                    Object.entries(connections).forEach(([connectionId, connection]) => {
                        connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId: sun.id, planet }));
                    })
                } else if(data.shieldType==='shield3' && planet.strength.max == 150 && planetStrength > 125) {
                    planet.strength.value = planetStrength - 125
                    planet.strength.max = 200
                    planet.strength.time = time

                    Object.entries(connections).forEach(([connectionId, connection]) => {
                        connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId: sun.id, planet }));
                    })
                }

            }

        } else if(data.type==='launch') {

            if(data.sourceType==='carrier') {
                const carrier = ships[data.source.shipId]
                if(carrier.owner === userId) {
                    for(let i=0; i<data.count; i++) {
                        if(carrier.strength > shipTypes[data.shipType].cost) {

                            carrier.strength = carrier.strength - shipTypes[data.shipType].cost
                            let carrierX = carrier.x + (carrier.speed * (time - carrier.angle.time) * Math.cos(carrier.angle.value))
                            let carrierY = carrier.y + (carrier.speed * (time - carrier.angle.time) * Math.sin(carrier.angle.value))
            
                            const ship = {
                                id: getUniqueID(),
                                owner: userId, 
                                type: data.shipType,
                                x: carrierX + ((8+ (Math.random() * 2)) * Math.cos(data.angle)),
                                y: carrierY + ((8+ (Math.random() * 2)) * Math.sin(data.angle)),
                                carrierId: carrier.id,
                                source: "carrier",
                                angle: {
                                    value: data.angle + (Math.random() * Math.PI/20) - Math.PI/40,
                                    time: time
                                }
                            }

                            Object.assign(ship, shipTypes[data.shipType])
                            ships[ship.id] = ship
                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                            })
                        }
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship: carrier }));
                        })
                    }
                }
            }

            if(data.sourceType==='moon') {
                const planet = planets[data.source.planetId]
                const moon = planet.moons[data.source.moonId]

                if(moon.owner === userId) {
                    const sun = suns[planet.sunId]
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                    const moonAngle = moon.angle.value + (time * Math.PI/moon.distance * moon.angle.speed);
                    const moonX = planetX + (moon.distance * Math.sin(moonAngle));
                    const moonY = planetY + (moon.distance * Math.cos(moonAngle));

                    for(let i=0; i<data.count; i++) {
                        const moonStrength = Math.min(moon.strength.max, moon.strength.value + ((time-moon.strength.time) * moon.strength.speed));
                        if(moonStrength > shipTypes[data.shipType].cost) {

                            moon.strength.value = moonStrength - shipTypes[data.shipType].cost
                            moon.strength.time = time

                            const ship = {
                                id: getUniqueID(),
                                owner: userId, 
                                type: data.shipType,
                                x: moonX + ((3+ (Math.random() * 2)) * Math.cos(data.angle)),
                                y: moonY + ((3+ (Math.random() * 2)) * Math.sin(data.angle)),
                                moonId: moon.id,
                                source: "moon",
                                angle: {
                                    value: data.angle + (Math.random() * Math.PI/20) - Math.PI/40,
                                    time: time
                                }
                            }

                            Object.assign(ship, shipTypes[data.shipType])
                            ships[ship.id] = ship
                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                            })
                        }
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'moonUpdate', sunId: sun.id, planetId: planet.id, moon }));
                        })
                    }
                }
            }

            if(data.sourceType==='planet') {
                const planet = planets[data.source.planetId]
                if(planet.owner === userId) {
                    const sun = suns[data.source.sunId]
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                    for(let i=0; i<data.count; i++) {
                        const planetStrength = Math.min(planet.strength.max, planet.strength.value + ((time-planet.strength.time) * planet.strength.speed));
                        if(planetStrength > shipTypes[data.shipType].cost) {

                            planet.strength.value = planetStrength - shipTypes[data.shipType].cost
                            planet.strength.time = time                      
                            
                            const ship = {
                                id: getUniqueID(),
                                owner: userId, 
                                planetId: planet.id,
                                source: "planet",
                                type: data.shipType,

                                // TODO add this to the location object
                                x: planetX + ((8+ (Math.random() * 5)) * Math.cos(data.angle)),
                                y: planetY + ((8+ (Math.random() * 5)) * Math.sin(data.angle)),

                                // TODO rename this location
                                angle: {
                                    value: data.angle + (Math.random() * Math.PI/20) - Math.PI/40,
                                    time: time
                                }
                            }

                            Object.assign(ship, shipTypes[data.shipType])
                            ships[ship.id] = ship
                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                            })
                        }
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId: sun.id, planet }));
                        })
                    }
                }
            }

        }

    });

    // handle close event
    socket.on("close", () => {
        console.log("closed", wss.clients.size);
    });
});

var getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

setInterval(() => {
    let time = Date.now()/1000

    Object.entries(ships).forEach(([shipId, ship]) => {
        let shipX = ship.x + (ship.speed * (time - ship.angle.time) * Math.cos(ship.angle.value))
        let shipY = ship.y + (ship.speed * (time - ship.angle.time) * Math.sin(ship.angle.value))

        Object.entries(ships).forEach(([shipId2, ship2]) => {
            if(shipId2!=shipId) {
                let shipX2 = ship2.x + (ship2.speed * (time - ship2.angle.time) * Math.cos(ship2.angle.value))
                let shipY2 = ship2.y + (ship2.speed * (time - ship2.angle.time) * Math.sin(ship2.angle.value))
                const shipDistance = getDistance(shipX2, shipY2, shipX, shipY)
                
                // Match speed of commander?
                if(ship.type==='commander' && ship.owner === ship2.owner && shipDistance<100)
                {
                    if(ship.speed != ship2.speed) {
                        ship2.speed = ship.speed
                        ship2.x=shipX2
                        ship2.y=shipY2
                        ship2.angle.time=time
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship:ship2 }));
                        })
                    }
                }

                // Join carrier?
                if(ship.type==='carrier' && ship.owner === ship2.owner && shipDistance< ship.width)
                {
                    if(ship.strength + ship2.strength <= 75) {
                        ship.strength += ship2.strength
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship:ship }));
                            connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', ship:ship2 }));
                        })
                        delete ships[ship2.id]
                    }
                }                

                // Collide?
                if(shipDistance < ship.width+ship2.width && ship.owner !== ship2.owner) {
                    ship.strength -= ship2.shipDamage
                    ship2.strength -= ship.shipDamage
                    
                    if(ship.strength <= 0) {
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'collision', ship }));
                        })
                        delete ships[shipId]    
                    } else {
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                        })
                    }
                    if(ship2.strength <= 0) {
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'collision', ship:ship2 }));
                        })
                        delete ships[shipId2]    
                    } else {
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship2 }));
                        })
                    }

                    if(ship.splashDamage || ship2.splashDamage) {
                        let makeSplashDamage = (ship, shipDamage, splashDamageDistance, spreads) => {
                            let shipX = ship.x + (ship.speed * (time - ship.angle.time) * Math.cos(ship.angle.value))
                            let shipY = ship.y + (ship.speed * (time - ship.angle.time) * Math.sin(ship.angle.value))
                            Object.entries(ships).forEach(([shipId3, ship3]) => {
                                if(ship3.owner !== originalShip.owner) {
                                    let shipX3 = ship3.x + (ship3.speed * (time - ship3.angle.time) * Math.cos(ship3.angle.value))
                                    let shipY3 = ship3.y + (ship3.speed * (time - ship3.angle.time) * Math.sin(ship3.angle.value))
                                    const shipDistance = getDistance(shipX3, shipY3, shipX, shipY)
                                    console.log(shipDistance, splashDamageDistance)
                                    if(shipDistance < splashDamageDistance) {
                                        ship3.strength -= shipDamage
                                        if(ship3.strength <= 0) {
                                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                                connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'collision', ship:ship3 }));
                                            })
                                            delete ships[shipId3]
                                        } else {
                                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                                connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship:ship3 }));
                                            })                
                                        }
                                        if(spreads) {
                                            makeSplashDamage(ship3, true, shipDamage, splashDamageDistance, spreads)
                                        }
                                    }
                                }
                            })                                
                        }
                        makeSplashDamage(ship, Math.max(ship.shipDamage,ship2.shipDamage), Math.max(ship.splashDamageDistance||0, ship2.splashDamageDistance||0), ship.spreads || ship2.spreads)
                    }                    
                }
    
            }
        })
    
        Object.entries(suns).forEach(([sunId, sun]) => {
            const sunDistance = getDistance(shipX, shipY, sun.x, sun.y)
            if(sunDistance < sun.size) {
                Object.entries(connections).forEach(([connectionId, connection]) => {
                    connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'sun', sunId, ship }));
                    delete ships[shipId]
                })
            } else if (sunDistance < 1000) {
                Object.entries(sun.planets).forEach(([planetId, planet]) => {
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle))
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle))
                    const planetDistance = getDistance(shipX, shipY, planetX, planetY)
                    if(planetDistance < planet.size && ship.planetId !== planetId) {

                        const planetStrength = (planet.owner ? Math.min(planet.strength.max, planet.strength.value + ((time-planet.strength.time) * planet.strength.speed)) : 0)
                        if(!planet.owner || planet.owner === ship.owner) {
                            if(ship.people>0) {
                                planet.strength.value = ship.people + planetStrength
                                planet.strength.time = time
                                planet.owner = ship.owner
                                if(planet.owner !== sun.owner) {
                                    sun.owner = ship.owner
                                    Object.entries(connections).forEach(([connectionId, connection]) => {
                                        connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                    })
                                }
                            }
                        } else {
                            if(planetStrength < ship.planetDamage) {
                                if(ship.people>0) {
                                    planet.strength.value = ship.people
                                    planet.strength.time = time
                                    planet.owner = ship.owner
                                } else {
                                    planet.strength.value = 0
                                    planet.strength.time = time
                                    planet.owner = null
                                }
                                if(planet.owner !== sun.owner) {
                                    sun.owner = ship.owner
                                    Object.entries(connections).forEach(([connectionId, connection]) => {
                                        connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                    })
                                }
        
                            } else {
                                planet.strength.value = planetStrength - ship.planetDamage
                                planet.strength.time = time
                            }
                        }
                        delete ships[shipId]

                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'planet', sunId, planetId, ship }));
                            connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId, planet }));
                        })

                    } else if (planetDistance < 500) {
                        Object.entries(planet.moons).forEach(([moonId, moon]) => {
                            const moonAngle = moon.angle.value + (time * Math.PI/moon.distance * moon.angle.speed);
                            const moonX = planetX + (moon.distance * Math.sin(moonAngle))
                            const moonY = planetY + (moon.distance * Math.cos(moonAngle))
                            const moonDistance = getDistance(shipX, shipY, moonX, moonY)
                            if(moonDistance < moon.size && ship.moonId !== planetId) {

                                const moonStrength = (moon.owner ? Math.min(moon.strength.max, moon.strength.value + ((time-moon.strength.time) * moon.strength.speed)) : 0)
                                if(!moon.owner || moon.owner === ship.owner) {
                                    if(ship.people>0) {
                                        moon.strength.value = 5 + moonStrength
                                        moon.strength.time = time
                                        moon.owner = ship.owner
                                        if(moon.owner !== sun.owner) {
                                            sun.owner = ship.owner
                                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                                connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                            })
                                        }           
                                    }                                 
                            } else {
                                    if(moonStrength<ship.people) {
                                        if(ship.people>0) {
                                            moon.strength.value = ship.people
                                            moon.strength.time = time
                                            moon.owner = ship.owner
                                        } else {
                                            moon.strength.value = 0
                                            moon.strength.time = time
                                            moon.owner = null
                                        }
                                        if(moon.owner !== sun.owner) {
                                            sun.owner = ship.owner
                                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                                connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                            })
                                        }                                            
                                    } else {
                                        moon.strength.value = -5 + moonStrength
                                        moon.strength.time = time
                                    }
                                }
                                delete ships[shipId]

                                Object.entries(connections).forEach(([connectionId, connection]) => {
                                    connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'moon', sunId, planetId, moonId, ship }));
                                    connection.socket.send(JSON.stringify({time, type: 'moonUpdate', sunId, planetId, moon }));
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