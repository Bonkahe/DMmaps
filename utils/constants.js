class Databasetemplate {
    constructor() {
        this.__type = "Databasetemplate";
        this.projecturl = "";
        this.name = "Default Database";
        this.backgroundurl = "";
        this.content = {
            textEntires: [],
            nodes: []
        };
    }
}
;

class DatabaseNodeentry {
    constructor() {
        this.id = "";
        this.location = { x: 0, y: 0 };
        this.documentrefs = [];
        this.locked = false;
    }
}
class DatabaseTextentry {
    constructor() {
        this.id = "";
        this.content = "";
    }
}

module.exports = {
    SAVE_MAP_TO_STORAGE: 'save-map-to-storage',
    CHANGE_MAP: 'change-map',
    CREATE_NEW_NODE: 'create-new-node',
    PROJECT_INITIALIZED: 'project-initialized',
    RESET_MAP: 'reset-map',
    REQUEST_NODE_CONTEXT: 'request-node-context',
    DELETE_NODE: 'delete-node',
    VERIFY_NODE: 'verify-node',
    TOGGLE_NODE: 'toggle-node',
    Databasetemplate,
    DatabaseNodeentry,
    DatabaseTextentry,
}