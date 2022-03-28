const express = require("express");

const shipTypes  = require("./constants/shipTypes.js")
const WebsocketServer = require('./websocketServer')

const {galaxyService} = require('./services/galaxyService')
const {userService} = require('./services/userService')


{
    const aiUser = userService.newUser()
    aiUser.alliance = userService.newAlliance()
    aiUser.alliance.addUser(aiUser)
  
    const suns = Object.values(galaxyService.getSuns())
    const randomSun = suns[Math.floor(Math.random() * suns.length)];
    const randomPlanet = randomSun.getPlanets()[Math.floor(Math.random() * randomSun.getPlanets().length)];
    randomPlanet.setOwner(aiUser)

    setInterval(() => {

        Object.values(galaxyService.getShips()).forEach(ship => {
            if(ship.getOwner().getId() === aiUser.getId()) {
                if(ship.getType()==="carrier") {
                    // launch from our carrier to a planet
                    Object.values(galaxyService.getSuns()).forEach(sun => {
                        const sunDistance = getDistance(sun.getX(), sun.getY(), ship.getX(), ship.getY())
                        if(sunDistance<300) {
                            Object.values(sun.getPlanets()).forEach(planet2 => {
                                if((!planet2.getOwner() || ship.getOwner().getId() != planet2.getOwner().getId())) {
                                    const interceptAngle = Math.atan2(planet2.getY() - ship.getY(), planet2.getX() - ship.getX())

                                    for(let i = 0; i < 3; i=i+1) {
                                        if(ship.getStrength() > 5) {
                                            ship.launch("fighter", interceptAngle)
                                        }
                                    }
                                }
                            })
                        }
                    })
                }
            }
        })


        Object.values(galaxyService.getSuns()).forEach(sun => {
            Object.values(sun.getPlanets()).forEach(planet => {
                if(planet.getOwner() && planet.getStrength() > 50 && planet.getOwner().getId() == aiUser.getId()) {

                    Object.values(planet.getMoons()).forEach(moon => {
                        // launch from our planet to our moon
                        if((!moon.getOwner() || planet.getOwner().getId() != moon.getOwner().getId() || moon.getStrength() < 10)) {
                            const interceptAngle = Math.atan2(moon.getY() - planet.getY(), moon.getX() - planet.getX())
                            for(let i = 0; i < 3; i=i+1) {
                                if(planet.getStrength() > 50) {
                                    planet.launch("fighter", interceptAngle + (i * Math.PI/50))
                                }
                            }
                        }

                        // launch from our moon to our planet
                        if(moon.getOwner() && planet.getOwner().getId() === moon.getOwner().getId() && moon.getStrength()>35 && planet.getStrength()<100) {
                            const interceptAngle = Math.atan2(planet.getY() - moon.getY(), planet.getX() - moon.getX())
                            moon.launch("fighter", interceptAngle)
                       }
                    })
                    
                    // launch from our planet to another planet in this system
                    if(planet.getStrength() > 50) {
                        Object.values(sun.getPlanets()).forEach(planet2 => {
                            if(planet.getId() != planet2.getId() && (!planet2.getOwner() || planet.getOwner().getId() != planet2.getOwner().getId() || planet2.getStrength() < 10)) {
                                const interceptAngle = Math.atan2(planet2.getY() - planet.getY(), planet2.getX() - planet.getX())

                                //if((Math.PI - Math.abs(Math.abs(interceptAngle - planet.getAngle()) - Math.PI)) > Math.PI/4) {
                                    for(let i = 0; i < 3; i=i+1) {
                                        if(planet.getStrength() > 50) {
                                            planet.launch("fighter", interceptAngle + (i * Math.PI/50))
                                        }
                                    }
                                //}
                            }
                        })
                    }

                    // launch from our planet to another planet in another system
                    if(planet.getStrength() > 75 && Math.random()>.75) {
                        Object.values(galaxyService.getSuns()).filter(sun2 => getDistance(sun.x, sun.y, sun2.x, sun2.y)<2000).sort(shuffleArray).forEach(sun2 => {
                            if(sun2.getId()!==sun.getId()) {
                                Object.values(sun2.getPlanets()).forEach(planet2 => {
                                    if((!planet2.getOwner() || planet.getOwner().getId() != planet2.getOwner().getId())) {
                                        const interceptAngle = Math.atan2(planet2.getY() - planet.getY(), planet2.getX() - planet.getX())
                                        if(Math.random()>.25) {
                                            // launch fighter
                                            for(let i = 0; i < 3; i=i+1) {
                                                if(planet.getStrength() > 50) {
                                                    planet.launch("fighter", interceptAngle)
                                                }
                                            }
                                        } else if(Math.random()>.25) {
                                            // launch carrier
                                            if(planet.getStrength() > 75) {
                                                planet.launch("carrier", interceptAngle)
                                            }
                                        } else if(Math.random()>.25) {
                                            // launch commander
                                            if(planet.getStrength() > 50) {
                                                planet.launch("commander", interceptAngle)
                                            }
                                        }
                                    }
                                })
                            }
                        })   
                    }              
                }
            })
        })

    }, 10000)
}


