const getUniqueID = require("../util/uniqueIdGenerator.js");
const sunNames = require('./../constants/sunNames')
const Planet = require('./../types/planet')

class Sun {
    constructor() {
        this.id= getUniqueID()
        this.name= sunNames[Math.floor(Math.random() * sunNames.length)]
        this.x= Math.random() * 10000,
        this.y= Math.random() * 10000
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

module.exports = Sun