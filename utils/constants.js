class Databasetemplate {
    constructor() {
        this.__type = "Databasetemplate";
        this.projecturl = "";
        this.name = "Default Database";
        this.backgroundurl = "";
        this.content = {
            textEntries: [],
            nodes: []
        };
    }
};

class DatabaseNodeentry {
    constructor() {
        this.id = "";
        this.location = { x: 0, y: 0 };
        this.documentref = "";
        this.locked = false;
    }
}
class DatabaseTextentry {
    constructor() {
        this.parentid = "";
        this.id = "";
        this.name = "NewDocument";
        this.content = "";
        this.childdocuments = [];
    }
}

module.exports = {
    SAVE_MAP_TO_STORAGE: 'save-map-to-storage',
    CHANGE_MAP: 'change-map',
    CREATE_NEW_NODE: 'create-new-node',
    PROJECT_INITIALIZED: 'project-initialized',
    RESET_MAP: 'reset-map',
    REFRESH_DATABASE: 'refresh-database',
    REFRESH_DATABASE_COMPLETE: 'refresh-database-complete',
    REFRESH_PAGE: 'refresh-page',
    REFRESH_HIREARCHY: 'refresh-hirearchy',
    REQUEST_NODE_CONTEXT: 'request-node-context',
    DELETE_NODE: 'delete-node',
    VERIFY_NODE: 'verify-node',
    REQUEST_DOCUMENT_BYNODE: 'request-document-bynode',
    REQUEST_DOCUMENT_BYDOC: 'request-document-bydoc',
    SAVE_DOCUMENT: 'save-document',
    NEW_DOCUMENT: 'new-document',
    CHILD_DOCUMENT: 'child-document',
    REMOVE_PARENT_DOCUMENT: 'remove-parent',
    DELETE_DOCUMENT: 'delete-document',
    COMPLETE_DOCUMENT_DELETE: 'complete-document-delete',
    TOGGLE_NODE: 'toggle-node',
    TOGGLE_TEXT_EDITOR: 'toggle-text-editor',
    TOGGLE_HIREARCHY: 'toggle-hirearchy',
    Databasetemplate,
    DatabaseNodeentry,
    DatabaseTextentry,
}