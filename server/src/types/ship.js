const getUniqueID = require("../util/uniqueIdGenerator.js");
const shipTypes = require('./../constants/shipTypes')

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
    }

    launch(shipType, angle) {
        const time = (new Date()/1000)
        let shipX = this.getX()
        let shipY = this.getY()

        this.strength = this.getStrength() - shipTypes[shipType].cost;

        // todo move to galaxyService
        const launchedShip = new Ship(shipType)
        launchedShip.id = getUniqueID()
        launchedShip.lastTouch = time
        launchedShip.owner = this.getOwner()
        launchedShip.type = shipType
        launchedShip.x = shipX + (8 + Math.random() * 2) * Math.cos(angle)
        launchedShip.y = shipY + (8 + Math.random() * 2) * Math.sin(angle)
        launchedShip.angle.value = angle + (Math.random() * Math.PI) / 20 - Math.PI / 40
        launchedShip.angle.time = time
        launchedShip.carrierId = this.getId()
        return launchedShip
    }

}

module.exports = Ship