

class Databasetemplate {
    constructor() {
        this.versionnumber = 0.6;
        this.packmode = false;
        this.compressionactive = false;
        this.compressionscale = 800;
        this.__type = "Databasetemplate";
        this.projecturl = "";
        this.name = "Default Database";
        this.backgroundurl = "";
        this.content = {
            textEntries: [],
            nodes: []
        };
        this.nodescale = 1;
        this.availableicons = [
            './images/Tokens/House.png',
            './images/Tokens/PersonofInterest.png',
            './images/Tokens/Party.png',
            './images/Tokens/City.png',
            './images/Tokens/Outpost.png',
            './images/Tokens/Fortress.png',
            './images/Tokens/Ruins.png',
            './images/Tokens/Camp.png',
            './images/Tokens/Town.png',
            './images/Tokens/Flag.png',
            './images/Tokens/Cave.png'
        ];
        
        this.savedcopysettings = -1;
        this.opendocs = [];
        this.measurementscale = 1;
        this.measurementtype = 0; 
        this.distancelabel = 'custom';       
        this.packedimages = [];
        this.packedtokens = [];
        this.packedbackground= "";
    }
};

class DatabaseNodeentry {
    constructor() {
        this.id = "";
        this.location = { x: 0, y: 0 };
        this.documentref = "";
        this.locked = false;
        this.individualnodescale = null;
        this.tokenurl = './images/Tokens/House.png';
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
    SET_MOUSEMODE: 'set-mousemode',
    NOT_ON_MAP: 'not-on-map',
    REFRESH_DATABASE: 'refresh-database',
    REFRESH_DATABASE_COMPLETE: 'refresh-database-complete',
    REFRESH_PAGE: 'refresh-page',
    REQUEST_PATCHNOTES: 'request-patchnotes',
    REFRESH_HIERARCHY: 'refresh-hirearchy',
    REQUEST_HIERARCHY_REFRESH: 'request-hirearchy-refresh',
    UPDATE_HIERARCHY_ORDER: 'update-hierarchy-order',
    REFRESH_NODES: 'refresh-nodes',
    REQUEST_NODE_CONTEXT: 'request-node-context',
    REQUEST_EXTENDED_NODE_CONTEXT: 'request-extended-node-context',
    REQUEST_CLEAR_NODEPATH: 'request-clear-nodepath',
    PASTE_NODES: 'paste-nodes',
    REQUEST_PASTE_RESET: 'request-paste-reset',
    REFRESH_DOCUMENTS: 'refresh-documents',
    RELOAD_DOCUMENT: 'reload-document',
    DELETE_NODE: 'delete-node',
    VERIFY_NODE: 'verify-node',
    CHANGE_NODE_ICON: 'change-node-icon',
    SCALE_ALL_NODES: 'scale-all-nodes',
    SCALE_ONE_NODE: 'scale-one-node',
    CLEAR_NODE_SCALE: 'clear-node-scale',
    REQUEST_DOCUMENT_BYNODE: 'request-document-bynode',
    REQUEST_DOCUMENT_BYDOC: 'request-document-bydoc',
    SELECT_DOCUMENT: 'select-document',
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
    EDITOR_UPDATEICONS: 'editor-updateicons',
    EDITOR_DRAWINGSETTINGS: 'editor-drawingsettings',
    EDITOR_MEASUREMENTSETTINGS: 'editor-measurementsettings',
    EDITOR_NODESETTINGS: 'editor-nodesettings',
    EDITOR_IMPORTSPLINES: 'editor-importsplines',
    EDITOR_SET_OVERRIDEINDEX: 'editor-setoverrideindex',
    EDITOR_DELETE_SPLINE: 'editor-delete-spline',
    EDITOR_REQUEST_REFRESH: 'editor-request-refresh',
    TITLEBAR_OPEN_GENERATOR_WINDOW: 'titlebar-open-generator-window',
    SETGLOBAL_CHARGEN: 'setglobal-chargen',
    UPDATE_THEME: 'update-theme',
    EDITOR_SETPACK: 'editor-setpack',
    EDITOR_SETCOMPRESSION: 'editor-setcompression',
    EDITOR_CHECKBROKEN: 'editor-checkbroken',
    UPDATE_BROKENLINKS: 'update-brokenlinks',
    SEARCH_TITLES: 'search-titles',
    SEARCH_CONTENT: 'search-content',
    DISPLAY_PATCHNOTES: 'display-patchnotes',
    Databasetemplate,
    DatabaseNodeentry,
    DatabaseTextentry,
}