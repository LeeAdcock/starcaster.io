const EventEmitter = require('events');
const shipTypes = require('./../constants/shipTypes')
const sunNames = require('./../constants/sunNames')
const getUniqueID = require("../util/uniqueIdGenerator.js");

const getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

  class Moon {

    constructor(planet) {
        this.id= getUniqueID()
        this.planet = planet
        this.size= 3
        this.owner= null
        this.strength={
            value: 0,
            time: 0 ,
            max: 50 ,
            speed: 1
        }
        this.distance= 15 + Math.round(Math.random() * 3) * 6
        this.angle = {
            value:Math.random() * 2 * Math.PI,
            time: 0,
            speed:(1 / 2)
        }
        planet.moons[this.id] = this;
    }

    toJSON() {
        return {
          id: this.id,
          distance: this.distance,
          angle: this.angle,
          owner: this.owner ? this.owner.getId() : undefined,
          strength: this.strength,
          size: this.size,
          moons: this.moons
        }
      }
    
      getId() {
          return this.id
      }
    getOwner() {
        return this.owner
    }
    getPlanet() {
        return this.planet
    }
    getStrength() {
        return Math.min(this.strength.max, this.strength.value + Math.floor(((new Date()/1000) - this.strength.time) * this.strength.speed))
    }
    getShieldLevel() {
        return  shieldLevelsByStrength[this.strength.max]
    }
    getX() { 
        return this.getPlanet().getX() + this.distance * Math.cos(this.angle.value + (((new Date()/1000) * Math.PI) / this.distance) * this.angle.speed)
    }
    getY() { 
        return this.getPlanet().getY() + this.distance * Math.sin(this.angle.value + (((new Date()/1000) * Math.PI) / this.distance) * this.angle.speed)
    }
    launch(shipType, angle) {
        if(this.getStrength() - shipTypes[shipType].cost <= 0) 
            return;

        const time = new Date() / 1000
        this.strength.value = this.getStrength() - shipTypes[shipType].cost;
        this.strength.time = time
        let moonX = this.getX()
        let moonY = this.getY()
        galaxyService.emit("moonUpdate", this)

        // todo move to galaxyService
        const launchedShip = new Ship(shipType)
        launchedShip.id = getUniqueID()
        launchedShip.lastTouch = time
        launchedShip.owner = this.getOwner()
        launchedShip.type = shipType
        launchedShip.x = moonX + (8 + Math.random() * 2) * Math.cos(angle)
        launchedShip.y = moonY + (8 + Math.random() * 2) * Math.sin(angle)
        launchedShip.angle.value = angle + (Math.random() * Math.PI) / 20 - Math.PI / 40
        launchedShip.angle.time = time
        launchedShip.moonId = this.getId()
        galaxyService.ships[launchedShip.getId()] = launchedShip
        galaxyService.emit("shipUpdate", launchedShip);
        return launchedShip
    }       
}

class Planet {

    constructor(sun) {
        this.id= getUniqueID()
        this.sun = sun
        this.distance= 25 + Math.round(Math.random() * 10) * 15
        this.angle = {
            value: Math.random() * 2 * Math.PI,
            time: 0,
            speed: 1 / 20
        }
        this.size= 10
        this.owner= null
        this.strength = {
            value: 0,
            time:0,
            max:100,
            speed:2
        }
        this.moons= {}

        sun.planets[this.id] = this;

        for (let i = 0; i < Math.round(Math.random() * 3); i=i+1) {
            new Moon(this);  
        }
    }

    toJSON() {
        return {
          id: this.id,
          distance: this.distance,
          angle: this.angle,
          owner: this.owner ? this.owner.getId() : undefined,
          strength: this.strength,
          size: this.size,
          moons: this.moons
        }
      }