// web server
const app = express();
app.use(express.json());
app.use(express.static("build"));
app.use("/static", express.static("build/static"));
app.use("/", express.static("build", { index: "index.html" }));
app.get("/health", (req, res) => {
  res.send("healthy");
});

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

const getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

websockets = new WebsocketServer(app)
galaxyService.on("planetUpdate", (planet) => {
    Object.values(websockets.activeConnections).forEach((connection) => {
        connection.socket.send(
          JSON.stringify({
            time: new Date()/1000,
            type: "planetUpdate",
            sunId: planet.getSun().getId(),
            planet
          })
        );
    });
})

galaxyService.on("sunUpdate", (sun) => {
    Object.values(websockets.activeConnections).forEach((connection) => {
        connection.socket.send(
          JSON.stringify({
            time: new Date()/1000,
            type: "sunUpdate",
            sun
          })
        );
    });
})

galaxyService.on("moonUpdate", (moon) => {
    Object.values(websockets.activeConnections).forEach((connection) => {
        connection.socket.send(
          JSON.stringify({
            time: new Date()/1000,
            type: "moonUpdate",
            sunId: moon.getPlanet().getSun().getId(),
            planetId: moon.getPlanet().getId(),
            moon
          })
        );
    });
})

galaxyService.on("shipUpdate", (ship) => {
    Object.values(websockets.activeConnections).forEach((connection) => {
        connection.socket.send(
          JSON.stringify({
            time: new Date()/1000,
            type: "shipUpdate",
            ship
          })
        );
    });
})

galaxyService.on("shipExploded", (ship) => {
    Object.values(websockets.activeConnections).forEach((connection) => {
        connection.socket.send(
          JSON.stringify({
            time: new Date()/1000,
            type: "shipDestroyed",
            explosion: true,
            ship
          })
        );
    });
})

galaxyService.on("shipDestroyed", (ship) => {
    Object.values(websockets.activeConnections).forEach((connection) => {
        connection.socket.send(
          JSON.stringify({
            time: new Date()/1000,
            type: "shipDestroyed",
            ship
          })
        );
    });
})

userService.on("allianceUpdate", (alliance)  => {
    const userConnections = Object.values(websockets.getConnections()).filter(connection => connection.getUser() && alliance.hasUser(connection.getUser()))
    if(userConnections) {
        userConnections.forEach(connection => {
                connection.socket.send(
                    JSON.stringify({
                        time: new Date() / 1000, 
                        type: 'allianceUpdate', 
                        allianceId: alliance.getId(), 
                        userIds: alliance.getUsers().map(user=>user.getId()),
                    }),
                );
        });
    }
})


websockets.on("authRequest", ({connection, data}) => {

  if (
    data.userId && data.secret
    && userService.getUser(data.userId)
    && userService.getUser(data.userId).getSecret() === data.secret
  ) {
    connection.user = userService.getUser(data.userId)
  } else {
    connection.user = userService.newUser()

    connection.socket.send(
        JSON.stringify({
          time: new Date() / 1000,
          type: 'auth',
          user: connection.user.getId(),
          secret: connection.user.getSecret(),
        }),
      );  
  }

  connection.user.alliance = userService.newAlliance()
  connection.user.alliance.addUser(connection.user)


    if (!galaxyService.hasPlanetOrMoon(connection.user)) {
        const suns = Object.values(galaxyService.getSuns())
        const randomSun = suns[Math.floor(Math.random() * suns.length)];
        const randomPlanet = randomSun.getPlanets()[Math.floor(Math.random() * randomSun.getPlanets().length)];
        randomPlanet.setOwner(connection.user)
    }

    connection.socket.send(JSON.stringify({
        time: new Date() / 1000, 
        type: 'update',
        suns: galaxyService.getSuns(),
        ships: galaxyService.getShips(),
    }));
}) 

