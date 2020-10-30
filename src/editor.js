const {remote, ipcRenderer} = require('electron');
const { Menu, MenuItem} = remote;
const { dialog, getCurrentWindow, BrowserWindow, screen } = require('electron').remote
const fs = require('fs');
const { renderer } = require('./renderer');
window.$ = window.jQuery = require('jquery');
const Split = require('split.js');
const customTitlebar = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');
const jscolor = require('./colorpicker/jscolor');
var glob = require("glob")

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
    EDITOR_MEASUREMENTSETTINGS,
}  = require('../utils/constants');

/** -------------------- Variables --------------------- */

const primarywindow = remote.getGlobal ('textwindow');

function displaycalibrationtools() {
    document.getElementById("calibration-tools").classList.toggle("displayhiddenoptions");
}

function confirmCalibration()
{
    var measurementtype = document.getElementById("calibrationtype").selectedIndex;
    var calibratedlength = parseFloat(document.getElementById("distance").value);
    if (calibratedlength == 0){calibratedlength = 1;}
    var measurementdata = {
        type: measurementtype,
        length: calibratedlength
    }
    displaycalibrationtools();
    primarywindow.webContents.send (EDITOR_MEASUREMENTSETTINGS, measurementdata);
    //send scale and scale type to render
}

function currenttypechanged()
{
    var measurementtype = parseFloat(document.getElementById("currenttype").value);
    var measurementdata = {
        type: measurementtype
    }
    primarywindow.webContents.send (EDITOR_MEASUREMENTSETTINGS, measurementdata);
}

ipcRenderer.send(EDITOR_MEASUREMENTSETTINGS);

ipcRenderer.on(EDITOR_MEASUREMENTSETTINGS, (event, message) => {
    if (message.currentdistancetype != null)
    {
        console.log("test");
        document.getElementById("currenttype").selectedIndex = message.currentdistancetype;
        document.getElementById("calibrationtype").selectedIndex = message.currentdistancetype;
    }
    
    if (message.icons != null)
    {
        files = message.icons;
        initializeicons();
    }
})