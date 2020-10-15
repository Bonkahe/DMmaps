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
    DatabaseTextentry,
    CHANGE_NODE_ICON,
    EDITOR_SELECTION,  
    EDITOR_INITIALIZED,
    EDITOR_UPDATEICONS,
    EDITOR_DRAWINGSETTINGS,
    EDITOR_MEASUREMENTSETTINGS,
    EDITOR_NODESETTINGS,
    EDITOR_IMPORTSPLINES,
    EDITOR_SET_OVERRIDEINDEX,
    EDITOR_DELETE_SPLINE,
    EDITOR_REQUEST_REFRESH,
    TITLEBAR_OPENWINDOW,
}  = require('../utils/constants');

/** -------------------- Variables --------------------- */

const primarywindow = remote.getGlobal ('textwindow');

var currentsplines = [];
var selectedspline = false;
var selectedindex;

var nodedisplay = document.getElementById('node-display');
var nodedisplaytooltip = document.getElementById('node-display-tooltip');


var zonedisplay = document.getElementById('zone-display');
var zonedisplaytooltip = document.getElementById('zone-display-tooltip');

/** -------------------- Buttons --------------------- */

/**nodes */
var defaultnodesizeRange = document.getElementById('basenodeRange');
var currentnodesizeRange = document.getElementById('currentnodeRange');
var nodescaleclearbtn = document.getElementById('clearbtn');

/**docs(drawing) */

var splinelist = document.getElementById('drawinglist');

//var allowdrawingBtn = document.getElementById('allowdrawingbtn');
var splinewidthRange = document.getElementById('Splinewidth');
var splinecolorSelector = document.getElementById('splinecolorbtn');
var enablefillBtn = document.getElementById('enablefillbtn');
var fillcolorSelector = document.getElementById('bgcolorbtn');
var deletesplineBtn = document.getElementById('deletebtn');

var initialdata = {
    //alloweddrawing: allowdrawingBtn.checked,
    currentcolor: splinecolorSelector.value,
    currentwidth: splinewidthRange.value,
    currentisfill: enablefillBtn.checked,
    currentfillstyle: fillcolorSelector.value
}

var nodetokenlist = [];
//var nodeiconholder = document.getElementById('nodeiconholder');
var nodeiconlist = document.getElementById('nodeicons');

var files = []

function initializeicons(){
    nodeiconlist.innerHTML = "";

    var originallength = files.length;
    for (var i = 0; i < files.length; i++)
    {
        files[i] = files[i].replace(/\\/g,"/");
        var li = document.createElement('div');
        var imgli = document.createElement('div');
        imgli.classList.add("nodedisplay");
        imgli.innerHTML += '<img src="' + files[i] +'"> ';


        imgli.setAttribute( 'onclick', 'nodeiconclicked("' + files[i] + '")');
        imgli.setAttribute('draggable', false);
        li.appendChild(imgli);
        

        if (i > 10)
        {
            var closeli = document.createElement('div');
            closeli.classList.add("deletenode");
            closeli.innerHTML += 'X';
            closeli.setAttribute( 'onclick', 'nodeicondeleted("' + i + '")');
            li.appendChild(closeli);
        }
        

        //li.innerHTML = '<img src="' + files[i] +'"> ' + (files[i].substring(files[i].lastIndexOf('/')+1)).split('.').slice(0, -1).join('.');
        

        nodeiconlist.appendChild(li);

        imageExists(files[i], i);   
    }

    if (originallength != files.length)
    {
        ipcRenderer.send(EDITOR_UPDATEICONS, files);
    }

    //add the plus mark.

    var li = document.createElement('div');
    var imgli = document.createElement('div');
    imgli.classList.add("nodedisplay");
    imgli.innerHTML += '<img src="images/Tokens/Addnew.png"> ';


    imgli.setAttribute( 'onclick', 'importIcon()');
    li.appendChild(imgli);
    imgli.setAttribute('draggable', false);

    nodeiconlist.appendChild(li);

    //nodeiconholder.src = files[0];
}

function nodeicondeleted(element)
{
    files.splice(element, 1);
    ipcRenderer.send(EDITOR_UPDATEICONS, files);
}

function nodeiconclicked(element)
{
    //send selected token url to renderer then from there to main.
    primarywindow.webContents.send (CHANGE_NODE_ICON, element);
}

