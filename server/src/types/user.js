const getUniqueID = require("../util/uniqueIdGenerator.js");

class User {
    constructor() {
        this.id = getUniqueID()
        this.secret = getUniqueID() + getUniqueID() + "-" + getUniqueID()
    }

    toJSON() {
        return {
          id: this.id
        }
      }

    getAlliance() {
        return this.alliance
    }

    getId() {
        return this.id
    }

    getSecret() {
        return this.secret
    }

    setAlliance(newAlliance) {
        const oldAlliance = this.alliance

        if(oldAlliance.getId()!==newAlliance.getId()) {
            this.alliance = newAlliance
            newAlliance.addUser(this)
            oldAlliance.removeUser(this)
        }    
    }
}

module.exports = User