websockets.on("changeAlliance", ({connection, data}) => {
    const user = connection.user
    let oldAlliance = user.getAlliance()
    let newAlliance = userService.getAlliance(data.allianceId)

    if(!newAlliance && data.allianceId==="") {
        newAlliance = userService.newAlliance()
        // TODO we probably want to regenerate the old code to avoid reuse
    } else if(newAlliance && oldAlliance.getId() === newAlliance.getId()) {
        return
    }


    if(newAlliance)
    {
        user.setAlliance(newAlliance)
    }
})

websockets.on("navigate", ({connection, data}) => {
  const time = new Date() / 1000
  const alliance = connection.user.getAlliance()

  switch(data.sourceType) {

      case "sun":
        const sun = galaxyService.getSun(data.source.sunId);
        if (alliance.hasUser(sun.getOwner())) {
          Object.values(galaxyService.getShips()).forEach(ship => {
            if (alliance.hasUser(ship.getOwner())) {
              let shipX = ship.getX(time);
              let shipY = ship.getY(time);
              if (getDistance(shipX, shipY, sun.x, sun.y) < 200) {
                ship.turnTo(shipX, shipY, data.angle, time)
              }
            }
          });
        }
        break;
    
      case "commander":
        const commander = galaxyService.getShip(data.source.shipId);
        if (alliance.hasUser(commander.getOwner())) {
          let commanderX = commander.getX(time)
          let commanderY = commander.getY(time)
          Object.values(galaxyService.getShips()).forEach(ship => {
            if (alliance.hasUser(ship.getOwner())) {
              let shipX = ship.getX(time);
              let shipY = ship.getY(time);
              if (getDistance(shipX, shipY, commanderX, commanderY) < 150) {
                ship.turnTo(shipX, shipY, data.angle, time)
              }
            }
          });
        }
        break;
  }
})

websockets.on("shield", ({connection, data}) => {
  const time = new Date()/1000;
  const alliance = connection.user.getAlliance()

  if (!data.planetId || data.moonId)
    return;
    
  const planet = galaxyService.getPlanet(data.planetId);
  if(alliance.hasUser(planet.getOwner()))
  {
      planet.upgradeShield(time)
    }
  
})

websockets.on("launch", ({connection, data}) => {

    const time = new Date()/1000;
    const alliance = connection.getUser().getAlliance()

    switch(data.sourceType) {
        case "carrier":
            const carrier = galaxyService.getShip(data.source.shipId);
            if (alliance.hasUser(carrier.getOwner())) {
                for (let i = 0; i < data.count; i++) {
                    if (carrier.getStrength(time) > shipTypes[data.shipType].cost) {
                        carrier.launch(data.shipType, data.angle)  
                    }
                }
            }
            break;

        case "moon": {
            const planet = galaxyService.getPlanet(data.source.planetId);
            const moon = planet.getMoon(data.source.moonId)

            if (alliance.hasUser(moon.getOwner())) {
                for (let i = 0; i < data.count; i++) {
                    if (moon.getStrength(time) > shipTypes[data.shipType].cost) {
                        moon.launch(data.shipType, data.angle)
                    }
                }
            }
        }
        break;
        
        case "planet": {
            const planet = galaxyService.getPlanet(data.source.planetId);

            if (alliance.hasUser(planet.getOwner())) {
                for (let i = 0; i < data.count; i++) {
                    if (planet.getStrength(time) > shipTypes[data.shipType].cost) {
                        planet.launch(data.shipType, data.angle)
                    }
                }
            }
        }
        break;
    }
})

websockets.on("ping", ({connection}) => connection.socket.send(JSON.stringify({ time: new Date()/1000, type: "ping" })))

websockets.on('error', (err) => {
    console.error('whoops! there was an error', err);
});