function imageExists(url, index, callback) {
  var img = new Image();
  img.onload = function() { 
      //callback(true); 
    };
  img.onerror = function() { 
      files.splice(index,1);
      //callback(false);
     };
  img.src = url;
}
  

  /* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function importIcon(){
    getFileFromUser();
}

const getFileFromUser = async () => {
    let options = {
      title : "Load a Token", 
  
      defaultPath : ".",
      
      buttonLabel : "Import image",
      
      filters :[
        {name: 'Images', extensions: ['jpg', 'png', 'gif', 'svg']}
      ],
      properties: ['openFile']
    }
    let Remotewin = BrowserWindow.getFocusedWindow();
  
    //This operation is asynchronous and needs to be awaited
    const pickedfiles = await dialog.showOpenDialog(Remotewin, options, {
        // The Configuration object sets different properties on the Open File Dialog 
        properties: ['openFile']
    });
  
    // If we don't have any files, return early from the function
    if (!pickedfiles.filePaths[0]) {
        return;
    }
    
    
    files.push(pickedfiles.filePaths[0]);
    
    ipcRenderer.send(EDITOR_UPDATEICONS, files);
  }

function toggledropdown() {
    document.getElementById("nodeicondropdown").classList.toggle("show");
}

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
  
// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

nodeiconlist.onwheel = zoom;
function zoom(event) {
    event.preventDefault();
    nodeiconlist.scrollLeft += event.deltaY * -0.75;
    //scale += event.deltaY * -0.01;


}



/**Event Listeners */
Mousetrap.bind(['command+d', 'ctrl+d'], function() {
    primarywindow.webContents.send (EDITOR_SET_OVERRIDEINDEX, null);
    sethighlight(null);

    splinewidthRange.value = initialdata.currentwidth;
    splinecolorSelector.jscolor.fromString(initialdata.currentcolor);
    enablefillBtn.checked = initialdata.currentisfill;
    fillcolorSelector.jscolor.fromString(initialdata.currentfillstyle);
    return false;
});

Mousetrap.bind(['pageup', 'pagedown'], function(){
    return false;
})

Mousetrap.bind(['del'], function() {
    deletesplinebtnPressed();
    return false;
});

Mousetrap.bind(['command+w', 'ctrl+w', 'f3'], function() {
    ipcRenderer.send(TITLEBAR_OPENWINDOW); 
    return false;
  });
/*
document.getElementById("distanceRange").oninput = function(){
    document.getElementById("distanceOutput").value = Math.round(Math.exp((Math.log(1000)/100) * document.getElementById("distanceRange").value));
};
*/
defaultnodesizeRange.addEventListener(
    'input',
    function() { defaultnodesizeChange(Math.exp((Math.log(1000)/100) * this.value)); },
    false
);
currentnodesizeRange.addEventListener(
    'input',
    function() { currentnodesizeChange(Math.exp((Math.log(1000)/100) * this.value)); },
    false
);

nodescaleclearbtn.addEventListener(
    'click',
    function() { nodescaleclear(); },
    false
)


