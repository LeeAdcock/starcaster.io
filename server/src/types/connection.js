const getUniqueID = require("../util/uniqueIdGenerator.js");

class Connection {
    constructor() {
        this.id = getUniqueID()
        this.user = null
        this.socket = null
    }

    getId() {
        return this.id
    }

    getUser() {
        return this.user
    }

    getSocket() {
        return this.socket
    }
}

module.exports = Connection