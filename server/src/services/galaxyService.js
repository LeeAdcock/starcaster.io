const EventEmitter = require('events');
const shipTypes = require('./../constants/shipTypes')

const Sun = require('./../types/sun')

const getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

class GalaxyService extends EventEmitter {

    constructor() {
        super()
        this.suns = {}
        this.ships = {}
        this.planets = {}

        for(let i=0; i<40; i=i+1) {
            const sun = new Sun()
            this.suns[sun.getId()] = sun
            Object.values(sun.planets).forEach(planet => this.planets[planet.id] = planet)
        }

        const schedule = () => 
            setTimeout(() => {
                try {
                    this.collisionDetection();
                    schedule()
                } catch (e) {
                    this.emit("error", e)
                }
            }, 200);
        schedule()

        this.on("shipExploded", (ship) => {
            delete this.ships[ship.getId()];
        })

        this.on("shipDestroyed", (ship) => {
            delete this.ships[ship.getId()];
        })        
    }

    hasPlanetOrMoon(userId) {
        let planetFound = false;
        Object.values(this.suns).forEach((sun) => {
            planetFound = planetFound || sun.owner === userId;
          Object.values(sun.planets).forEach((planet) => {
            planetFound = planetFound || planet.owner === userId;
            Object.values(planet.moons).forEach((moon) => {
                planetFound = planetFound || moon.owner === userId;
            });
          });
        });
        return planetFound;
      }

    launchedShip(ship) {
        this.ships[ship.getId()] = ship
        this.emit("shipUpdate", ship);
    }

    getShip(shipId) {
        return this.ships[shipId]
    }
   
    getShips() {
        return Object.values(this.ships)
    }

    getPlanet(planetId) {
        return this.planets[planetId]
    }

    getPlanets() {
        return Object.values(this.planets)
    }

    getSuns() {
        return this.suns
    }

    getSun(sunId) {
        return this.suns[sunId]
    }

