const {remote, ipcRenderer} = require('electron');
const { Menu, MenuItem} = remote;
const { dialog, getCurrentWindow, BrowserWindow, screen } = require('electron').remote
const fs = require('fs');
const { renderer } = require('./renderer');
window.$ = window.jQuery = require('jquery');
const Split = require('split.js');
const customTitlebar = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');
const { shell } = require('electron')
const {
  SAVE_MAP_TO_STORAGE,
  CHANGE_MAP,
  CREATE_NEW_NODE,
  PROJECT_INITIALIZED,
  RESET_MAP,
  SET_MOUSEMODE,
  NOT_ON_MAP,
  REFRESH_DATABASE,
  REFRESH_DATABASE_COMPLETE,
  REFRESH_PAGE,
  REFRESH_HIERARCHY,
  REQUEST_HIERARCHY_REFRESH,
  REQUEST_NODE_CONTEXT,
  REQUEST_EXTENDED_NODE_CONTEXT,
  REFRESH_DOCUMENTS,
  RELOAD_DOCUMENT,
  DELETE_NODE,
  VERIFY_NODE,
  CHANGE_NODE_ICON,
  SCALE_ALL_NODES,
  SCALE_ONE_NODE,
  CLEAR_NODE_SCALE,
  REQUEST_DOCUMENT_BYNODE,
  REQUEST_DOCUMENT_BYDOC,
  SAVE_DOCUMENT,
  NEW_DOCUMENT,
  SELECT_DOCUMENT,
  MAIN_TO_RENDER_SETFOCUS,
  CHILD_DOCUMENT,
  REMOVE_PARENT_DOCUMENT,
  DELETE_DOCUMENT,
  COMPLETE_DOCUMENT_DELETE,
  TOGGLE_NODE,
  TITLEBAR_NEWPROJECT,
  TITLEBAR_LOADPROJECT,
  TITLEBAR_SAVEPROJECT,
  TITLEBAR_SAVEASPROJECT,
  TITLEBAR_CLOSE,
  TITLEBAR_CHECKFORUPDATES,
  TITLEBAR_OPENWINDOW,
  RETRIEVE_VERSION,
  NOTIFY_UPDATEDOWNLOADING,
  NOTIFY_UPDATECOMPLETE,
  NOTIFY_RESTART,
  NOTIFY_CURRENTVERSION,
  DatabaseTextentry,
  EDITOR_INITIALIZED,  
  EDITOR_MEASUREMENTSETTINGS,
  EDITOR_UPDATEICONS,
  REFRESH_NODES,
  TITLEBAR_OPEN_GENERATOR_WINDOW,
  UPDATE_THEME,
  SEARCH_TITLES,
  SEARCH_CONTENT,
}  = require('../utils/constants');
const { start } = require('repl');
const { Titlebar } = require('custom-electron-titlebar');
const { data } = require('jquery');
const { measure } = require('custom-electron-titlebar/lib/common/dom');
//const { map } = require('jquery');
/** -------------------- Variables --------------------- */

var titlebar;
var editorwindow;

var styles = document.getElementById("styles");

/**Application Menu */

var menu;
var infodisplay;
var restartavailable = false;
var downloaddisplay;
var packtrue = false;

/**MapVariables */

/**
 * 0 - select mode
 * 1 - measure mode
 */
var mousemode = 0;
/** */

var dragselect = {
  startpoint: null,
  endpoint: null,
  render: false
}

var rightClickPosition;
var zoom = 1;
var textchanged = false;
var instance;
var node;
var deactivatepanning = false;

var nodelist = [];
var basenodescalelocked = 1.0;
var basenodescaleunlocked = 1.1;
var currentscale = 1.0;
//var nodetokenlist = [];

var mapdiv = document.getElementById('mapdiv');
var map = document.getElementById('map');

/**SplitVariables */
var previoustexteditorsize = 30;
var previoushierarchysize = 15;

/**TextEditorVariables */
var textelmnt = document.getElementById("textcontainer");
var texteditortitle = document.getElementById('texteditor-title');
var texteditortoolbar = document.getElementById('toolbar');
var toolbarheight;
var editorcontainer = document.getElementById('editor');
var texteditorcontainer = document.getElementById('textcontainer');
var caratindex;

/**Search variables */
var searchinput = document.getElementById("searchpanel");
var searchoutput = document.getElementById("searchcount");

/**hierarchyVariables */
var hierarchyelmnt = document.getElementById("hierarchycontainer");
var newdoc = false;
var doubleclick = false;
var hierarchylist = document.getElementById('hierarchylist');
var firstbar = document.getElementById('hierarchylist-removeparent');
var barsparent = document.getElementById('hierarchylist-container');
var columnwidth = 10;
var rowheight = 20;
var selecteddocid;
//var selectednodeid;
var selectednodes = [];
var column;
var row;
var columnrowcount;
var openednodes = [];
var textEntries = [];
var newhtml;

/**DrawingTools */
const canvas = document.getElementById('canvaswindow');
const canvascontext = canvas.getContext('2d');
var drawings = [];
var measurement = {
  points: [],
  endpoint: null,
  render: false,
  active: false,
  shiftheld: false
};
var shiftheld = false;

var milesdistancescale = 1;
var distancetype = {
  Mi: 1,
  Km: 1.60934,
  M: 1609.34
}

var currentdistancetype = 0;

let alloweddrawing = false;
let freedrawing = false;
let isDrawing = false;
let currentdrawing = 0;
let basedistance = 10;
let currentcolor = "#fff";
let currentwidth = 5;
let currentisfill = true;
let currentfillstyle = "rgba(32, 45, 21, 0.2)";
let overrideindex = null;


var documenttab = document.getElementById('btn-tab-documents');
var toolboxtab = document.getElementById('btn-tab-toolbox');

/**----------------IMPORTED EDITOR TOOLBOX---------------- */

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


var nodetokenlist = [];
//var nodeiconholder = document.getElementById('nodeiconholder');
var nodeiconlist = document.getElementById('nodeicons');


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

function importIcon(){
  TokengetFileFromUser();
}

const TokengetFileFromUser = async () => {
  let options = {
    title : "Load a Token", 

    defaultPath : ".",
    
    buttonLabel : "Import image",
    
    filters :[
      {name: 'Images', extensions: ['jpg', 'png', 'gif']}
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

    currentcolor = currentsplines[index].color;
    currentfillstyle = currentsplines[index].fillstyle;
    //console.log(currentsplines);
    sethighlight(index);

    //currentsplines[i]


    transferToolBoxToRender();
}

function sethighlight(index)
{
    if (selectedindex != null)
    {
        document.querySelector('*[Db-Path="' + selectedindex + '"]').id = '';
    }

    selectedindex = index;
    overrideindex = index;

    if (selectedindex != null)
    {
        document.querySelector('*[Db-Path="' + index + '"]').id = 'highlight';
    }
}



$(function() {
  $("body").click(function(e) {

    if (!$(e.target).closest("#hierarchylist").length)
    {
      if (searchselect)
      {
        ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
        searchselect = false;
        searchoutput.innerText = "";
        searchinput.value = "";
      }
    }

    if (e.target.id == "zone-display" || $(e.target).parents("#zone-display").length || e.target.classList.contains("jscolor-picker-wrap")|| $(e.target).parents(".jscolor-picker-wrap").length) {
      
    } else {
      sethighlight(null);
    }
  });
})

nodeiconlist.onwheel = zoom;
function zoom(event) {
    event.preventDefault();
    nodeiconlist.scrollLeft += event.deltaY * -0.75;
}

function updanodeiconclickedatus()
{
  transferToolBoxToRender();
}

function transferToolBoxToRender()
{
  currentwidth = splinewidthRange.value;
  currentisfill = enablefillBtn.checked;

  if (overrideindex != null)
  {
    textchanged = true;
    drawings[overrideindex].color = currentcolor;
    drawings[overrideindex].width = currentwidth;
    drawings[overrideindex].isfill = currentisfill;
    drawings[overrideindex].fillstyle = currentfillstyle;
    canvasRender();
  }
}


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

splinewidthRange.addEventListener(
  'input',
  function() { splinewidthChange(Math.exp((Math.log(1000)/100) * this.value)); },
  false
);
/*
splinecolorSelector.addEventListener(
  'change',
  function() { splinecolorChange(this.value); },
  false
);
*/
enablefillBtn.addEventListener(
  'input',
  function() { enablefillChange(this); },
  false
);
/*
fillcolorSelector.addEventListener(
  'change',
  function() { fillcolorChange(this.value); },
  false
);
*/
deletesplineBtn.addEventListener(
  'click',
  function() {
    if (drawings.length > 0 && overrideindex != null)
    {
      drawings.splice(overrideindex, 1);
      overrideindex = null;
      canvasRender();
      currentdrawing = drawings.length;
      var data = getexportabledrawings();

      currentsplines = data.drawings;
      selectedindex = data.index;
      rebuildsplinelist(data.drawings); 
    }
   },
  false
);

function nodeicondeleted(element)
{
  files.splice(element, 1);
  ipcRenderer.send(EDITOR_UPDATEICONS, files);
}

function nodeiconclicked(element)
{
  if (selectednodes.length > 0)
  {
    var maindata = {
      nodes: [],
      url: element
    };
    for (var i = 0; i < selectednodes.length; i++)
    {
      console.log("test");
      selectednodes[i].style.backgroundImage = 'url("'+ element +'")';
      maindata.nodes.push(selectednodes[i].getAttribute('node-db-path'));
    }
    ipcRenderer.send(CHANGE_NODE_ICON, maindata);
  }
}

function defaultnodesizeChange(e)
{
    e = e / 10;
    console.log(e);
    if (e === 0){e = 0.01;}
    rescalenodes(e);
    ipcRenderer.send(SCALE_ALL_NODES, e);
}

function currentnodesizeChange(e)
{
    e = e / 10;
    if (e === 0){e = 0.01;}
    rescaleselectednode(e);
}

function nodescaleclear()
{
  resetselectednode();
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
    splinelist.innerHTML = null;
}

function splinewidthChange(e)
{
  

    e = e / 4;
    if (e === 0){e = 0.1;}

    currentwidth = e;
    transferToolBoxToRender();
}
function splinecolorChange(e)
{
    currentcolor = e.toRGBAString();
    transferToolBoxToRender();
}
function enablefillChange(e)
{
    currentisfill = e;
    transferToolBoxToRender();
}
function fillcolorChange(e)
{
    currentfillstyle = e.toRGBAString();
    transferToolBoxToRender();
}


documenttab.addEventListener(
  'click',
  function() {
    DisplayToolbox();
  },
  false
);

function DisplayToolbox()
{
  document.getElementById('document-tab').style.display = "none";
  document.getElementById('toolbox-tab').style.display = "block";
}

toolboxtab.addEventListener(
  'click',
  function() {
    DisplayDocument();
  },
  false
);

function DisplayDocument()
{
  document.getElementById('document-tab').style.display = "block";
  document.getElementById('toolbox-tab').style.display = "none";
}


/**---------------------------------------Initialization------------------------------------ */

updanodeiconclickedatus();
editorwindow = remote.getGlobal ('editorwindow');


var splitinstance = Split(['.a','.b', '.c'], {
  sizes: [20, 55, 30],
  minSize: [0, 0 ,0],
  gutterSize: 20,
  snapOffset: 100,
  onDrag: function(sizes) {
    resizetextwindow();
  }
})
resizetextwindow(); //Ensures the text editor initializes at the correct size.
/**Ensures it stays at that size. */
window.addEventListener('resize', function(e){
  resizetextwindow();
})


map.onload = function () {
  resetmap();
}
/**Initializes Dragging the map */
dragElement(mapdiv);

/**Handles importing the token images*/
/*
var files = [
  './images/Tokens/home.png',
  './images/Tokens/PersonofInterest.png'
]

files.forEach(element => {
  nodetokenlist.push(element);
});
*/
ipcRenderer.send(REFRESH_PAGE);



/**Builds the menu for the application. */
window.addEventListener('DOMContentLoaded', () => {
  rebuildmenu();
})

function rebuildmenu(newmenuitem){
  titlebar = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#1a1918'),
    overflow: "hidden",
    titleHorizontalAlignment: "right"
  });

  menu = Menu.buildFromTemplate(template)
  if (newmenuitem){menu.append(newmenuitem);}

  titlebar.updateMenu(menu);
  titlebar.updateTitle(' ');

  var aTags = document.getElementsByClassName("menubar-menu-title");
  //document.getElementsByClassName("window-title")[0].style.margin = "0 0 0 auto";
  for (var i = 0; i < aTags.length; i++) {
    if (aTags[i].textContent == "output") {
      infodisplay = aTags[i];
      break;
    }
  }

  for (var i = 0; i < aTags.length; i++) {
    if (aTags[i].textContent == "animation") {
      downloaddisplay = aTags[i];
      break;
    }
  }

  infodisplay.innerHTML = "version:";
  downloaddisplay.innerHTML = "";

  downloaddisplay.className += " loader";
  //getversion();
}