/*
allowdrawingBtn.addEventListener(
    'input',
    function() { allowdrawingChange(this); },
    false
);
*/
splinewidthRange.addEventListener(
    'input',
    function() { splinewidthChange(Math.exp((Math.log(1000)/100) * this.value)); },
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

deletesplineBtn.addEventListener(
    'click',
    function() {deletesplinebtnPressed(); },
    false
);

/**Event implementation */

function defaultnodesizeChange(e)
{
    e = e / 10;
    console.log(e);
    if (e === 0){e = 0.01;}
    var data = {
        currentdefaultnodescale: e,
    }
    sendnodedata(data);
}

function currentnodesizeChange(e)
{
    e = e / 10;
    if (e === 0){e = 0.01;}
    var data = {
        currentnodescale: e,
    }
    sendnodedata(data);
}

function nodescaleclear()
{
    var data = {
        clear: true
    }
    sendnodedata(data);
}

function allowdrawingChange(e)
{
    var data = {
        //alloweddrawing: e.checked
    }
    senddata(data);
}
function splinewidthChange(e)
{
    e = e / 4;
    if (e === 0){e = 0.1;}

    var data = {
        currentwidth: e,
    }
    senddata(data);
}
function splinecolorChange(e)
{
    var data = {
        currentcolor: e,
    }
    senddata(data);
}
function enablefillChange(e)
{
    var data = {
        currentisfill: e.checked,
    }
    senddata(data);
}
function fillcolorChange(e)
{
    var data = {
        currentfillstyle: e,
    }
    senddata(data);
}

function deletesplinebtnPressed()
{
    primarywindow.webContents.send (EDITOR_DELETE_SPLINE, );
}

function sendnodedata(data)
{
    primarywindow.webContents.send (EDITOR_NODESETTINGS, data);
}


function senddata(data)
{
    primarywindow.webContents.send (EDITOR_DRAWINGSETTINGS, data);
}

primarywindow.webContents.send (EDITOR_INITIALIZED, );

ipcRenderer.send(EDITOR_MEASUREMENTSETTINGS);



primarywindow.webContents.send (EDITOR_DRAWINGSETTINGS, initialdata);


/** -------------------- IPC BLOCK --------------------- */

ipcRenderer.on(EDITOR_IMPORTSPLINES, (event, data) => {
    currentsplines = data.drawings;
    selectedindex = data.index;
    rebuildsplinelist(data.drawings);    
})

ipcRenderer.on(EDITOR_REQUEST_REFRESH, (event, message) => {
    updanodeiconclickedatus();
})

ipcRenderer.on(EDITOR_MEASUREMENTSETTINGS, (event, message) => {
    if (message.currentdistancetype != null)
    {
        document.getElementById("currenttype").selectedIndex = message.currentdistancetype;
        document.getElementById("calibrationtype").selectedIndex = message.currentdistancetype;
    }
    
    if (message.icons != null)
    {
        files = message.icons;
        initializeicons();
    }
})


ipcRenderer.on(EDITOR_SELECTION, (event, data) => {
    //allowdrawingBtn.checked = false;
    if (data.docactive)
    {
        setzoneisplayactive();
    }
    else
    {
        setzoneisplayinactive();
    }

    if (data.nodeactive)
    {
        setnodedisplayactive();
    }
    else
    {
        setnodedisplayinactive();
    }
    /*
    if (data.nodeinternalscale != null)
    {
        currentnodesizeRange.value = data.nodeinternalscale;
    }
*/
    updanodeiconclickedatus();
})

/** ---------------- HELPER FUNCTIONS --------------------- */

function updanodeiconclickedatus()
{
    var senddata = {
        //alloweddrawing: allowdrawingBtn.checked,
        currentcolor: splinecolorSelector.value,
        currentwidth: splinewidthRange.value,
        currentisfill: enablefillBtn.checked,
        currentfillstyle: fillcolorSelector.value
    }
    primarywindow.webContents.send (EDITOR_DRAWINGSETTINGS, senddata);
}

function rebuildsplinelist(splineentries){
    splinelist.innerHTML = null;

    if (splineentries.length === 0)
    {
        return; //stops if theres no splines
    }

    var newhtml = '';
    for(var i = 0; i < splineentries.length; i++)
    {
        newhtml = newhtml + '<li Db-Path="' + i + '" onclick="splinebuttonpressed(' + i + ')">Spline #' + i + '</li>';
    }

    splinelist.innerHTML = newhtml;

    if (selectedindex != null)
    {
        sethighlight(selectedindex);
    }
}

function splinebuttonpressed(index)
{
    //allowdrawingBtn.checked = false;
    splinewidthRange.value = currentsplines[index].width;
    splinecolorSelector.jscolor.fromString(currentsplines[index].color);
    enablefillBtn.checked = currentsplines[index].isfill;
    fillcolorSelector.jscolor.fromString(currentsplines[index].fillstyle);

    //console.log(currentsplines);
    sethighlight(index);

    //currentsplines[i]

    primarywindow.webContents.send (EDITOR_SET_OVERRIDEINDEX, index);

    var newdata = {
        //alloweddrawing: allowdrawingBtn.checked,
        currentcolor: splinecolorSelector.value,
        currentwidth: splinewidthRange.value,
        currentisfill: enablefillBtn.checked,
        currentfillstyle: fillcolorSelector.value
    }

    senddata(newdata);
/*
    var data = {
        alloweddrawing: allowdrawingBtn.checked,
        currentwidth: splinewidthRange.value,
        currentcolor: splinecolorSelector.value,
        currentisfill: enablefillBtn.checked,
        currentfillstyle: fillcolorSelector.value,
    }
    senddata(data);
    */
}


function sethighlight(index)
{
    if (selectedindex != null)
    {
        document.querySelector('*[Db-Path="' + selectedindex + '"]').id = '';
    }

    selectedindex = index

    if (selectedindex != null)
    {
        document.querySelector('*[Db-Path="' + index + '"]').id = 'highlight';
    }
}


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