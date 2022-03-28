const EventEmitter = require('events');
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

class Alliance {
    constructor() {
        this.id = getUniqueID()
        this.users = []
    }

    getId() {
        return this.id
    }

    getUsers() {
        return this.users
    }

    addUser(user) {
        this.users.push(user)
        userService.emit("allianceUpdate", this)
    }

    removeUser(user) {
        this.users.splice(this.users.findIndex(allianceUser => allianceUser.getId() === user.getId()), 1)
        userService.emit("allianceUpdate", this)
    }

    hasUser(user){
        return this.users.find(allianceUser => allianceUser.getId() === user.getId())
    }
}

class UserService extends EventEmitter {

    constructor() {
        super()
        this.users = {}
        this.alliances = {}        
    }

    newAlliance() {
        const alliance = new Alliance()
        this.alliances[alliance.id] = alliance
        return alliance
    }

    getAlliance(allianceId) {
        return this.alliances[allianceId]
    }

    deleteAlliance(alliance) {
        delete this.alliances[alliance.getId()]
    }

    newUser() {
        const user = new User()
        user.id = getUniqueID()
        this.users[user.id] = user
        return user
    }

    getUser(userId) {        
        return this.users[userId]
    }
}

const userService = new UserService()
module.exports = {userService, User, Alliance}