const template = [
  {
     label: 'File',
     submenu: [
        {
           label: 'New Project',
           click: () => { ipcRenderer.send(TITLEBAR_NEWPROJECT); }
        },
        {
           label: 'Load Project',
           click: () => { ipcRenderer.send(TITLEBAR_LOADPROJECT); }
        },
        {
           label: 'Save Project',
           click: () => { ipcRenderer.send(TITLEBAR_SAVEPROJECT); },
           accelerator: 'CommandOrControl+S'
        },
        {
           label: 'Save Project As',
           click: () => { ipcRenderer.send(TITLEBAR_SAVEASPROJECT); },
           accelerator: 'CommandOrControl+Shift+S'
        },
        {
           type: 'separator'
        },
        {
           role: 'Close',
           click: () => { ipcRenderer.send(TITLEBAR_CLOSE); },
        }
     ]
  },
  {
    label: 'Window',
    submenu: [
       {
          label: 'Options window',
          click: () => { ipcRenderer.send(TITLEBAR_OPENWINDOW); },
          accelerator: 'CommandOrControl+W or F3'
       },
       {
         label: 'Character creator',
         click: () => { ipcRenderer.send(TITLEBAR_OPEN_GENERATOR_WINDOW);},
         accelerator: 'F5'
       }
    ]
  },
  {
     role: 'Help',
     submenu: [
        {
           label: 'Check for updates',
           click: () => { 
             ipcRenderer.send(TITLEBAR_CHECKFORUPDATES); 
             infodisplay.innerHTML = "Checking for updates... ";
             downloaddisplay.style.display = "block";
            }
        }
     ]
  },
  {
    label: 'Donate',
    enabled: true,
    click: () => {       
      $('#overlay').fadeIn(500);
    }
 },
  {
     label: '|',
     enabled: false
  },
  {
    label: "output",
    enabled: restartavailable,
    click: () => { 
      ipcRenderer.send(NOTIFY_RESTART); }
  },
  {
    label: "animation",
    enabled: false
  }
]

/**Handles Donation overlay */
$('#donatebtn').click(function() {
  shell.openExternal('https://www.paypal.com/paypalme/bonkahe?locale.x=en_US');
});

$('#close').click(function() {
  $('#overlay').fadeOut(500);
});

/**Handles clicking off the overlay to close it*/
document.getElementById('overlay').addEventListener('mousedown', e => {
  if (e.which != 1) { return;}
  $('#overlay').fadeOut(500);
});

/**Retrieves the version number. */
ipcRenderer.invoke(RETRIEVE_VERSION).then((result) => {
  if (result)
  {
    infodisplay.innerHTML = "version: " + result;
  }
  else{
    infodisplay.innerHTML = "no version number";
  }
})

/**Handles The options for the text editor menus */
var Embed = Quill.import('blots/embed');
var resize = Quill.import('modules/imageResize');
var Size = Quill.import('attributors/style/size');

Embed.whitelist = ['doclink', 'rt'];
class QuillRuby extends Embed {
    static create(value, top, body) {
        var node = super.create(value);
        node.setAttribute('contenteditable', false);
        node.setAttribute('db-path', value);
        node.setAttribute('onclick', 'hierarchybuttonpressed(' + value + ')')
        node.innerHTML = retrievename(value);

        return node;
    }
    static value(node){
        return {
            body: node.getAttribute('db-path'),
        };
    }
}

QuillRuby.blotName = 'doclink';
QuillRuby.className = 'quill-doclink';
QuillRuby.tagName = 'button';

Quill.register({'formats/doclink': QuillRuby}, true);
Quill.register(resize, true);

Size.whitelist = ['14px', '16px', '18px', '20px', '26px', '32px'];
Quill.register(Size, true);

var editor = new Quill('#editor', {
  modules: {
    toolbar: '#toolbar',
    imageResize: {modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]}
  },
  theme: 'snow'
});

/**Inserts the image import option into the text editors menu.*/
editor.getModule("toolbar").addHandler("image", imageHandler);



function imageHandler(image, callback) {
  var input = document.createElement("input");
  input.setAttribute("type", "file");
  input.click();
  // Listen upload local image and save to server
  input.onchange = () => {
      var file = input.files[0];
      var path = file.path.replace(/\\/g,"/");

      // file type is only image.
      if (/^image\//.test(file.type)) {
        insertToEditor(path);
        savetext();
      } else {
          console.warn("Only images can be uploaded here.");
      }
  };
}

function insertToEditor(url) {
  // push image url to editor.
  const range = editor.getSelection();
  editor.insertEmbed(range.index, "image", url, Quill.sources.USER);
}


/** ---------------- Canvas --------------------- */
/**
 * Exports All the drawings to a IPC friendly format
 */
function getexportabledrawings()
{
  var newdrawings = [];

  if (drawings.length > 0)
  {
    for (var i = 0; i < drawings.length; i++)
    {
      newdrawings.push(drawings[i].exportsaveable());      
    }
  }
  var data = {
    drawings: newdrawings,
    index: overrideindex
  }

  return data;
}

/**
 * 
 * @param {Points used when importing, override all points} points 
 * @param {Color of the lines} color 
 * @param {Width of the lines} width 
 * @param {Color of the fill regions} fillstyle 
 * @param {Whether or not the fill regions are active} isfill 
 */
