const {remote, ipcRenderer} = require('electron');
const { Menu, MenuItem} = remote;
const { dialog, getCurrentWindow, BrowserWindow, screen } = require('electron').remote
const fs = require('fs');
const { renderer } = require('./renderer');
window.$ = window.jQuery = require('jquery');
const Split = require('split.js');
const customTitlebar = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');
//const jscolor = require('./colorpicker/jscolor.js');

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
    EDITOR_DRAWINGSETTINGS,
}  = require('../utils/constants');
/*
jscolor.presets.default = {
	format:'rgba', backgroundColor:'rgba(89,89,89,1)', 
	borderColor:'rgba(110,110,110,1)', mode:'HVS', 
	controlBorderColor:'rgba(128,128,128,1)', sliderSize:10
};
*/
/** -------------------- Variables --------------------- */
const primarywindow = remote.getGlobal ('textwindow');

var nodedisplay = document.getElementById('node-display');
var nodedisplaytooltip = document.getElementById('node-display-tooltip');


var zonedisplay = document.getElementById('zone-display');
var zonedisplaytooltip = document.getElementById('zone-display-tooltip');

/** -------------------- Buttons --------------------- */

/**nodes */
var defaultnodesizeRange = document.getElementById('basenodeRange');
var currentnodesizeRange = document.getElementById('currentnodeRange');

/**docs(drawing) */

var splinelist = document.getElementById('drawinglist');

var allowdrawingBtn = document.getElementById('allowdrawingbtn');
var splinewidthRange = document.getElementById('Splinewidth');
var splinecolorSelector = document.getElementById('splinecolorbtn');
var enablefillBtn = document.getElementById('enablefillbtn');
var fillcolorSelector = document.getElementById('bgcolorbtn');

/**Event Listeners */
defaultnodesizeRange.addEventListener(
    'input',
    function() { defaultnodesizeChange(this.value); },
    false
);
currentnodesizeRange.addEventListener(
    'input',
    function() { currentnodesizeChange(this.value); },
    false
);

allowdrawingBtn.addEventListener(
    'input',
    function() { allowdrawingChange(this); },
    false
);

splinewidthRange.addEventListener(
    'input',
    function() { splinewidthChange(this.value); },
    false
);

splinecolorSelector.addEventListener(
    'input',
    function() { splinecolorChange(this.value); },
    false
);

enablefillBtn.addEventListener(
    'input',
    function() { enablefillChange(this); },
    false
);

fillcolorSelector.addEventListener(
    'input',
    function() { fillcolorChange(this.value); },
    false
);

/**Event implementation */

function defaultnodesizeChange(e)
{
    console.log(e);
}

function currentnodesizeChange(e)
{
    console.log(e);
}

function allowdrawingChange(e)
{
    console.log(e.checked);
}
function splinewidthChange(e)
{
    console.log(e);
}
function splinecolorChange(e)
{
    console.log(e);
}
function enablefillChange(e)
{
    console.log(e.checked);
}
function fillcolorChange(e)
{
    console.log(e);
}


//const nodeiddisplay = document.getElementById('node-id-display');
//const dociddisplay = document.getElementById('doc-id-display');

//nodedisplay.style.display = "none";
//docdisplay.style.display = "none";

/** -------------------- IPC BLOCK --------------------- */
primarywindow.webContents.send (EDITOR_INITIALIZED, );


/*
let range = document.getElementById("myRange");


range.addEventListener('input', function() {
    if (window1) window1.webContents.send (TEST_NODES, range.value / 50);
})
*/

/** */

function setnodedisplayactive()
{
    nodedisplaytooltip.style.display = "none";
    nodedisplay.classList.remove('greyout');

}

function setnodedisplayinactive()
{
    nodedisplaytooltip.style.display = "block";
    nodedisplay.classList.add('greyout');
}
function setzoneisplayactive()
{
    zonedisplaytooltip.style.display = "none";
    zonedisplay.classList.remove('greyout');
}

function setzoneisplayinactive()
{
    zonedisplaytooltip.style.display = "block";
    zonedisplay.classList.add('greyout');
}




ipcRenderer.on(EDITOR_SELECTION, (event, data) => {
    if (data.docid != null)
    {
        setzoneisplayactive();
    }
    else
    {
        setzoneisplayinactive();
    }

    if (data.nodeid != null)
    {
        setnodedisplayactive();
    }
    else
    {
        setnodedisplayinactive();
    }
})

/** ---------------- HELPER FUNCTIONS --------------------- */