    getId() {
        return this.id
    }
    getOwner() {
        return this.owner
    }
    setOwner(user) {
        this.owner = user
    }
    getSun() {
        return this.sun
    }
    getMoon(moonId) {
        return this.moons[moonId]
    }
    getMoons(){
        return this.moons
    }
    getAngle() {
        return this.angle.value + (((new Date()/1000) * Math.PI) / this.distance) * this.angle.speed
    }
    getStrength() {
        return Math.min(this.strength.max, this.strength.value + Math.floor(((new Date()/1000) - this.strength.time) * this.strength.speed))
    }
    getShieldLevel() {
        return shieldLevelsByStrength[this.strength.max]
    }
    getX() { 
        return this.getSun().getX() + this.distance * Math.cos(this.getAngle())
    }
    getY() { 
        return this.getSun().getY() + this.distance * Math.sin(this.getAngle())
    }
    getShieldLevel() {
        shieldLevelsByStrength[this.strength.max]
    }
    upgradeShield() {
        const currentStrength = this.getStrength()
        if(currentStrength - (this.strength.max - 25) > 0 && this.strength.max < 175) {
            this.strength.value = currentStrength - (this.strength.max - 25);
            this.strength.max = this.strength.max + 25;
            this.strength.time = (new Date()/1000);
            galaxyService.emit("planetUpdate", this)
            return true
        }
        return false
    }    
    launch(shipType, angle) {
        if(this.getStrength() - shipTypes[shipType].cost <= 0) 
            return;

        const time = (new Date()/1000)
        let planetX = this.getX()
        let planetY = this.getY()

        this.strength.value = this.getStrength() - shipTypes[shipType].cost;
        this.strength.time = new Date()/1000
        galaxyService.emit("planetUpdate", this)

        // todo move to galaxyService
        const launchedShip = new Ship(shipType)
        launchedShip.id = getUniqueID()
        launchedShip.lastTouch = time
        launchedShip.owner = this.getOwner()
        launchedShip.type = shipType
        launchedShip.x = planetX + (8 + Math.random() * 2) * Math.cos(angle)
        launchedShip.y = planetY + (8 + Math.random() * 2) * Math.sin(angle)
        launchedShip.angle.value = angle + (Math.random() * Math.PI) / 20 - Math.PI / 40
        launchedShip.angle.time = time
        launchedShip.planetId = this.getId()
        galaxyService.ships[launchedShip.getId()] = launchedShip
        galaxyService.emit("shipUpdate", launchedShip);
        return launchedShip
    }      
}

class Ship {

    constructor(shipType) {
        Object.assign(this, shipTypes[shipType]);
        this.id = getUniqueID()
        this.lastTouch = null
        this.owner = null
        this.type = null
        this.x = null
        this.y = null
        this.angle = {
            value: null,
            time: null
        } 
    }

    toJSON() {
        return {
          id: this.id,
          y: this.y,
          x: this.x,
          angle: this.angle,
          prevAngle: this.prevAngle,
          owner: this.owner ? this.owner.getId() : undefined,
          strength: this.strength,
          size: this.size,
          speed: this.speed,
          type: this.type
        }
      }

    getId() {return this.id}

    getX() {return this.x + this.speed * ((new Date()/1000) - this.angle.time) * Math.cos(this.angle.value) }

    getY() {return this.y + this.speed * ((new Date()/1000) - this.angle.time) * Math.sin(this.angle.value) }

    getType() {
        return this.type
    }
    
    getStrength() {return this.strength }

    getOwner() { return this.owner}

    decreaseStrength(amount) {
        this.strength = this.strength - amount
        this.emit("shipUpdate", this)
    }

    turnTo(x, y, angle) {
        const time = (new Date()/1000)
        this.lastTouch = time;
        this.x = x;
        this.y = y;
        this.prevAngle = {
            time,
            value: this.angle.value,
        };
        this.angle.time = time;
        this.angle.value = angle + (Math.random() * Math.PI) / 20 - Math.PI / 40;            
        galaxyService.emit("shipUpdate", this);
    }

    launch(shipType, angle) {
        const newStrength = this.getStrength() - shipTypes[shipType].cost
        if(newStrength <= 0) 
            return;

        const time = (new Date()/1000)
        let shipX = this.getX()
        let shipY = this.getY()

        this.strength = newStrength;
        galaxyService.emit("shipUpdate", this);

        // todo move to galaxyService
        const launchedShip = new Ship(shipType)
        launchedShip.id = getUniqueID()
        launchedShip.lastTouch = time
        launchedShip.owner = this.getOwner()
        launchedShip.type = shipType
        launchedShip.x = shipX + (12 + Math.random() * 2) * Math.cos(angle)
        launchedShip.y = shipY + (12 + Math.random() * 2) * Math.sin(angle)
        launchedShip.angle.value = angle + (Math.random() * Math.PI) / 20 - Math.PI / 40
        launchedShip.angle.time = time
        launchedShip.carrierId = this.getId()
        galaxyService.ships[launchedShip.getId()] = launchedShip
        galaxyService.emit("shipUpdate", launchedShip);
        return launchedShip
    }

}

class Sun {
    constructor() {
        this.id= getUniqueID()
        this.name= sunNames[Math.floor(Math.random() * sunNames.length)]
        this.x= (Math.random() * 10000)
        this.y= (Math.random() * 10000)
        this.size= 20
        this.planets= {}
        
        for (let i = 0; i < 2 + Math.round(Math.random() * 10); i=i+1) {
          const planet = new Planet(this)
          this.planets[planet.getId()] = planet
        }
    }

