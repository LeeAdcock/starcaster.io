const getUniqueID = require("../util/uniqueIdGenerator.js");

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
    }

    removeUser(user) {
        this.users.splice(this.users.findIndex(allianceUser => allianceUser.getId() === user.getId()), 1)
    }

    hasUser(user){
        return this.users.find(allianceUser => allianceUser.getId() === user.getId())
    }
}

module.exports = Alliance