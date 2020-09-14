

class Databasetemplate {
    constructor() {
        this.versionnumber = 0.1;
        this.__type = "Databasetemplate";
        this.projecturl = "";
        this.name = "Default Database";
        this.backgroundurl = "";
        this.content = {
            textEntries: [],
            nodes: []
        };
        this.nodescale = 1;
    }
};

class DatabaseNodeentry {
    constructor() {
        this.id = "";
        this.location = { x: 0, y: 0 };
        this.documentref = "";
        this.locked = false;
        this.individualnodescale = null;
        this.tokenurl = "internaltoken0";
        this.nodetoken;
    }
}
class DatabaseTextentry {
    constructor() {
        this.parentid = "";
        this.id = "";
        this.name = "NewDocument";
        this.content = "";
        this.childdocuments = [];
        this.drawing = [];
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
    REQUEST_HIREARCHY_REFRESH: 'request-hirearchy-refrehs',
    REFRESH_NODES: 'refresh-nodes',
    REQUEST_NODE_CONTEXT: 'request-node-context',
    REQUEST_EXTENDED_NODE_CONTEXT: 'request-extended-node-context',
    DELETE_NODE: 'delete-node',
    VERIFY_NODE: 'verify-node',
    SCALE_ALL_NODES: 'scale-all-nodes',
    SCALE_ONE_NODE: 'scale-one-node',
    CLEAR_NODE_SCALE: 'clear-node-scale',
    REQUEST_DOCUMENT_BYNODE: 'request-document-bynode',
    REQUEST_DOCUMENT_BYDOC: 'request-document-bydoc',
    SAVE_DOCUMENT: 'save-document',
    NEW_DOCUMENT: 'new-document',
    CHILD_DOCUMENT: 'child-document',
    MAIN_TO_RENDER_SETFOCUS: 'main-to-render-setfocus',
    REMOVE_PARENT_DOCUMENT: 'remove-parent',
    DELETE_DOCUMENT: 'delete-document',
    COMPLETE_DOCUMENT_DELETE: 'complete-document-delete',
    TOGGLE_NODE: 'toggle-node',
    TITLEBAR_NEWPROJECT: 'titlebar-newproject',
    TITLEBAR_LOADPROJECT: 'titlebar-loadproject',
    TITLEBAR_SAVEPROJECT: 'titlebar-saveproject',
    TITLEBAR_SAVEASPROJECT: 'titlebar-saveasproject',
    TITLEBAR_CLOSE: 'titlebar-close',
    TITLEBAR_CHECKFORUPDATES: 'titlebar-checkforupdates',
    TITLEBAR_OPENWINDOW: 'titlebar-openwindow',
    RETRIEVE_VERSION: 'retrieve-version',
    NOTIFY_UPDATEDOWNLOADING: 'notify-updatedownloading',
    NOTIFY_UPDATECOMPLETE: 'notify-updatecomplete',
    NOTIFY_RESTART: 'notify-restart',
    NOTIFY_CURRENTVERSION: 'notify-currentversion',
    EDITOR_SELECTION: 'editor-docselected',
    EDITOR_INITIALIZED: 'editor-initialized',
    EDITOR_DRAWINGSETTINGS: 'editor-drawingsettings',
    EDITOR_NODESETTINGS: 'editor-nodesettings',
    EDITOR_IMPORTSPLINES: 'editor-importsplines',
    EDITOR_SET_OVERRIDEINDEX: 'editor-setoverrideindex',
    EDITOR_DELETE_SPLINE: 'editor-delete-spline',
    TITLEBAR_OPEN_GENERATOR_WINDOW: 'titlebar-open-generator-window',
    SETGLOBAL_CHARGEN: 'setglobal-chargen',
    Databasetemplate,
    DatabaseNodeentry,
    DatabaseTextentry,
}