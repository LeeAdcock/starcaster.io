const EventEmitter = require('events');
const getUniqueID = require("../util/uniqueIdGenerator.js");

const Alliance = require('../types/alliance')
const User = require('../types/user')

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
        user.alliance = this.newAlliance()
        user.alliance.addUser(user)
        this.users[user.id] = user
        return user
    }

    getUser(userId) {        
        return this.users[userId]
    }
}

module.exports = new UserService()