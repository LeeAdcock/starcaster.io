const getUniqueID = require("../util/uniqueIdGenerator.js");
const Moon = require('./../types/moon')
const Ship = require('./../types/ship')
const shipTypes = require('./../constants/shipTypes')

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
        return Math.min(this.strength.max, this.strength.value + ((new Date()/1000) - this.strength.time) * this.strength.speed)
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
            return true
        }
        return false
    }    
    launch = (shipType, angle) => {
        const time = (new Date()/1000)
        let moonX = this.getX()
        let moonY = this.getY()

        this.strength.value = this.getStrength() - shipTypes[shipType].cost;
        this.strength.time = new Date()/1000

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
        launchedShip.planetId = this.getId()
        return launchedShip
    }      
}

module.exports = Planet