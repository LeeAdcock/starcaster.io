const getUniqueID = require("../util/uniqueIdGenerator.js");
const shipTypes = require('./../constants/shipTypes')
const Ship = require('./../types/ship')

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
        return Math.min(this.strength.max, this.strength.value + ((new Date()/1000) - this.strength.time) * this.strength.speed)
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
    launch = (shipType, angle) => {
        const time = new Date() / 1000
        this.strength.value = this.getStrength() - shipTypes[shipType].cost;
        this.strength.time = time
        let moonX = this.getX()
        let moonY = this.getY()

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
        return launchedShip
    }       
}

module.exports = Moon