    toJSON() {
        return {
          id: this.id,
          name: this.name,
          x: this.x,
          y: this.y,
          size: this.size,
          owner: this.owner ? this.owner.getId() : undefined,
          planets: this.planets
        }
      }

    getId() {
        return this.id
    }

    getName() {
        return this.name
    }

    getOwner() {
        return this.owner
    }

    getX() {
        return this.x
    }

    getY() {
        return this.y
    }

    getIsDark() {
        return this.dark
    }

    getPlanets() {
        return Object.values(this.planets)
    }

}


class GalaxyService extends EventEmitter {

    constructor() {
        super()

        this.reset()

        const schedule = () => 
            setTimeout(() => {
                try {
                    this.collisionDetection();
                    schedule()
                } catch (e) {
                    console.log(e)
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

    reset() {
        this.suns = {}
        this.ships = {}
        this.planets = {}

        for(let i=0; i<40; i=i+1) {
            const sun = new Sun()
            this.suns[sun.getId()] = sun
            Object.values(sun.planets).forEach(planet => this.planets[planet.id] = planet)
        }
    }

    hasPlanetOrMoon(user) {
        let planetFound = false;
        Object.values(this.suns).forEach((sun) => {
            planetFound = planetFound || sun.owner === user.getId();
          Object.values(sun.planets).forEach((planet) => {
            planetFound = planetFound || planet.owner === user.getId();
            Object.values(planet.moons).forEach((moon) => {
                planetFound = planetFound || moon.owner === user.getId();
            });
          });
        });
        return planetFound;
      }

    getShip(shipId) {
        return this.ships[shipId]
    }
   
    getShips() {
        return this.ships
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
        const ships = Object.values(this.ships)

        const shipInteraction = (ship, ship2, shipDistance) => {
            // Match speed of commander?
            if (
                ship.type === "commander" &&
                ship.owner.alliance.getId() === ship2.owner.alliance.getId() &&
                shipDistance < 100
            ) {
                if (ship.speed != ship2.speed) {
                    let [shipX2, shipY2] = shipLocations[ship2.id];       
                    ship2.speed = ship.speed;
                    ship2.x = shipX2;
                    ship2.y = shipY2;
                    ship2.angle.time = time;
                    this.emit("shipUpdate", ship2)
                }
            }
        
            // Seaker missile?
            if (
                shipDistance < 50 &&
                ship.type === "missile4" &&
                (
                    (!ship.intercept && ship.owner.alliance.getId() != ship2.owner.alliance.getId() ) ||
                    (ship.intercept && !this.ships[ship.intercept] && ship.owner.alliance.getId() != ship2.owner.alliance.getId()) || 
                    ship.intercept === ship2.id
                )
            ) {
                ship.intercept = ship2.id;
                let [shipX, shipY] = shipLocations[ship.id];
                let [shipX2, shipY2] = shipLocations[ship2.id];

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
                && ship.strength > 0 
                && ship2.strength > 0
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
                        ship2,
                        shipDamage,
                        splashDamageDistance,
                        spreads
                    ) => {
                        const [shipX2, shipY2] = shipLocations[ship2.id];
        
                        Object.values(this.ships).forEach((ship3) => {
                            const [shipX3, shipY3] = shipLocations[ship3.id];
            
                            // TODO could shortcut with a lazy distance calculation first
                            const shipDistance = getDistance(
                                shipX3,
                                shipY3,
                                shipX2,
                                shipY2
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

        ships.forEach((ship, shipIndex) => {
          let [shipX, shipY] = shipLocations[ship.id];
      
          ships.forEach((ship2, ship2Index) => {

            // shortcut
            if(ship2Index < shipIndex) return

            let [shipX2, shipY2] = shipLocations[ship2.id];
        
                // Lazy calculation of the distance first
                if (
                shipX2 > shipX - 100 &&
                shipX2 < shipX + 100 &&
                shipY2 > shipY - 100 &&
                shipY2 < shipY + 100
                ) {
                    const shipDistance = getDistance(shipX2, shipY2, shipX, shipY);
                    shipInteraction(ship, ship2, shipDistance)
                    shipInteraction(ship2, ship, shipDistance)
                }
            })
                   
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
                        if(planet.strength.max > 100) {
                            // When planets change hands, shields drop a level
                            planet.strength.max -= 25
                        }
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

const galaxyService = new GalaxyService()

module.exports = {galaxyService}