    collisionDetection()  {
        let time = Date.now() / 1000;
      
        // Exceeded lifespan?
        Object.values(this.ships).forEach((ship) => {
          if (ship.lastTouch < time - shipTypes[ship.type].lifespan) {
            this.emit("shipDestroyed", ship)
          }
        });
      
        // Cache all ship locations
        let shipLocations = {};
        Object.values(this.ships).forEach((ship) => {
          let x = ship.getX();
          let y = ship.getY();
          shipLocations[ship.id] = [x, y];
        });
      
        // Any ships run into each other?
        Object.values(this.ships).forEach((ship) => {
          let [shipX, shipY] = shipLocations[ship.id];
      
          Object.values(this.ships).forEach((ship2) => {
            if (ship2.id != ship.id) {
              let [shipX2, shipY2] = shipLocations[ship2.id];
      
              // Lazy calculation of the distance first
              if (
                shipX2 > shipX - 100 &&
                shipX2 < shipX + 100 &&
                shipY2 > shipY - 100 &&
                shipY2 < shipY + 100
              ) {
                const shipDistance = getDistance(shipX2, shipY2, shipX, shipY);
      
                // Match speed of commander?
                if (
                  ship.type === "commander" &&
                  ship.owner.alliance === ship2.owner.alliance &&
                  shipDistance < 100
                ) {
                  if (ship.speed != ship2.speed) {
                    ship2.speed = ship.speed;
                    ship2.x = shipX2;
                    ship2.y = shipY2;
                    ship2.angle.time = time;
                    this.emit("shipUpdate", ship2)
                  }
                }
      
                // Join carrier?
                if (
                  ship.type === "carrier" &&
                  ship.owner.alliance === ship2.owner.alliance &&
                  shipDistance < ship.width
                ) {
                  if (ship.strength + ship2.strength <= 75) {
                    ship.strength += ship2.strength;
                    this.emit("shipUpdate", ship)
                    this.emit("shipDestroyed", ship2)
                  }
                }
      
                // Seaker missile?
                if (
                  shipDistance < 50 &&
                  ship.type === "missile4" &&
                  ((!ship.intercept && ship.owner.alliance != ship2.owner.alliance ) ||
                    (ship.intercept &&
                      !this.ships[ship.intercept] &&
                      ship.owner.alliance != ship2.owner.alliance ) ||
                    ship.intercept === ship2.id)
                ) {
                  ship.intercept = ship2.id;
                  const interceptAngle = Math.atan2(shipY2 - shipY, shipX2 - shipX);
                  if (Math.abs(interceptAngle - ship.angle.value) > Math.PI / 10) {
                    ship.prevAngle = {
                      time: new Date()/1000,
                      value: ship.angle.value,
                    };
                    ship.angle.value = interceptAngle;
                    ship.angle.time = time;
                    ship.x = shipX;
                    ship.y = shipY;
                    this.emit("shipUpdate", ship)
                  }
                }
      
                // Collide?
                if (
                  shipDistance < ship.width + ship2.width &&
                  ship.owner.alliance.getId() != ship2.owner.alliance.getId()
                ) {
                  ship.strength -= ship2.shipDamage;
                  ship2.strength -= ship.shipDamage;
      
                  if (ship.strength <= 0) {
                      ship.shipDamage=0
                      this.emit("shipExploded", ship)
                  } else {
                      this.emit("shipUpdate", ship)
                  }
                  if (ship2.strength <= 0) {
                    ship2.shipDamage=0
                    this.emit("shipExploded", ship2)
                  } else {
                      this.emit("shipUpdate", ship2)
                  }
      
                  if (ship.splashDamage || ship2.splashDamage) {
                    let makeSplashDamage = (
                      ship,
                      shipDamage,
                      splashDamageDistance,
                      spreads
                    ) => {
                      [shipX2, shipY2] = shipLocations[ship.id];
      
                      Object.values(this.ships).forEach((ship3) => {
                        let [shipX3, shipY3] = shipLocations[ship3.id];
      
                        // TODO could shortcut with a lazy distance calculation first
                        const shipDistance = getDistance(
                          shipX3,
                          shipY3,
                          shipX,
                          shipY
                        );
                        if (shipDistance < splashDamageDistance) {
                          ship3.strength -= shipDamage;
                          if (ship3.strength <= 0) {
                              this.emit("shipExploded", ship3)
      
                            if (spreads) {
                              makeSplashDamage(
                                ship3,
                                true,
                                shipDamage,
                                splashDamageDistance,
                                spreads
                              );
                            }
                          } else {
                              this.emit("shipUpdate", ship3)
                          }
                        }
                      });
                    };
                    makeSplashDamage(
                      ship,
                      Math.max(ship.shipDamage, ship2.shipDamage),
                      Math.max(
                        ship.splashDamageDistance || 0,
                        ship2.splashDamageDistance || 0
                      ),
                      ship.spreads || ship2.spreads
                    );
                  }
                }
              }
            }
          });
      
          // Ships run into a sun, planet, or moon?
          Object.values(this.suns).forEach((sun) => {
            const sunDistance = getDistance(shipX, shipY, sun.getX(), sun.getY());
            if (sunDistance < sun.size) {
              this.emit("shipExploded", ship)
      
              if (ship.type === "missile3") {
                  // Slow production of dark solar system
                  sun.dark = true;
                  Object.values(sun.planets).forEach((planet) => {
                      planet.strength.speed = 1 / 2;
                      Object.values(planet.moons).forEach((moon) => {
                      moon.strength.speed = 1 / 4;
                      });
                  });
                  
                  this.emit("sunUpdate", sun)
                  Object.values(sun.planets).forEach((planet) => {
                      this.emit("planetpdate", planet)
                      Object.values(planet.moons).forEach((moon) => {
                          this.emit("moonUpdate", moon)
                      });
                  });
              }
            } else if (sunDistance < 1000) {
              // Within a solar system
              Object.values(sun.planets).forEach((planet) => {
                const planetX = planet.getX();
                const planetY = planet.getY();
                const planetDistance = getDistance(shipX, shipY, planetX, planetY);
                if (planetDistance < planet.size && ship.planetId !== planet.id) {
                  const planetStrength = planet.owner
                    ? Math.min(
                        planet.strength.max,
                        planet.strength.value +
                          (time - planet.strength.time) * planet.strength.speed
                      )
                    : 0;
                  if (!planet.owner || planet.owner.alliance === ship.owner.alliance) {
                    // Claim or add to the planet's health
                    if (ship.people > 0) {
                      if (!planet.owner) {
                        sun.owner = ship.owner;
                        planet.owner = ship.owner;
                        this.emit("sunUpdate", sun)
                      }
                      planet.strength.value = ship.people + planetStrength;
                      planet.strength.time = time;
                    }
                  } else {
                    // Conquer planet
                    if (planetStrength < ship.planetDamage) {
                      if (ship.people > 0) {
                        planet.strength.value = ship.people;
                        planet.strength.time = time;
                        planet.owner = ship.owner;
                        if (planet.owner.alliance != sun.owner.alliance) {
                          sun.owner = ship.owner;
                          this.emit("sunUpdate", sun)
                      }
                      } else {
                        planet.strength.value = 0;
                        planet.strength.time = time;
                        planet.owner = null;
                      }
                    } else {
                      // damage planet
                      planet.strength.value = planetStrength - ship.planetDamage;
                      planet.strength.time = time;
                    }
                  }
      
                  this.emit("planetUpdate", planet)
      
                  if(planet.owner && planet.owner.alliance != ship.owner.alliance){
                      this.emit("shipExploded", ship)
                  } else {
                      this.emit("shipDestroyed", ship)
                  }
                  
                } else if (planetDistance < 500) {
                  Object.values(planet.moons).forEach((moon) => {
                    const moonAngle =
                      moon.angle.value +
                      ((time * Math.PI) / moon.distance) * moon.angle.speed;
                    const moonX = moon.getX();
                    const moonY = moon.getY();
                    const moonDistance = getDistance(shipX, shipY, moonX, moonY);
                    if (moonDistance < moon.size && ship.moonId !== planet.id) {
                      const moonStrength = moon.owner
                        ? Math.min(
                            moon.strength.max,
                            moon.strength.value +
                              (time - moon.strength.time) * moon.strength.speed
                          )
                        : 0;
                      if (!moon.owner || moon.owner.alliance === ship.owner.alliance) {
                        if (ship.people > 0) {
                            if(!moon.owner) {
                              moon.owner = ship.owner;
                              if (moon.owner !== sun.owner) {
                                sun.owner = ship.owner;
                                this.emit("sunUpdate", sun)
                              }    
                            }
                          moon.strength.value = 5 + moonStrength;
                          moon.strength.time = time;
                        }
                      } else {
                        if (moonStrength < ship.people) {
                          if (ship.people > 0) {
                            moon.strength.value = ship.people;
                            moon.strength.time = time;
                            moon.owner = ship.owner;
                            if (moon.owner.alliance != sun.owner.alliance) {
                              sun.owner = ship.owner;
                              this.emit("sunUpdate", sun)
                            }
                          } else {
                            moon.strength.value = 0;
                            moon.strength.time = time;
                            moon.owner = null;
                          }
                        } else {
                          moon.strength.value = -5 + moonStrength;
                          moon.strength.time = time;
                        }
                      }
      
                      this.emit("moonUpdate", moon)
      
                      if(moon.owner && moon.owner.alliance != ship.owner.alliance) {
                          this.emit("shipExploded", ship)
                      } else {
                          this.emit("shipDestroyed", ship)
                      }
                    }
                  });
                }
              });
            }
          });
        });
    }
}

module.exports = new GalaxyService()