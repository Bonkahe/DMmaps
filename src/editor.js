const {remote, ipcRenderer} = require('electron');
const { Menu, MenuItem} = remote;
const { dialog, getCurrentWindow, BrowserWindow, screen } = require('electron').remote
const fs = require('fs');
const { renderer } = require('./renderer');
window.$ = window.jQuery = require('jquery');
const Split = require('split.js');
const customTitlebar = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');

window.addEventListener('DOMContentLoaded', () => {
    const titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#1a1918'),
        overflow: "hidden",
        titleHorizontalAlignment: "left"
    });
    var menu = new Menu();
    titlebar.updateMenu(menu);
    titlebar.updateTitle('Toolbox');
    //getversion();
})

const {
    DatabaseTextentry,
    EDITOR_SELECTION,  
    EDITOR_INITIALIZED,
}  = require('../utils/constants');
/** -------------------- Variables --------------------- */
const primarywindow = remote.getGlobal ('textwindow');
const nodedisplay = document.getElementById('node-display');
const docdisplay = document.getElementById('document-display');

const nodeiddisplay = document.getElementById('node-id-display');
const dociddisplay = document.getElementById('doc-id-display');

nodedisplay.style.display = "none";
docdisplay.style.display = "none";

/** -------------------- IPC BLOCK --------------------- */
primarywindow.webContents.send (EDITOR_INITIALIZED, );


/*
let range = document.getElementById("myRange");


range.addEventListener('input', function() {
    if (window1) window1.webContents.send (TEST_NODES, range.value / 50);
})
*/

/** */



ipcRenderer.on(EDITOR_SELECTION, (event, data) => {
    if (data.docid != null)
    {
        docdisplay.style.display = "block";
        dociddisplay.innerHTML = data.docid;
    }
    else
    {
        docdisplay.style.display = "none";
        dociddisplay.innerHTML = "";
    }

    if (data.nodeid != null)
    {
        nodedisplay.style.display = "block";
        nodeiddisplay.innerHTML = data.nodeid;
    }
    else
    {
        nodedisplay.style.display = "none";
        nodeiddisplay.innerHTML = "";
    }
})

/** ---------------- HELPER FUNCTIONS --------------------- */