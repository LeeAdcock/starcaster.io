const express = require("express");

const shipTypes  = require("./constants/shipTypes.js")
const WebsocketServer = require('./websocketServer')

const {galaxyService} = require('./services/galaxyService')
const {userService} = require('./services/userService')

const AiPlayer = require('./services/aiService')

aiPlayers = []
for(let i=0; i<2; i=i+1)
{
    aiPlayers.push(new AiPlayer())
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

const getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

websockets = new WebsocketServer(app)

const resetInterval = 10800000
const reset = () => {
    aiPlayers.forEach(ai => ai.reset())
    galaxyService.reset()

    // Give active human players a planet
    const suns = Object.values(galaxyService.getSuns())
    Object.values(websockets.getConnections()).forEach(connection => {
        const randomSun = suns[Math.floor(Math.random() * suns.length)];
        const randomPlanet = randomSun.getPlanets()[Math.floor(Math.random() * randomSun.getPlanets().length)];
        randomPlanet.setOwner(connection.user)
    })

    // Give active ai players a planet
    aiPlayers.map(ai => ai.getUser()).forEach(user => {
        const randomSun = suns[Math.floor(Math.random() * suns.length)];
        const randomPlanet = randomSun.getPlanets()[Math.floor(Math.random() * randomSun.getPlanets().length)];
        randomPlanet.setOwner(user)
    })
    
    Object.values(websockets.getConnections()).forEach(connection => {    
        connection.socket.send(JSON.stringify({
            time: new Date() / 1000, 
            type: 'update',
            suns: galaxyService.getSuns(),
            ships: galaxyService.getShips(),
      }));
    })
    setTimeout(reset, resetInterval - (new Date() % resetInterval))
}
setTimeout(reset, resetInterval - (new Date() % resetInterval))

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

    connection.socket.send(
        JSON.stringify({
            time: new Date() / 1000, 
            type: 'allianceUpdate', 
            allianceId: connection.user.alliance.getId(), 
            userIds: connection.user.alliance.getUsers().map(user=>user.getId()),
        }),
    );

  } else {
    connection.user = userService.newUser()

    connection.user.alliance = userService.newAlliance()
    connection.user.alliance.addUser(connection.user)
        
    connection.socket.send(
        JSON.stringify({
        time: new Date() / 1000,
        type: 'auth',
        user: connection.user.getId(),
        secret: connection.user.getSecret(),
        }),
    );  
  }

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