class drawing {
  constructor(points, color, width, fillstyle, isfill) {
    this.points = points;
    this.color = color;
    this.width = width;
    this.isfill = isfill;
    this.fillstyle = fillstyle;
    var x = 0;
    var y = 0;

    this.draw = function () {
      if (this.points.length > 1) {
        this.x = this.points[0].x;
        this.y = this.points[0].y;
        canvascontext.moveTo(this.x, this.y);
        canvascontext.strokeStyle = this.color;
        canvascontext.lineWidth = this.width;
        canvascontext.fillStyle = this.fillstyle;
        canvascontext.beginPath();
        for (var i = 0; i < this.points.length; i++) {
          drawpolygon(this.points[i].x, this.points[i].y);
        }
        canvascontext.stroke();
        canvascontext.closePath();
        if (this.isfill) {
          canvascontext.fill();
        }
      }
    };

    function drawpolygon(x1, y1) {
      canvascontext.lineTo(x1, y1);
    }

    function drawLine(x1, y1, x2, y2) {
      canvascontext.beginPath();
      canvascontext.moveTo(x1, y1);
      canvascontext.lineTo(x2, y2);
      canvascontext.stroke();
      canvascontext.closePath();
    }

    this.drag = function (mousex, mousey) {
      if (this.points.length > 0) {
        canvascontext.strokeStyle = this.color;
        canvascontext.lineWidth = this.width;
        drawLine(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, mousex, mousey);
      }
    };

    this.addpoint = function (newx, newy) {
      var newpoint = {
        x: newx,
        y: newy
      };
      this.points.push(newpoint);
    };

    this.getDistanceFrom = function (x, y) {
      if (this.points.length > 0) {
        return getDistance(x, y, this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
      }
    };

    function getDistance(xA, yA, xB, yB) {
      var xDiff = xA - xB;
      var yDiff = yA - yB;
      return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }

    this.exportsaveable = function () {
      var newdrawing = {
        points: this.points,
        color: this.color,
        width: this.width,
        isfill: this.isfill,
        fillstyle: this.fillstyle
      };

      return newdrawing;
    };
  }
}

/**Called to complete the current drawing and iterate the drawing index, preparing for the next drawing, it also updates the toolbox with the new spline */
function finishdrawing(e)
{
  canvascontext.clearRect(0,0, canvas.width, canvas.height);
  for(var i = 0; i < drawings.length; i++)
  {
    drawings[i].draw();
  }

  currentdrawing += 1;
  isDrawing = false;  
  textchanged = true;

  var data = getexportabledrawings();
  currentsplines = data.drawings;
  selectedindex = data.index;
  rebuildsplinelist(data.drawings);  
}

/**Handles Actually drawing when moveing your mouse and clicking and dragging on the canvas */
canvas.addEventListener('mousedown', e => {
  if (e.which == 1) //left mousebutton
  {
    if(mousemode == 0) //select mode
    {
      if (!dragselect.render)
      {
        dragselect.startpoint = convertworldtodoccords(e.pageX,e.pageY);
        dragselect.endpoint = convertworldtodoccords(e.pageX,e.pageY);
        dragselect.render = true;
        return;
      }
    }
    else if (mousemode == 1) //measure mode
    {
      if (!doubleclick)
      {
        var delayInMilliseconds = 500; //1 second
        doubleclick = true;
        setTimeout(function() {
          doubleclick = false;
        }, delayInMilliseconds);
      }
      else if (measurement.shiftheld)
      {
        measurement.active = false;
        measurement.shiftheld = false;
        //measurement.endpoint = convertworldtodoccords(e.pageX,e.pageY);
        return;
      }

      if (!measurement.active)
      {
        measurement.points = [];

        measurement.render = true;    
        measurement.active = true;
      }

      if (measurement.points.length > 1 && !measurement.shiftheld)
      {
        measurement.active = false;
        return;
      }
      measurement.points.push(convertworldtodoccords(e.pageX,e.pageY));
      return;
    }    
  }

  if (e.which != 1 || selecteddocid === null || overrideindex != null) { return;}

  var coords = convertworldtodoccords(e.pageX,e.pageY);

  if (!isDrawing)
  {
    drawings.push(new drawing([], currentcolor, currentwidth, currentfillstyle, currentisfill));
    isDrawing = true;
  }
  

  drawings[currentdrawing].addpoint(coords.x, coords.y)
  freedrawing = true;
  textchanged = true;
});

mapdiv.addEventListener('mouseup', e => {
  freedrawing = false;

  if(mousemode == 0 && dragselect.render) //select mode
  {
    dragselect.render = false;
    dragselect.endpoint = convertworldtodoccords(e.pageX,e.pageY);
    //select what is contained.
    selectarea();
    canvasRender();
  }  
  else if (mousemode == 1 && measurement.active && !measurement.shiftheld)
  {
    measurement.active = false;
    measurement.endpoint = convertworldtodoccords(e.pageX,e.pageY);
  }
});

mapdiv.addEventListener('mousemove', e => {
  if(mousemode == 0 && dragselect.render) //select mode
  {
    dragselect.endpoint = convertworldtodoccords(e.pageX,e.pageY);

    canvasRender();
    return;
  }  
  else if (mousemode == 1 && measurement.active)
  {
    measurement.endpoint = convertworldtodoccords(e.pageX,e.pageY);

    canvasRender();
    return;
  }

  if (freedrawing === true){
    textchanged = true;
    var coords = convertworldtodoccords(e.pageX,e.pageY);

    if (drawings[currentdrawing].getDistanceFrom(coords.x, coords.y) > basedistance)
    {
      drawings[currentdrawing].addpoint(coords.x, coords.y)
      
      canvasRender();

      return;
    }
  }

  if (isDrawing === true) {
    var coords = convertworldtodoccords(e.pageX,e.pageY);

    canvasRender();

    drawings[currentdrawing].drag(coords.x, coords.y)    
    return;
  }
});

/**Helper that re-renders the entire canvas. */
function canvasRender()
{
  canvascontext.clearRect(0,0, canvas.width, canvas.height); //clears canvas prior to everything else.
  for(var i = 0; i < drawings.length; i++)
  {
    drawings[i].draw();
  }

  if (dragselect.render)
  {
    renderSelection();
  }

  if (measurement.render)
  {
    renderMeasurement();
  }
}

function renderSelection()
{
  if (dragselect.endpoint == null) {return;}
  canvascontext.strokeStyle = '#ffffff';
  canvascontext.beginPath();
  canvascontext.lineWidth = 1 * (1 / zoom);
  canvascontext.moveTo(dragselect.startpoint.x, dragselect.startpoint.y);
  canvascontext.lineTo(dragselect.startpoint.x, dragselect.endpoint.y);
  canvascontext.lineTo(dragselect.endpoint.x, dragselect.endpoint.y);
  canvascontext.lineTo(dragselect.endpoint.x, dragselect.startpoint.y);
  canvascontext.lineTo(dragselect.startpoint.x, dragselect.startpoint.y);
  canvascontext.stroke();
  canvascontext.closePath();  
}

function renderMeasurement()
{
  if ( measurement.endpoint == null) {return;}

  canvascontext.strokeStyle = '#1a1a1a';
  
  canvascontext.beginPath();
  canvascontext.lineWidth = 10 * (1 / zoom);
  canvascontext.moveTo(measurement.points[0].x, measurement.points[0].y);
  var totaldistance = 0;
  if ( measurement.points.length > 0)
  {    
    for (var i = 1; i < measurement.points.length; i++)
    {
      totaldistance += getdistance(measurement.points[i - 1].x,measurement.points[i].x,measurement.points[i - 1].y,measurement.points[i].y);
      canvascontext.lineTo(measurement.points[i].x, measurement.points[i].y);
    }
    
    totaldistance += getdistance(measurement.points[measurement.points.length - 1].x,measurement.endpoint.x,measurement.points[measurement.points.length - 1].y,measurement.endpoint.y);
  }
  else
  {
    totaldistance += getdistance(measurement.points[0].x,measurement.endpoint.x,measurement.points[0].y,measurement.endpoint.y);
  }

  canvascontext.lineTo(measurement.endpoint.x, measurement.endpoint.y);
  canvascontext.stroke();
  canvascontext.closePath();  

  totaldistance = round(totaldistance * (Object.values(distancetype)[currentdistancetype] * milesdistancescale), 2); 

  if (measurement.points.length > 1)
  {
    var textindex = measurement.points.length - 1;
    writeText(totaldistance,measurement.points[textindex].x, measurement.points[textindex].y,  measurement.endpoint.x, measurement.endpoint.y);
    writeText(totaldistance,measurement.points[0].x, measurement.points[0].y,  measurement.points[1].x, measurement.points[1].y);
  }
  else
  {
    writeText(totaldistance,measurement.points[0].x, measurement.points[0].y,  measurement.endpoint.x, measurement.endpoint.y);
  }
}

function writeText(distance, x1,y1,x2,y2)
{
  var angleDeg = Math.atan2(y1 - y2, x1 - x2) * 180 / Math.PI;
  if (angleDeg > 90 || angleDeg < -90)
  {
    angleDeg += 180;
  }

  var label = distance.toString() + " " + Object.keys(distancetype)[currentdistancetype];
  canvascontext.save();
  canvascontext.strokeStyle = '#1a1a1a';
  canvascontext.textAlign = "center";
  canvascontext.textBaseline = "middle";
  canvascontext.translate((x1 + x2) / 2, (y1 + y2) / 2 - 25);
  canvascontext.font = 'bold ' + (30 * (1 / zoom)) +'pt Ariel';
  canvascontext.rotate(angleDeg * Math.PI / 180);
  canvascontext.lineWidth = 5;
  canvascontext.strokeText(label, 0, 0);


  canvascontext.fillStyle = 'white';
  canvascontext.fillText(label, 0, 0);
  canvascontext.restore();
}

function getdistance(x1,x2,y1,y2)
{
  return Math.sqrt((x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2)); 
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}   

/** ------------------  END DRAWING ---------------------  */


/**Handles everything having to do with dropping links into the editor*/
editor.root.setAttribute('ondrop', 'textdrop(event)');
editor.root.setAttribute('ondragover', 'allowDrop(event)');
editor.on('text-change', function(delta, source) {
  textchanged = true;
});

/**Extensions for the editor, to allow it to take and give html */
// set html content
editor.setHTML = (html) => {
  editor.root.innerHTML = html;
};

// get html content
editor.getHTML = () => {
  return editor.root.innerHTML;
};

editor.insertHTML = (html) => {
  var range = editor.getSelection(true);
  editor.insert

  editor.insertEmbed(range.index, 'div', { id: date }, 'user');
  editor.setSelection(range.index + 1, Quill.sources.SILENT);
  $(html).insertAfter('#' + date);
  $('#' + date).remove();
};

/**Rebuilds the text window to match the remaining size in the div. */
function resizetextwindow()
{
  toolbarheight = texteditortoolbar.getBoundingClientRect().height + texteditortitle.getBoundingClientRect().height;
  editorcontainer.style.height = (texteditorcontainer.getBoundingClientRect().height  - (toolbarheight + 10)) + 'px';
}

/** -------------------------------- HOTKEYS ----------------------------- */

/**Stops the enter key from working in the titlebar.*/
$('div[contenteditable]').keydown(function(e) {
  // trap the return key being pressed
  if (e.keyCode === 13) {
      if (texteditortitle.contains(window.getSelection().getRangeAt(0).commonAncestorContainer))
      {
        savetext();
        return false;
      }
      // prevent the default behaviour of return key pressed
      return false;
  }
});

$(document).keydown(function (e) {
  if (e.keyCode == 16) {
      if (measurement.active){measurement.shiftheld = true;}
  }
});

$(document).keyup(function (e) {
  if (e.keyCode == 16) {
      //if (measurement.active){measurement.shiftheld = true;}
  }
});

Mousetrap.bind(['del'], function(){
  //console.log(document.activeElement.classList.contains("ql-editor"));
  
  if (selecteddocid != null && !document.activeElement.classList.contains("ql-editor") && document.activeElement != texteditortitle)
  {
    ipcRenderer.send(DELETE_DOCUMENT, selecteddocid);
    return false;
  }  
})

/**Had unwanted results, removed. */
Mousetrap.bind(['pageup', 'pagedown'], function(){
  return false;
})

Mousetrap.bind(['command+s', 'ctrl+s'], function() {
  ipcRenderer.send(TITLEBAR_SAVEPROJECT);
  return false;
});

Mousetrap.bind(['command+shift+s', 'ctrl+shift+s'], function() {
  ipcRenderer.send(TITLEBAR_SAVEASPROJECT);
  return false;
});

Mousetrap.bind(['command+e', 'ctrl+e', 'f2'], function() {
  toggletexteditor();
  return false;
});

Mousetrap.bind(['command+b', 'ctrl+b', 'f1'], function() {
  togglehierarchy();
  return false;
});

Mousetrap.bind(['command+d', 'ctrl+d'], function() {
  //highlightdecider(null);
  clearDocumentSelection();
  selectnodes([]);
  return false;
});

Mousetrap.bind(['command+w', 'ctrl+w', 'f3'], function() {
  ipcRenderer.send(TITLEBAR_OPENWINDOW); 
  return false;
});

Mousetrap.bind(['f5'], function() {
  ipcRenderer.send(TITLEBAR_OPEN_GENERATOR_WINDOW); 
  return false;
});

Mousetrap.prototype.stopCallback = function(e, element, combo) {
  return false;
}


/** ------------------------------ Event Listeners --------------------------- */

window.addEventListener('contextmenu', (e) => {
  if(isDrawing){
    e.preventDefault();
    finishdrawing(e);
    return;
  }
  var notonmap = false;
  if (e.pageX > textelmnt.getBoundingClientRect().left || e.pageX < hierarchyelmnt.getBoundingClientRect().right)
  {
    notonmap = true;
  }
  if (!notonmap)
  {
    rightClickPosition = {x: e.x, y: e.y}
    node = document.elementFromPoint(rightClickPosition.x, rightClickPosition.y);
    if (node.className == "node-icon")
    {
      if (selecteddocid != null)
      {
        var data = {
          nodeid:node.getAttribute("node-db-path"),
          docid:selecteddocid,
          nodes:[]
        }
        
        data.nodes.push(node.getAttribute("node-db-path"));
        /*
        for (var i in selectednodes)
        {
          data.nodes.push(selectednodes[i].getAttribute("node-db-path"));
        }
        */
        ipcRenderer.send(REQUEST_EXTENDED_NODE_CONTEXT, data);
        selectnodes({node});
        return;
      }
      else
      {
        var data = {
          nodes:[]
        }

        data.nodes.push(node.getAttribute("node-db-path"));
        /*
        for (var i in selectednodes)
        {
          data.nodes.push(selectednodes[i].getAttribute("node-db-path"));
        }
        */
        ipcRenderer.send(REQUEST_NODE_CONTEXT, data);
        selectnodes({node});
        return;
      }
    }
  }
  ipcRenderer.send(NOT_ON_MAP, notonmap);
}, false)

const backgroundload = document.getElementById('backgroundBtn');
backgroundload.onclick = e => {
  getFileFromUser();
};

const newdocbtn = document.getElementById('btn-newdoc');
newdocbtn.onclick = e => {
  newdoc = true;
  ipcRenderer.send(NEW_DOCUMENT, selecteddocid);
};

const deletdocbtn = document.getElementById('btn-deletedoc');
deletdocbtn.onclick = e => {
  if (selecteddocid != null && !document.activeElement.classList.contains("ql-editor") && document.activeElement != texteditortitle)
  {
    ipcRenderer.send(DELETE_DOCUMENT, selecteddocid);
  }
};

texteditortitle.addEventListener("input", function() {
  textchanged = true;
}, false);

texteditortitle.addEventListener('focusout', (event) => {
  savetext();   
});

/**Used to keep track of where you last selected in the text editor, to allow droping of links.*/
editor.onblur = function(){
  console.log(editor.getSelection());
};

editor.on('selection-change', function(range, oldRange, source) {
  if (range === null && oldRange !== null) {
    caratindex = oldRange;
  }
});

/** -------------------- IPC BLOCK ---------------------  */

/**
 * Recieves events from the other windows, as well as the main thread.
 */

ipcRenderer.on(REFRESH_DOCUMENTS, (event, message) => {
  editor.setHTML(editor.getHTML());
})

ipcRenderer.on(RELOAD_DOCUMENT, (event, message) => {
  loadtext(message)
  console.log(message);
})

ipcRenderer.on(NOTIFY_UPDATEDOWNLOADING, (event, message) => {
  infodisplay.innerHTML = message;
  downloaddisplay.style.display = "block";
})

ipcRenderer.on(NOTIFY_UPDATECOMPLETE, (event, message) => {

  if (message != null)
  {
    var delayInMilliseconds = 2000; //2 second

    setTimeout(function() {
      ipcRenderer.invoke(RETRIEVE_VERSION).then((result) => {
        downloaddisplay.style.display = "none";
        if (result)
        {
          infodisplay.innerHTML = "version: " + result;
        }
        else{
          infodisplay.innerHTML = "no version number";
        }
      })
    }, delayInMilliseconds);


    downloaddisplay.style.display = "none";
    infodisplay.innerHTML = "Save complete."
    return;
  }

  titlebar.dispose();
  var newmenuitem = new MenuItem({ 
    label: 'Restart', 
    click: () => { 
      savetext();
      ipcRenderer.send(NOTIFY_RESTART); 
    }
  })
  rebuildmenu(newmenuitem);
  downloaddisplay.style.display = "none";
  infodisplay.innerHTML = "Download Complete!";
})

ipcRenderer.on(NOTIFY_CURRENTVERSION, (event, message) => {
  ipcRenderer.invoke(RETRIEVE_VERSION).then((result) => {
    downloaddisplay.style.display = "none";
    if (result)
    {
      infodisplay.innerHTML = "version: " + result;
    }
    else{
      infodisplay.innerHTML = "no version number";
    }
  })
})

ipcRenderer.on(EDITOR_MEASUREMENTSETTINGS, (event, message) =>{
  if (message.icons != null)
  {
      files = message.icons;
      initializeicons();
  }

  
  if (measurement.render)
  {
    if (message.type != null){currentdistancetype = message.type;}

    if (message.length != null){
      var totaldistance = 0;
      if ( measurement.points.length > 0)
      {    
        for (var i = 1; i < measurement.points.length; i++)
        {
          totaldistance += getdistance(measurement.points[i - 1].x,measurement.points[i].x,measurement.points[i - 1].y,measurement.points[i].y);
          canvascontext.lineTo(measurement.points[i].x, measurement.points[i].y);
        }
        
        totaldistance += getdistance(measurement.points[measurement.points.length - 1].x,measurement.endpoint.x,measurement.points[measurement.points.length - 1].y,measurement.endpoint.y);
      }
      else
      {
        totaldistance += getdistance(measurement.points[0].x,measurement.endpoint.x,measurement.points[0].y,measurement.endpoint.y);
      }
      
      milesdistancescale = (message.length / totaldistance) / Object.values(distancetype)[currentdistancetype];
    }

    var newdata = {
      length: milesdistancescale,
      type: message.type
    }

    var editorupdatedata = {
      currentdistancetype: currentdistancetype
    }
    //document.getElementById("currenttype").selectedIndex = currentdistancetype;
    //document.getElementById("calibrationtype").selectedIndex = currentdistancetype;
    ipcRenderer.send(EDITOR_MEASUREMENTSETTINGS, newdata);
    editorwindow.webContents.send (EDITOR_MEASUREMENTSETTINGS, editorupdatedata);
    canvasRender();
  }

  if (measurement.packtrue != null)
  {
    packtrue = measurement.packtrue;
  }
})

ipcRenderer.on(EDITOR_INITIALIZED, (event) => {
  //selectionchanged(selecteddocid, selectednodeid);

  overrideindex = null;
  var data = getexportabledrawings();
  currentsplines = data.drawings;
  selectedindex = data.index;
  rebuildsplinelist(data.drawings);
})

ipcRenderer.on(REFRESH_NODES, (event, CurrentContent) =>{
  selecteddocid = null;
  document.querySelectorAll('.node-icon').forEach(function(a) {
    a.remove()
  })
  
  
  importnodes(CurrentContent);

  //selectnodes(selectednodes);

  rebuildhierarchy(CurrentContent.content);
})

/**Called when booting up any project. */
ipcRenderer.on(PROJECT_INITIALIZED, (event, CurrentContent) => {
  //Clear old variables that need clearing.
  openednodes = CurrentContent.opendocs;
  if (openednodes == null){openednodes = [];}

  selecteddocid = null;
  //selectednodeid = null;
  selectednodes = [];
  textchanged = false;
  overrideindex = null;
  currentscale = CurrentContent.nodescale;
  if ( currentscale == null){currentscale = 1.0;}

  milesdistancescale = CurrentContent.measurementscale;
  currentdistancetype = CurrentContent.measurementtype;

  files = CurrentContent.availableicons;
  initializeicons();

  //Clear nodes/text editor
  document.querySelectorAll('.node-icon').forEach(function(a) {
    a.remove()
  })  
  cleartexteditor();

  //Build hierarchy
  rebuildhierarchy(CurrentContent.content);

  const projecttitle = document.getElementById('project-title');
  projecttitle.innerHTML = "ProjectName: " + CurrentContent.name;
  if (CurrentContent.backgroundurl == "")
  {
    switchtonomap();
  }
  else
  {
    map.src = CurrentContent.backgroundurl;
    resetmap();
    
    switchtomap();
    importnodes(CurrentContent);
    //rescalenodes(currentscale);
  }
})

ipcRenderer.on(REFRESH_DATABASE, (event, message) => {
  savetext();
  ipcRenderer.send(REFRESH_DATABASE_COMPLETE);
})

ipcRenderer.on(RESET_MAP, (event, message) => {
  resetmap(); 
})

ipcRenderer.on(SET_MOUSEMODE, (event, message) =>{
  mousemode = message;
  if (mousemode != 1 && measurement.render)
  {
    measurement.render = false;    
    if (isDrawing){finishdrawing();}
    canvasRender();
  }
  if (mousemode == 1)
  {
    document.getElementById("cursorcontrol").style.cursor = "url(images/CursorMeasuringtool.png), help  ";
    if (isDrawing){finishdrawing();}
  }
  else if (mousemode == 2)
  {
    document.getElementById("cursorcontrol").style.cursor = "url(images/CursorSpline.png), help  ";
    DisplayToolbox();
  }
  else
  {
    document.getElementById("cursorcontrol").style.cursor = "auto";
  }
})



ipcRenderer.on(REFRESH_HIERARCHY, (event, message) =>{
  rebuildhierarchy(message);
})

ipcRenderer.on(CHANGE_MAP, (event, message) => {
  getFileFromUser();
})

ipcRenderer.on(CREATE_NEW_NODE, (event, message) => {
  newdoc = true;
  //console.log(message);
  mousecreatenode(rightClickPosition.x,rightClickPosition.y,message.id, message.documentref);
})

ipcRenderer.on(DELETE_NODE, (event, message) => {
  /*
  if (selectednodes.length > 0)
  {
    for (var i = 0; i < selectednodes.length; i++)
    {
      selectednodes[i].parentNode.removeChild(selectednodes[i]);
    }
    selectednodes = [];
  }
  */
  for (var i in selectednodes)
  {
    selectednodes[i].parentNode.removeChild(selectednodes[i]);
  }
  /*
  if (selectednodeid == node.getAttribute('node-db-path'))
  {
    selectednodeid = null;
  }
  node.parentNode.removeChild(node);
  */
  mapdiv.style.pointerEvents = 'auto';
})

ipcRenderer.on(COMPLETE_DOCUMENT_DELETE, (event, message) => {
  selecteddocid = null;
  cleartexteditor();
})

ipcRenderer.on(MAIN_TO_RENDER_SETFOCUS, (event, message) =>
{
  //highlightdecider(message);
})

ipcRenderer.on(TOGGLE_NODE, (event, message) => {
  togglenode(message.id, message.locked);
})

ipcRenderer.on(UPDATE_THEME, (event, data) => {
  loadSettings(data);
})

function loadSettings(data)
{
  var importeddata = data;

  styles.innerText = ":root{ --node-token-hue: hue-rotate( "+ importeddata.hueshift +"deg); --node-token-saturate: saturate(250%); --node-token-brightness: brightness(85%); --main-button-color: " + importeddata.primarycolor + "; --main-button-highlight: " + importeddata.primaryhighlight + "; --neg-button-color: " + importeddata.secondarycolor + "; --neg-button-highlight: "+ importeddata.secondaryhighlight + ";}";
}

/** -------------------- End region ---------------------  */



/** -------------------- Helper Functions ---------------------  */

/**
 * Handles everything with scaling and changing the tabs for hirerarchy and text editor.
 * @param {*The Sizes object to use as reference} sizes 
 * @param {*Which object to open} index 
 */
function open(sizes, index)
{
  if (index == 0)
  {
    if (sizes[0] > 10) {return;}
    sizes = [previoushierarchysize, ((100 - previoushierarchysize) - sizes[2]), sizes[2]];
  }
  else if(index == 1)
  {
    sizes[0,100,0];
  }
  else if (index == 2)
  {
    if (sizes[2] > 10) {return;}
    sizes = [sizes[0], ((100 - previoustexteditorsize) - sizes[0]), previoustexteditorsize];
  }

  splitinstance.setSizes(sizes);
  resizetextwindow();
}

function close(sizes, index)
{
  splitinstance.collapse(index);
  resizetextwindow();
}

function togglehierarchy()
{
  var sizes = splitinstance.getSizes();
  if (sizes[0] > 10)
  {
    previoushierarchysize = sizes[0];
    close(sizes, 0);
  }
  else
  {
    open(sizes,0);
  }
}

function toggletexteditor()
{
  var sizes = splitinstance.getSizes();
  if (sizes[2] > 10)
  {
    previoustexteditorsize = sizes[2];
    close(sizes, 2);
  }
  else
  {
    open(sizes,2);
  }
}
function opentexteditor()
{
  var sizes = splitinstance.getSizes();
  open(sizes, 2);
}

function closetexteditor()
{
  var sizes = splitinstance.getSizes();
  close(sizes,2);
}

/**Wipes the title and the text of the text editor */
function cleartexteditor()
{
  editor.setText('')
  texteditortitle.innerText = null;
  texteditortitle.setAttribute('db-path',null);
  ipcRenderer.send(SELECT_DOCUMENT, false);
}


/**Loads a document into the text editor, also pulls the splines and renders them. */
function loadtext(document)
{

  //console.log(selecteddocid + "--" + document.id);
  lasttext = document.content;
  //highlightdecider(document.id);
  opentexteditor();
  editor.setHTML(document.content);

  drawings = [];
  freedrawing = false;
  isDrawing = false;
  currentdrawing = 0;
  overrideindex = null;  

  if (document.drawing != null && document.drawing.length > 0)
  {
    for (var i = 0; i < document.drawing.length; i++)
    {
      drawings.push(new drawing(document.drawing[i].points, 
        document.drawing[i].color, 
        document.drawing[i].width, 
        document.drawing[i].fillstyle, 
        document.drawing[i].isfill));
    }
  }

  var data = getexportabledrawings();
  currentsplines = data.drawings;
  selectedindex = data.index;
  rebuildsplinelist(data.drawings);


  canvasRender()
  currentdrawing = drawings.length;

  var buttons = retrievebuttons(); //Gets any doclinks and sets their onclick to select the given documents.
  for (var i = 0; i < buttons.length; i++)
  {
    buttons[i].innerHTML = retrievename(buttons[i].getAttribute('db-path'));
    
    buttons[i].setAttribute('onclick', 'hierarchybuttonpressed(' + buttons[i].getAttribute('db-path') + ')')
  }

  texteditortitle.innerText = document.name;
  texteditortitle.setAttribute('db-path',document.id);
  

  var highlighteddoc = hierarchylist.querySelector('*[Db-Path="' + document.id + '"]');
  //console.log(highlighteddoc);
  if (highlighteddoc.hasAttribute("parent-index"))
  {
    //console.log("test");
    if (iterateallparents(parseFloat(highlighteddoc.getAttribute("parent-index"))))
    {
      //rebuildhierarchy(content);
      ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
    }
  }
  ipcRenderer.send(SELECT_DOCUMENT, true);
}

function loadtextsoft(document)
{
  
  lasttext = document.content;
  cleartexteditor();
  opentexteditor();
  editor.setHTML(document.content);

  drawings = [];
  freedrawing = false;
  isDrawing = false;
  currentdrawing = 0;
  overrideindex = null;  

  if (document.drawing != null && document.drawing.length > 0)
  {
    for (var i = 0; i < document.drawing.length; i++)
    {
      drawings.push(new drawing(document.drawing[i].points, 
        document.drawing[i].color, 
        document.drawing[i].width, 
        document.drawing[i].fillstyle, 
        document.drawing[i].isfill));
    }
  }
  
  var data = getexportabledrawings();
  currentsplines = data.drawings;
  selectedindex = data.index;
  rebuildsplinelist(data.drawings);


  canvasRender()
  currentdrawing = drawings.length;

  var buttons = retrievebuttons(); //Gets any doclinks and sets their onclick to select the given documents.
  for (var i = 0; i < buttons.length; i++)
  {
    buttons[i].innerHTML = retrievename(buttons[i].getAttribute('db-path'));
    
    buttons[i].setAttribute('onclick', 'hierarchybuttonpressed(' + buttons[i].getAttribute('db-path') + ')')
  }

  texteditortitle.innerText = document.name;
  texteditortitle.setAttribute('db-path',document.id);
  selectionchanged(document.id,null);
  

  var highlighteddoc = hierarchylist.querySelector('*[Db-Path="' + document.id + '"]');
  //console.log(highlighteddoc);
  if (highlighteddoc.hasAttribute("parent-index"))
  {
    //console.log("test");
    if (iterateallparents(parseFloat(highlighteddoc.getAttribute("parent-index"))))
    {
      //rebuildhierarchy(content);
      ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
    }
  }
}

function retrievebuttons()
{
  return document.getElementsByClassName('quill-doclink');
}


/**Exports the currently edited document to the database. */
function savetext (callback)
{
  if (textchanged == false)
  {
    //console.log("nothing to save")
    return false;
  }
  var newdoc = new DatabaseTextentry();
  newdoc.id = texteditortitle.getAttribute('db-path');
  newdoc.name = texteditortitle.innerText;
  newdoc.content = editor.getHTML();

  newdoc.drawing = getexportabledrawings().drawings;
  
  lasttext = newdoc.content;
  textchanged = false;

  ipcRenderer.invoke(SAVE_DOCUMENT, newdoc).then((result) => {
    if (result)
    {
      //console.log("Document saved successfully.")
    }
    else{
      //console.log("Unable to save document due to not valid id")
    }
  })
}

//Hides the launch page and opens the map.
function switchtomap()
{
  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'none';

  
  mapdiv.style.display = 'block';
}

//Hides the map and opens the launch page.
function switchtonomap()
{
  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'flex';


  mapdiv.style.display = 'none';
}

/**
 * Resets the map to the center of the screen and zooms to allow it to fit.
 */
function resetmap()
{
  if (instance == null)
  {
    return;
  }

  instance.forcezoom({
    widthx:window.innerWidth / 2,
    widthy:window.innerHeight / 2
  })
  
  var test = instance.getzoom(
    {
      deltaScale: -1
    }
  )
  zoom = test[0];
  canvas.width = map.width;
  canvas.height = map.height;
}

/**Given coordinates in world space it will pan the document to center those coordinates. */
function panto(x,y)
{
  var coords = convertdoctoworldcords(x,y);

  var newx = (((textelmnt.getBoundingClientRect().left - hierarchyelmnt.getBoundingClientRect().right) / 2) + hierarchyelmnt.getBoundingClientRect().right) - coords.x;
  var newy = (window.innerHeight / 2) - coords.y;

  //textelmnt.getBoundingClientRect().left || e.pageX < hierarchyelmnt.getBoundingClientRect().right

  instance.panBy({ 
    originX: newx, 
    originY: newy
  });
}


function importnodes(CurrentContent)
{
  //console.log(database.CurrentContent);
  CurrentContent.content.nodes.forEach(element => {
    createnode(element);
  });
}

/**Creates a node on the map from a saved node. */
function createnode(node)
{
  var img = document.createElement('button');
  var compass = document.createElement('div');
  compass.className = "node-compass";
  img.appendChild(compass);

  /*
  img.onmouseenter = function(event){
    if (event.target.getAttribute("locked") == "true")
    {
      return;
    }
    deactivatepanning = true
  };
  img.onmouseout = function(){
    deactivatepanning = false
  };
  */
  //console.log(node.tokenurl);

  if (node.tokenurl != null)
  {
    img.style.backgroundImage  = 'url("' + node.tokenurl + '")';
  }
  else
  {
    img.style.backgroundImage  = 'url("./images/Tokens/House.png")';
  }
  dragNode(img, mapdiv);
  //img.id = "node-icon";
  img.className = "node-icon";
  img.setAttribute("node-db-path", node.id)
  img.setAttribute("doc-db-path", node.documentref)
  img.setAttribute("locked", node.locked)
  //console.log(node.documentref);

  mapdiv.appendChild(img); 
    
  img.style.left = (node.location.x  + "px");
  img.style.top = (node.location.y  + "px");
  
  var myscale = currentscale;
  if (node.individualnodescale != null){
    myscale = node.individualnodescale;
    img.setAttribute("scaled",  myscale);
  }

  //console.log(myscale);

  if (node.locked)
  {
    img.style.transform = 'matrix(' + (myscale * basenodescalelocked) +', 0, 0, ' + (myscale * basenodescalelocked) +', 0, 0)';
  }
  else
  {
    img.style.transform = 'matrix(' + (myscale * basenodescaleunlocked) +', 0, 0, ' + (myscale * basenodescaleunlocked) +', 0, 0)';
  }

  nodelist.push(img);
}

/**Converts a Screen x and y to map coordinates */
function convertworldtodoccords(x,y)
{
  var modifiedzoom = 1 / zoom;

  
  var originx = mapdiv.getBoundingClientRect().left;
  var originy = mapdiv.getBoundingClientRect().top;
  
  var normalizedx = x - originx;
  var multipliednormalizedx = normalizedx * modifiedzoom;

  var normalizedy = y - originy;
  var multipliednormalizedy = normalizedy * modifiedzoom;
  
  var coords = {
    x: multipliednormalizedx,
    y: multipliednormalizedy
  }
  return coords;
}

/**Converts map coordinates to a screen x and y */
function convertdoctoworldcords(x,y)
{
  var modifiedzoom = 1 / zoom;

  x = parseFloat(x);
  y = parseFloat(y);
  
  var originx = mapdiv.getBoundingClientRect().left;
  var originy = mapdiv.getBoundingClientRect().top;
  
  var dividednormalizedx = x / modifiedzoom;
  var normalizedx = dividednormalizedx + originx;

  var dividednormalizedy = y / modifiedzoom;
  var normalizedy = dividednormalizedy + originy;
  
  var coords = {
    x: normalizedx,
    y: normalizedy
  }
  return coords;
}

/**Creates a brand new node at a given x and y, with a docid and nodeid */
function mousecreatenode(x,y, nodeid, docid)
{  
  var img = document.createElement('button');
  var compass = document.createElement('div');
  compass.className = "node-compass";
  img.appendChild(compass);
  /*
  img.onmouseenter = function(event){
    if (event.target.getAttribute("locked") == "true")
    {
      return;
    }
    deactivatepanning = true
  };
  img.onmouseout = function(){
    deactivatepanning = false
  };
  */
  img.style.backgroundImage  = "url('./images/Tokens/House.png')";

  dragNode(img, mapdiv);
  //img.id = "node-icon";
  img.setAttribute("node-db-path", nodeid)
  img.setAttribute("doc-db-path", docid)
  img.setAttribute("node-icon", 0)
  img.setAttribute("locked", "false")
  img.className = "node-icon";

  var coords = convertworldtodoccords(x,y);
  //console.log(coords);
  mapdiv.appendChild(img); 
    
  img.style.left = ((coords.x - 32)  + "px");
  img.style.top = ((coords.y - 32)  + "px");
  img.style.transform = 'matrix(' + (currentscale * basenodescaleunlocked) +', 0, 0, ' + (currentscale * basenodescaleunlocked) +', 0, 0)';

  var verifydata = {
    x:coords.x,
    y:coords.y,
    id:nodeid,
    parentid:selecteddocid,

  };
  
  ipcRenderer.send(VERIFY_NODE, verifydata); //Sends the nodes location to the database

  nodelist.push(img);
}

/**Rescales every node by a percent, ignores nodes which have a personal scaled attribute. */
function rescalenodes(scalepercent)
{
  currentscale = scalepercent;

  nodelist.forEach(function(element) {
    if (!element.getAttribute("scaled"))
    {
      if (element.getAttribute("locked"))
      {
        element.style.transform = 'matrix(' + (currentscale * basenodescaleunlocked) +', 0, 0, ' + (currentscale * basenodescaleunlocked) +', 0, 0)';
      }
      else
      {
        element.style.transform = 'matrix(' + (currentscale * basenodescalelocked) +', 0, 0, ' + (currentscale * basenodescalelocked) +', 0, 0)';
      }
    }
  })
}

/**Rescales the currently selected node by a percent. */
function rescaleselectednode(scalepercent)
{
  if (selectednodes.length == 0){return;}  

  var nodescaledata = {
    nodes: [],
    scale: scalepercent
  }

  for (var i in selectednodes)
  {
    nodescaledata.nodes.push(selectednodes[i].getAttribute('node-db-path'));

    if (selectednodes[i].getAttribute("locked"))
    {
      selectednodes[i].style.transform = 'matrix(' + (scalepercent * basenodescalelocked) +', 0, 0, ' + (scalepercent * basenodescalelocked) +', 0, 0)';
    }
    else
    {
      selectednodes[i].style.transform = 'matrix(' + (scalepercent * basenodescaleunlocked) +', 0, 0, ' + (scalepercent * basenodescaleunlocked) +', 0, 0)';
    }

    selectednodes[i].setAttribute("scaled", scalepercent);
  }
  /*
    var nodetoscale = document.querySelector('[node-db-path="' + selectednodeid +'"]');

    if (!nodetoscale){return;}
    if (nodetoscale.getAttribute("locked"))
    {
      nodetoscale.style.transform = 'matrix(' + (scalepercent * basenodescalelocked) +', 0, 0, ' + (scalepercent * basenodescalelocked) +', 0, 0)';
    }
    else
    {
      nodetoscale.style.transform = 'matrix(' + (scalepercent * basenodescaleunlocked) +', 0, 0, ' + (scalepercent * basenodescaleunlocked) +', 0, 0)';
    }

    nodetoscale.setAttribute("scaled", scalepercent);
    
    var nodescaledata = {
      id: selectednodeid,
      scale: scalepercent
    }
  */
  ipcRenderer.send(SCALE_ONE_NODE, nodescaledata);
}

/**Sets the selected node back to normal default scale. */
function resetselectednode()
{  
  var nodescaledata = {
    nodes: [],
    scale: null
  }
  for (var i in selectednodes)
  {
    nodescaledata.nodes.push(selectednodes[i].getAttribute('node-db-path'));

    if (selectednodes[i].locked)
    {
      selectednodes[i].style.transform = 'matrix(' + (currentscale * basenodescalelocked) +', 0, 0, ' + (currentscale * basenodescalelocked) +', 0, 0)';
    }
    else
    {
      selectednodes[i].style.transform = 'matrix(' + (currentscale * basenodescaleunlocked) +', 0, 0, ' + (currentscale * basenodescaleunlocked) +', 0, 0)';
    }

    selectednodes[i].removeAttribute("scaled");
  }

  ipcRenderer.send(SCALE_ONE_NODE, nodescaledata);
}

/**Locks or unlocks the selected node. */
function togglenode(id, locked)
{
  //console.log(id + "----" + locked);
  //var selectednodes[i] = document.querySelector('[node-db-path="' + id +'"]');
  for (var i in selectednodes)
  {
    selectednodes[i].setAttribute("locked", locked)

    var myscale = currentscale;
    if (selectednodes[i].hasAttribute("scaled")){
      myscale = selectednodes[i].getAttribute("scaled");
    }

    if (locked)
    {
      selectednodes[i].style.transform = 'matrix(' + (myscale * basenodescalelocked) +', 0, 0, ' + (myscale * basenodescalelocked) +', 0, 0)';
    }
    else
    {
      selectednodes[i].style.transform = 'matrix(' + (myscale * basenodescaleunlocked) +', 0, 0, ' + (myscale * basenodescaleunlocked) +', 0, 0)';
    }
  }
}

function selectarea()
{
  var lowcoords = {
    x: getlowest(dragselect.startpoint.x, dragselect.endpoint.x),
    y: getlowest(dragselect.startpoint.y, dragselect.endpoint.y)
  }

  var highcoords = {
    x: gethighest(dragselect.startpoint.x, dragselect.endpoint.x),
    y: gethighest(dragselect.startpoint.y, dragselect.endpoint.y)
  }

  var node_els = Array.from(document.querySelectorAll(".node-icon")).filter(el => 
    parseFloat(el.style.left) + 32 > lowcoords.x && 
    parseFloat(el.style.top) + 32  > lowcoords.y &&
    parseFloat(el.style.left) + 32 < highcoords.x &&
    parseFloat(el.style.top) + 32 < highcoords.y);
    
  if (node_els.length == 1 && node_els[0].getAttribute("doc-db-path") != null && node_els[0].getAttribute("doc-db-path") != '')
  {
      clearDocumentSelection();
      selectDocument(node_els[0].getAttribute("doc-db-path"));
      loadDocument();
      return;
  }
  else if (node_els.length == 0)
  {
    if (selectednodes.length > 0)
    {
      for (var i = 0; i < selectednodes.length; i++)
      {
        selectednodes[i].firstChild.classList.remove("node-compass-show");
        //unhighlight selectednodes[i]
        
      }
    }
    selectednodes = [];
    clearDocumentSelection();
  }
  selectnodes(node_els);  
}

function selectnodes(newnodes)
{
  if (selectednodes.length > 0)
  {
    for (var i = 0; i < selectednodes.length; i++)
    {
      selectednodes[i].firstChild.classList.remove("node-compass-show");
      //unhighlight selectednodes[i]
    }
  }

  selectednodes = newnodes;

  if (selectednodes.length > 0)
  {
    for (var i = 0; i < selectednodes.length; i++)
    {
      selectednodes[i].firstChild.classList.add("node-compass-show");
      //highlight selectednodes[i]
    }

    if (selectednodes.length > 0)
    {
        setnodedisplayactive();
    }
    else
    {
        setnodedisplayinactive();
    }
  }
  else
  {
    //clearDocumentSelection();
  }
}

function getlowest(num1, num2)
{
  if (num1 < num2)
  {
    return num1;
  }
  else
  {
    return num2;
  }
}

function gethighest(num1, num2)
{
  if (num1 > num2)
  {
    return num1;
  }
  else
  {
    return num2;
  }
}

/**Same thing as doc but for the node. */
function selectnode(buttonelmnt)
{  
  ipcRenderer.invoke(REQUEST_DOCUMENT_BYNODE, buttonelmnt.getAttribute("node-db-path")).then((result) => {
    if (result != null)
    {
      //console.log(result.content);
      savetext();
      loadtextsoft(result);
    }
  })  
}

/**Handles inputs into search function */

//searchinput.onchange = function(){search();};
var searchselect = false;
var searchtext = '';

function search()
{
  var curstring = searchinput.value;
  searchtext = curstring;
  console.log(searchtext);
  /*
  if (curstring == '')
  {
    ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
    searchselect = false;
    searchoutput.innerText = "";
    searchinput.innerText = "";
  }
  */
  ipcRenderer.send(SEARCH_TITLES, curstring);
}

ipcRenderer.on(SEARCH_TITLES, (event, content) =>{
  buildsearchhierarchy(content);
})

function buildsearchhierarchy(content)
{
  searchoutput.innerText = content.length;
  searchselect = true;
  //WipeVariables
  hierarchylist.innerHTML = null;
  $('.sub-bar').remove();
  $('.sub-tiles').remove();
  textEntries = [];


  textEntries = content;

  newhtml = '';

  var pattern = new RegExp('('+searchtext+')', 'gi');
  columnrowcount = [];
  for(var i = 0; i < textEntries.length; i++)
  {    

    newhtml = newhtml + '<li class="item" this-index="' + textEntries[i].id + '" Db-Path="' + textEntries[i].id + '" onclick="hierarchybuttonpressed(' + textEntries[i].id + ')">' + 
      textEntries[i].name.toString().replace(pattern, '<u>$1</u>') + '</li>';
  }

  hierarchylist.innerHTML = newhtml;
  firstbar.style.height = "0px";
}

/**Handles construction of the hierarchy */
function rebuildhierarchy(content)
{
  searchoutput.innerText = "";
  searchinput.value = "";
  //WipeVariables
  hierarchylist.innerHTML = null;
  $('.sub-bar').remove();
  $('.sub-tiles').remove();
  textEntries = [];


  textEntries = content.textEntries;

  newhtml = '';
  column = 0;
  row = 0;

  columnrowcount = [];
  for(var i = 0; i < textEntries.length; i++)
  {
    if (textEntries[i].parentid != "")
    {
      continue;
    }
    row = row + 1;
    
    var textinsert = '';
    if (textEntries[i].childdocuments != null && textEntries[i].childdocuments.length > 0)
    {
      if (openednodes.includes(textEntries[i].id))
      {
        textinsert = "<div class='hierarchylist-close sub-tiles' onclick='closechildren(this,event," + textEntries[i].id + ")'></div>";
      }
      else
      {
        textinsert = "<div class='hierarchylist-open sub-tiles' onclick='openchildren(event," + textEntries[i].id + ")'></div>";
      }
    }
    
    newhtml = newhtml + '<li class="item" draggable="true" ondragstart="drag(event)" ondrop="drop(event)" ondragleave="leave(event)" ondragover="allowDrop(event)" this-index="' + textEntries[i].id + '" Db-Path="' + textEntries[i].id + '" onclick="hierarchybuttonpressed(' + textEntries[i].id + ')">' +  textEntries[i].name + textinsert + '</li>';

    if (textEntries[i].childdocuments != null && textEntries[i].childdocuments.length > 0)
    {
      builddocs(textEntries, textEntries[i].childdocuments, textEntries[i].id);
    }

    column = 0;
    //newhtml = newhtml + '</li>';
  }

  //console.log(openednodes);

  hierarchylist.innerHTML = newhtml;
  
  //clearDocumentSelection()
  selectDocument(selecteddocid);


  //Hides anything that is a child and the parent is not opened.
  var x = hierarchylist.getElementsByClassName("itemchildren");
  for (var i = 0; i < x.length; i++) {
    if (x[i].hasAttribute("parent-index") && !openednodes.includes(parseFloat(x[i].getAttribute("parent-index"))))
    {
      x[i].style.display = "none";
      row--;
    }
  }

  //Handles the bar height on the left side for unparenting docs.
  if (textEntries.length > 0)
  {
    firstbar.style.height = (row * rowheight) - (rowheight / 2) + "px";
  }
  else
  {
    firstbar.style.height = "0px";
  }
  row = 0;

  if (newdoc)
  {
    hierarchybuttonpressed(textEntries[textEntries.length - 1].id);
  }

  //Rehighlights the selected document, if there is one.
  if (selecteddocid != null)
  {
    var highlighteddoc = hierarchylist.querySelector('*[Db-Path="' + selecteddocid + '"]');
    highlighteddoc.id = 'highlight';
  }
}
/*
function hidechildren(parentid, x)
{
  for (var i = 0; i < x.length; i++) {
    if (x[i].hasAttribute("parent-index") && parseInt(x[i].hasAttribute("parent-index")) == parentid)
    {
      if (x[i].hasAttribute("this-index") && !openednodes.includes(parseInt(x[i].getAttribute("this-index"))))
      {
        hidechildren(parseInt(x[i].getAttribute("this-index")),x);
      }
      x[i].style.display = "none";
      row--;
    }
  }
}

*/
function checkcontents(input, id)
{
  for (var i in input)
  {
    if (input[i] == id){return true;}
  }
  return false;
}

/**Loops through all children recursively building the html up further as it goes with the new li. */
function builddocs(textEntries, childEntries, parentindex)
{
  column = column + 1;
  columnrowcount.push(row);
  var newchildren = [];

  for(var i in childEntries)
  {
    var tempindex = textEntries.findIndex(x => x.id === parseFloat(childEntries[i]));
    if (tempindex > -1)
    {      
      newchildren.push(
        {index: tempindex,
         child: parseFloat(childEntries[i])});
    }
  }
  newchildren.sort(function(a, b) {
    return ((a.index < b.index) ? -1 : ((a.index == b.index) ? 0 : 1));
  });

  for (var i in newchildren)
  {
    for (var j = 0; j < textEntries.length; j++)
    {
      if (j != newchildren[i].index)
      {
        continue;
      }

      row = row + 1;

      var textinsert = '';
      var thisindex = '';
      if (textEntries[j].childdocuments != null && textEntries[j].childdocuments.length > 0)
      {
        thisindex = 'this-index="' + textEntries[j].id + '"';
        if (openednodes.includes(textEntries[j].id))
        {
          textinsert = "<div class='hierarchylist-close sub-tiles' onclick='closechildren(this,event," + textEntries[j].id + ")'></div>";
        }
        else
        {
          textinsert = "<div class='hierarchylist-open sub-tiles' onclick='openchildren(event," + textEntries[j].id + ")'></div>";
        }
      }

      newhtml = newhtml + '<li class="item itemchildren" draggable="true" ondragstart="drag(event)" ondrop="drop(event)" ondragleave="leave(event)" ondragover="allowDrop(event)"  ' + thisindex + ' parent-index="'+ parentindex + '" Db-Path="' + textEntries[j].id + '" onclick="hierarchybuttonpressed(' + textEntries[j].id + ')" style="margin-left: ' + ((column * columnwidth) + 10) + 'px;">' +  textEntries[j].name + textinsert + '</li>';

      if (textEntries[j].childdocuments != null && textEntries[j].childdocuments.length > 0)
      {
        builddocs(textEntries, textEntries[j].childdocuments, textEntries[j].id)
      }
      
      break;      
    }
  }
  
  //console.log(childEntries.length);
  column = column - 1;
  columnrowcount.pop();
  /*
  if (row > columnrowcount[columnrowcount.length - 1])
  {
    var newbar = document.createElement("div"); 
    newbar.classList.add("hierarchylist-bar");
    newbar.classList.add("sub-bar");
    newbar.id = columnrowcount[columnrowcount.length - 1] + "--" + row;
    
    newbar.style.top = columnrowcount[columnrowcount.length - 1] * rowheight + "px";
    newbar.style.left = (column * columnwidth + "px");
    newbar.style.height = ((row - columnrowcount[columnrowcount.length - 1]) * rowheight) - (rowheight / 2) + "px";
    barsparent.appendChild(newbar); 
  }
  */
}

/**
 *  NOTES
 *   each bar will need to be offset 
  left: (-4 + (10 * column))
  top: 20 * integer down the array we are.

  it's height will match the number of children * 20
  height = children count * 20 - 10 (to account for only going half way down to the last one)
 */

function openchildren(event, i)
{
  event.stopPropagation();
  openednodes.push(i);
  //console.log(i);
  //refresh hierarchy
  ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
}

function closechildren(element, event, i)
{
  event.stopPropagation();
  //console.log(i + " --- " + openednodes);
  const index = openednodes.indexOf(i);
  if (index > -1) {
    openednodes.splice(index, 1);
  }
  iterateallchildren(i); 
  //refresh hierarchy
  ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
}


function iterateallchildren(index)
{
  var x = hierarchylist.getElementsByClassName("itemchildren");
  for (var i = 0; i < x.length; i++) {
    if (x[i].hasAttribute("parent-index") && parseFloat(x[i].getAttribute("parent-index")) == index)
    {
      if (x[i].hasAttribute("this-index"))
      {
        const index = openednodes.indexOf(parseFloat(x[i].getAttribute("this-index")));
        if (index > -1) {
          openednodes.splice(index, 1);
        }
        iterateallchildren(parseFloat(x[i].getAttribute("this-index")));
      }
    }
  }
}

function iterateallparents(index)
{
  var thisreturn = false;
  var x = hierarchylist.getElementsByClassName("item");
  for (var i = 0; i < x.length; i++) {
    if (x[i].hasAttribute("this-index") && parseFloat(x[i].getAttribute("this-index")) == index)
    {
      const index = openednodes.indexOf(parseFloat(x[i].getAttribute("this-index")));
      if (index == -1) {
        openednodes.push(parseFloat(x[i].getAttribute("this-index")));
        thisreturn = true;
      }

      if (x[i].hasAttribute("parent-index"))
      {
        if (iterateallparents(parseFloat(x[i].getAttribute("parent-index"))))
        {
          thisreturn = true;
        }
      }

      break;
    }
  }
  return thisreturn;
}


function selectElementContents(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/**Handles the functions of clicking a document, also handles double clicking. */
function hierarchybuttonpressed(id)
{ 
  if (selecteddocid == id && doubleclick)
  {
    var elementclicked = hierarchylist.querySelector('*[Db-Path="' + selecteddocid + '"]');
    var childNode = elementclicked.querySelector('.sub-tiles');
    if(childNode)
    {
      childNode.click();
    }
    doubleclick = false;
  }
  else
  {
    if (selecteddocid != id)
    {
      clearDocumentSelection();
      DisplayDocument();
      selectDocument(id)
      loadDocument();

      if (searchselect)
      {
        ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
        searchselect = false;
        searchoutput.innerText = "";
        searchinput.innerText = "";
      }
    }
    var delayInMilliseconds = 500; //1 second
    doubleclick = true;
    setTimeout(function() {
      doubleclick = false;
    }, delayInMilliseconds);
  }
}

//Should handle dragging and dropping for the remove parent bar on the left, as well as document links within text.
function allowDrop(ev) {
  if (!ev.target.classList.contains("item"))
  {
    ev.preventDefault();
    return;
  }

  var delta = ev.clientY - ev.target.getBoundingClientRect().top;
  if (delta < 5)
  {
    ev.target.style.borderWidth  = "3px 0 0 0";
    ev.target.style.backgroundColor = "";
  }
  else if(delta > 15)
  {
    ev.target.style.borderWidth  = "0 0 3px 0";
    ev.target.style.backgroundColor = "";
  }
  else
  {
    ev.target.style.backgroundColor = "rgb(125, 128, 128)";
    ev.target.style.borderWidth  = "0 0 0 0";
  }
  
  ev.preventDefault();
}

function leave(ev) {
  ev.target.style.backgroundColor = "";
  ev.target.style.borderWidth  = "0 0 0 0";
}

function drag(ev) {
  ev.dataTransfer.setData("Db-Path", ev.target.getAttribute("Db-Path"));
}

function drop(ev) {
  ev.preventDefault();
  ev.target.style.backgroundColor = "";
  ev.target.style.borderWidth  = "0 0 0 0";

  var data = {
    child: parseFloat(ev.dataTransfer.getData("Db-Path")),
    parent: parseFloat(ev.target.getAttribute("Db-Path")),
    delta: ev.clientY - ev.target.getBoundingClientRect().top
  }

  if (data.child != data.parent)
  {
    ipcRenderer.send(CHILD_DOCUMENT, data);
  }
}

function parentlessdrop(ev){
  ev.preventDefault();
  var data = ev.dataTransfer.getData("Db-Path");

  ipcRenderer.send(REMOVE_PARENT_DOCUMENT, data);
}

//Allows for doclinks within the text editor.
function textdrop(ev){
  if (ev.dataTransfer.getData("Db-Path") != "")
  {
    ev.preventDefault();
  
    //Uses the doclink quill ruby construct to make a link which will then be openable using the onclick to select the given document.
    if (caratindex != null)
    {
      editor.setSelection(caratindex.index, 0);
      editor.insertEmbed(caratindex.index, 'doclink', ev.dataTransfer.getData("Db-Path"), Quill.sources.USER);
    }
    else
    {
      editor.insertEmbed(0, 'doclink', ev.dataTransfer.getData("Db-Path"), Quill.sources.USER);
    }
  }
}

function retrievename(id)
{
  var doc = hierarchylist.querySelector('*[Db-Path="' + id + '"]');
  if (doc != null)
  {
    return doc.innerText;
  }
  return "Document has no name...";
}



function clearDocumentSelection()
{
  if (selecteddocid != null)
  {
    var selecteddoc = hierarchylist.querySelector('*[Db-Path="' + selecteddocid + '"]');  

    if (selecteddoc != null)
    {
      selecteddoc.id = '';
    }
    
    selecteddocid = null;
  }  
/*
  var data = {
    docactive: false,
    nodeactive: (selectednodes.length > 0)
  }
*/
  if (selectednodes.length > 0)
  {
      setnodedisplayactive();
  }
  else
  {
      setnodedisplayinactive();
  }

  setzoneisplayinactive();

  //editorwindow.webContents.send(EDITOR_SELECTION, data); 
  savetext();
  cleartexteditor();

  drawings = [];
  freedrawing = false;
  isDrawing = false;
  currentdrawing = 0;
  overrideindex = null;  
}

function selectDocument(id)
{
  if(id == null){return;}

  
  var selecteddoc = hierarchylist.querySelector('*[Db-Path="' + id + '"]');

  if (selecteddoc == null)
  {
    return;
  }
  selecteddocid = id;
  selecteddoc.id = 'highlight';

  var data = {
    docactive: true
  }
  var foundnode = mapdiv.querySelector('*[doc-db-path="' + selecteddocid + '"]');
  if(foundnode){
    selectnodes([foundnode]);
    panto(foundnode.style.left, foundnode.style.top);
  }
  else
  {
    selectnodes([]);
  }

  setzoneisplayactive();
  if (selectednodes.length > 0)
  {
      setnodedisplayactive();
  }
  else
  {
      setnodedisplayinactive();
  }
  
}

/**Pulls data from the database and sets it to the text editor, if this is a new document (as per the newdoc variable) it will set the selection to the title */
function loadDocument()
{
  if (selecteddocid == null)
  {
    return;
  }
  //console.log(selecteddocid);
  ipcRenderer.invoke(REQUEST_DOCUMENT_BYDOC, selecteddocid).then((result) => {
    if (result != null)
    {
      loadtext(result);

      if (newdoc)
      {
        selectElementContents(texteditortitle);
        newdoc = false;
      }
    }
    else
    {
      console.log("No document attached to node.")
    }
  })
}



/**Loads the map on the render thread, probably needs to be moved to the Main thread.*/
const getFileFromUser = async () => {
  let options = {
    title : "Load a Map image", 

    defaultPath : ".",
    
    buttonLabel : "Import image",
    
    filters :[
      {name: 'Images', extensions: ['jpg', 'png', 'gif', 'svg']}
    ],
    properties: ['openFile']
  }
  let Remotewin = BrowserWindow.getFocusedWindow();

  //This operation is asynchronous and needs to be awaited
  const files = await dialog.showOpenDialog(Remotewin, options, {
      // The Configuration object sets different properties on the Open File Dialog 
      properties: ['openFile']
  });

  // If we don't have any files, return early from the function
  if (!files.filePaths[0]) {
      return;
  }
  ipcRenderer.invoke(SAVE_MAP_TO_STORAGE, files.filePaths[0]).then((result) => {
    if (result)
    {
      map.src = files.filePaths[0];      
      resetmap();

      switchtomap();
    }
    else
    {
      console.log("Unable to save map due to no database selected.")
    }
  })
}

/** -------------------- End region ---------------------  */


/** -------------------- Drag functionality ---------------------  */

function dragNode(buttonelmnt, parentelmnt){
  buttonelmnt.onmousedown = dragMouseDown;
  
  var mouseorigin, nodelocked = true, softlockdistance, selectednodesinfo;
  var scale;

  function dragMouseDown(e) {
    e = e || window.event;

    if (e.which == 2 || e.which == 3 || mousemode != 0)
    {
      return;
    }
    //console.log(buttonelmnt.getAttribute("locked"));
    
    e.preventDefault();


    if (buttonelmnt.getAttribute("locked") == "true")
    {
      if (buttonelmnt.getAttribute("doc-db-path") != null && buttonelmnt.getAttribute("doc-db-path") != '')
      {
        clearDocumentSelection();
        selectDocument(buttonelmnt.getAttribute("doc-db-path"));
        loadDocument();
      }
      else
      {
        clearDocumentSelection();
        selectnodes([buttonelmnt]);
        panto(buttonelmnt.style.left, buttonelmnt.style.top);
      }
      return;
    }
    
    selectednodesinfo = [];

    mouseorigin = {
      x: (e.clientX - 32),
      y: (e.clientY - 32)
    }
    
    scale = buttonelmnt.getAttribute("scaled");

    if (!scale){scale = currentscale;}
  
    softlockdistance = (32 * scale) * zoom;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    

    if (nodelocked)
    {
      //console.log(softlockdistance);
      //console.log(mouseorigin.x + " -- " + mouseorigin.y + " ----- x:" + (e.clientX - 32) + " -- y:" + (e.clientY - 32));
      if ((e.clientX - 32) - mouseorigin.x > softlockdistance 
      || (e.clientX - 32) - mouseorigin.x < -softlockdistance 
      || (e.clientY - 32) - mouseorigin.y > softlockdistance 
      || (e.clientY - 32) - mouseorigin.y < -softlockdistance)
      {
        //console.log("test");
        
        nodelocked = false;

        
        parentelmnt.style.pointerEvents = 'none';
        buttonelmnt.style.opacity= '0.6';

        document.body.appendChild(buttonelmnt);
        buttonelmnt.style.left = (e.clientX - 32) + "px";
        buttonelmnt.style.top = (e.clientY - 32) + "px";
        scale = buttonelmnt.getAttribute("scaled");

        if (!scale){scale = currentscale;}

        buttonelmnt.style.transform = `matrix(${zoom * ((basenodescaleunlocked + 0.1) * scale)}, 0, 0, ${zoom * ((basenodescaleunlocked + 0.1) * scale)}, 0, 0)`;
      }
    }

    if (!nodelocked)
    {
      buttonelmnt.style.left = (e.clientX - 32) + "px";
      buttonelmnt.style.top = (e.clientY - 32) + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    parentelmnt.style.pointerEvents = 'auto';
    buttonelmnt.style.opacity= '1.0';

    if (nodelocked)
    {
      if (buttonelmnt.getAttribute("doc-db-path") != null && buttonelmnt.getAttribute("doc-db-path") != '')
      {
        clearDocumentSelection();
        selectDocument(buttonelmnt.getAttribute("doc-db-path"));
        loadDocument();
      }
      else
      {
        clearDocumentSelection();
        selectnodes([buttonelmnt]);
        panto(buttonelmnt.style.left, buttonelmnt.style.top);
      }
      return;
    }

    nodelocked = true;

    var x = (parseFloat(buttonelmnt.style.left) + 32);
    var y = (parseFloat(buttonelmnt.style.top) + 32);

    scale = buttonelmnt.getAttribute("scaled");

    if (!scale){scale = currentscale;}

    buttonelmnt.style.transform = 'matrix(' + (scale * basenodescaleunlocked) +', 0, 0, ' + (scale * basenodescaleunlocked) +', 0, 0)';

    var modifiedzoom = 1 / zoom;

    var originx = parentelmnt.getBoundingClientRect().left;
    var originy = parentelmnt.getBoundingClientRect().top;
  
    var normalizedx = (x - originx);
    var multipliednormalizedx = (normalizedx * modifiedzoom) - 32;
  
    var normalizedy = (y - originy);
    var multipliednormalizedy = (normalizedy * modifiedzoom) - 32;

    parentelmnt.appendChild(buttonelmnt);

    buttonelmnt.style.left = (multipliednormalizedx  + "px");
    buttonelmnt.style.top = (multipliednormalizedy  + "px");

    //send data to main
    var mydata = {
      x:multipliednormalizedx,
      y:multipliednormalizedy,
      id:buttonelmnt.getAttribute("node-db-path")
    };
    ipcRenderer.send(VERIFY_NODE, mydata);
  }
}

function dragElement(elmnt) {
  
  instance = renderer({ scaleSensitivity: 10, minScale: .1, maxScale: 5, element: elmnt });
  resetmap();
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  var supportsWheel = false;

  // The function that will run when the events are triggered. 
  function DoSomething (e) {
    if (e.pageX > textelmnt.getBoundingClientRect().left || e.pageX < hierarchyelmnt.getBoundingClientRect().right || e.which === 1 || e.which === 3)
    {
      return;
    }

    if (e.type == "wheel") supportsWheel = true;
    else if (supportsWheel) return;

    instance.zoom({
      deltaScale: Math.sign(e.deltaY) > 0 ? -1 : 1,
      x: e.pageX,
      y: e.pageY
    });

    var test = instance.getzoom(
      {
        deltaScale: Math.sign(e.deltaY) > 0 ? -1 : 1
      }
    )
    zoom = test[0];
  }

  // Add the event listeners for each event.
  document.addEventListener('wheel', DoSomething);
  document.addEventListener('mousewheel', DoSomething);
  document.addEventListener('DOMMouseScroll', DoSomething);

  function dragMouseDown(e) {
    if (deactivatepanning || e.which === 1 || e.which === 3) {return;}
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    if (deactivatepanning) {return;}
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}



/** -------------------- End region ---------------------  */