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
  NOT_ON_MAP,
  REFRESH_DATABASE,
  REFRESH_DATABASE_COMPLETE,
  REFRESH_PAGE,
  REFRESH_HIERARCHY,
  REQUEST_HIERARCHY_REFRESH,
  REQUEST_NODE_CONTEXT,
  REQUEST_EXTENDED_NODE_CONTEXT,
  DELETE_NODE,
  VERIFY_NODE,
  SCALE_ALL_NODES,
  SCALE_ONE_NODE,
  CLEAR_NODE_SCALE,
  REQUEST_DOCUMENT_BYNODE,
  REQUEST_DOCUMENT_BYDOC,
  SAVE_DOCUMENT,
  NEW_DOCUMENT,
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
  EDITOR_SELECTION,
  EDITOR_INITIALIZED,  
  EDITOR_DRAWINGSETTINGS,
  EDITOR_NODESETTINGS,
  EDITOR_IMPORTSPLINES,
  EDITOR_SET_OVERRIDEINDEX,
  EDITOR_DELETE_SPLINE,
  EDITOR_REQUEST_REFRESH,
  REFRESH_NODES,
  TITLEBAR_OPEN_GENERATOR_WINDOW,
}  = require('../utils/constants');
const { start } = require('repl');
const { Titlebar } = require('custom-electron-titlebar');
const { data } = require('jquery');
//const { map } = require('jquery');
/** -------------------- Variables --------------------- */

var titlebar;
var editorwindow;

/**Application Menu */

var menu;
var infodisplay;
var restartavailable = false;
var downloaddisplay;

/**MapVariables */
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
var nodetokenlist = [];

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
var selectednodeid;
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



/**---------------------------------------Initialization------------------------------------ */

editorwindow = remote.getGlobal ('editorwindow'); //grabs the editor if it exists.
if (editorwindow)
{
  editorwindow.webContents.send (EDITOR_REQUEST_REFRESH);
}

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
var files = [
  './images/Tokens/home.png',
  './images/Tokens/PersonofInterest.png'
]

files.forEach(element => {
  nodetokenlist.push(element);
});

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
          label: 'Editor window',
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
  editorwindow.webContents.send (EDITOR_IMPORTSPLINES, getexportabledrawings());
}

/**Handles Actually drawing when moveing your mouse and clicking and dragging on the canvas */
canvas.addEventListener('mousedown', e => {
  if (e.which != 1 || selecteddocid === null || alloweddrawing === false || overrideindex != null) { return;}

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

canvas.addEventListener('mouseup', e => {
  freedrawing = false;
});

canvas.addEventListener('mousemove', e => {
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
  canvascontext.clearRect(0,0, canvas.width, canvas.height);
  for(var i = 0; i < drawings.length; i++)
  {
    drawings[i].draw();
  }
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
  highlightdecider(null, null);
  savetext();
  drawings = [];
  freedrawing = false;
  isDrawing = false;
  currentdrawing = 0;
  overrideindex = null;
  canvasRender();
  
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
          docid:selecteddocid
        }
        
        ipcRenderer.send(REQUEST_EXTENDED_NODE_CONTEXT, data);
        return;
      }
      else
      {
        ipcRenderer.send(REQUEST_NODE_CONTEXT, node.getAttribute("node-db-path"));
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
  if (selecteddocid != null)
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
  infodisplay.innerHTML = "Download Complete!"
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

ipcRenderer.on(EDITOR_NODESETTINGS, (event, data) => {
  if (data.currentdefaultnodescale != null){ 
    rescalenodes(data.currentdefaultnodescale);
    ipcRenderer.send(SCALE_ALL_NODES, data.currentdefaultnodescale);
  }
  if (data.currentnodescale != null){
    rescaleselectednode(data.currentnodescale);
  }

  if (data.clear != null){
    resetselectednode();
    ipcRenderer.send(CLEAR_NODE_SCALE);
  }
})

ipcRenderer.on(EDITOR_DRAWINGSETTINGS, (event, data) => {
  if (data.alloweddrawing != null){ 
    alloweddrawing = data.alloweddrawing;
    if (!alloweddrawing && isDrawing){
      finishdrawing();
    }
  }
  if (data.currentcolor != null){currentcolor = data.currentcolor;}
  if (data.currentwidth != null){currentwidth = (data.currentwidth);}
  if (data.currentisfill != null){currentisfill = data.currentisfill;}
  if (data.currentfillstyle != null){currentfillstyle = data.currentfillstyle;}

  if (overrideindex != null)
  {
    textchanged = true;
    drawings[overrideindex].color = currentcolor;
    drawings[overrideindex].width = currentwidth;
    drawings[overrideindex].isfill = currentisfill;
    drawings[overrideindex].fillstyle = currentfillstyle;
    canvasRender();
  }
})

ipcRenderer.on(EDITOR_SET_OVERRIDEINDEX, (event, newoverride) => {
  if (isDrawing)
  {
    finishdrawing();
  }
  overrideindex = newoverride;
  editorwindow.webContents.send (EDITOR_IMPORTSPLINES, getexportabledrawings());
})

ipcRenderer.on(EDITOR_DELETE_SPLINE, (event, message) => {
  if (drawings.length > 0 && overrideindex != null)
  {
    drawings.splice(overrideindex, 1);
    overrideindex = null;
    canvasRender();
    currentdrawing = drawings.length;
    editorwindow.webContents.send (EDITOR_IMPORTSPLINES, getexportabledrawings());
  }
})

ipcRenderer.on(EDITOR_INITIALIZED, (event) => {
  selectionchanged(selecteddocid, selectednodeid);
  editorwindow = remote.getGlobal ('editorwindow');

  if (editorwindow)
  {
    overrideindex = null;
    editorwindow.webContents.send (EDITOR_IMPORTSPLINES, getexportabledrawings());
  }
})

ipcRenderer.on(REFRESH_NODES, (event, CurrentContent) =>{
  selecteddocid = null;
  document.querySelectorAll('.node-icon').forEach(function(a) {
    a.remove()
  })
  
  importnodes(CurrentContent);

  rebuildhierarchy(CurrentContent.content);
})

/**Called when booting up any project. */
ipcRenderer.on(PROJECT_INITIALIZED, (event, CurrentContent) => {
  //Clear old variables that need clearing.
  openednodes = CurrentContent.opendocs;
  if (openednodes == null){openednodes = [];}

  selecteddocid = null;
  selectednodeid = null;
  textchanged = false;
  overrideindex = null;
  currentscale = CurrentContent.nodescale;
  if ( currentscale == null){currentscale = 1.0;}


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
  ipcRenderer.send(REFRESH_DATABASE_COMPLETE);
})

ipcRenderer.on(RESET_MAP, (event, message) => {
  resetmap(); 
})

ipcRenderer.on(REFRESH_HIERARCHY, (event, message) =>{
  rebuildhierarchy(message);
})

ipcRenderer.on(CHANGE_MAP, (event, message) => {
  getFileFromUser();
})

ipcRenderer.on(CREATE_NEW_NODE, (event, message) => {
  newdoc = true;
  console.log(message);
  mousecreatenode(rightClickPosition.x,rightClickPosition.y,message.id, message.documentref);
})

ipcRenderer.on(DELETE_NODE, (event, message) => {
  if (selectednodeid == node.getAttribute('node-db-path'))
  {
    selectednodeid = null;
  }
  node.parentNode.removeChild(node);
  mapdiv.style.pointerEvents = 'auto';
})

ipcRenderer.on(COMPLETE_DOCUMENT_DELETE, (event, message) => {
  selecteddocid = null;
  cleartexteditor();
})

ipcRenderer.on(MAIN_TO_RENDER_SETFOCUS, (event, message) =>
{
  selectionchanged(message, null);
})

ipcRenderer.on(TOGGLE_NODE, (event, message) => {
  togglenode(message.id, message.locked);
})

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
}


/**Loads a document into the text editor, also pulls the splines and renders them. */
function loadtext(document)
{
  lasttext = document.content;
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
  
  if (editorwindow)
  {
      editorwindow.webContents.send (EDITOR_IMPORTSPLINES, getexportabledrawings()); //updates the editor if it exists.
  }


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
  highlightdecider(document.id, null);

  var highlighteddoc = hierarchylist.querySelector('*[Db-Path="' + selecteddocid + '"]');
  //console.log(highlighteddoc);
  if (highlighteddoc.hasAttribute("parent-index"))
  {
    //console.log("test");
    if (iterateallparents(parseInt(highlighteddoc.getAttribute("parent-index"))))
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

  if (node.documentref == 3106.5563661542183)
  {
    console.log(node);
  }
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
  if (node.nodetoken != null)
  {
    if (isNaN(node.nodetoken))
    {
      img.style.backgroundImage  = "url('" + node.nodetoken + "')";
    }
    else
    {
      img.style.backgroundImage  = "url('" + nodetokenlist[node.nodetoken] + "')";
    }
    img.setAttribute("node-icon", node.nodetoken)
  }
  else
  {
    img.style.backgroundImage  = "url('" + nodetokenlist[0] + "')";
    img.setAttribute("node-icon", 0)
  }
  dragNode(img, mapdiv);
  //img.id = "node-icon";
  img.className = "node-icon";
  img.setAttribute("node-db-path", node.id)
  img.setAttribute("doc-db-path", node.documentref)
  img.setAttribute("locked", node.locked)

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
  if (nodetokenlist.length > 0)
  {
    img.style.backgroundImage  = "url('" + nodetokenlist[0] + "')";
  }

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
    parentid:selecteddocid
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
  if (!selectednodeid){return;}  
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
  ipcRenderer.send(SCALE_ONE_NODE, nodescaledata);
}

/**Sets the selected node back to normal default scale. */
function resetselectednode()
{
  var nodescaledata = {
    id: selectednodeid,
    scale: null
  }

  ipcRenderer.send(SCALE_ONE_NODE, nodescaledata);
}

/**Locks or unlocks the selected node. */
function togglenode(id, locked)
{
  //console.log(id + "----" + locked);
  var nodetotoggle = document.querySelector('[node-db-path="' + id +'"]');
  nodetotoggle.setAttribute("locked", locked)

  var myscale = currentscale;
  if (nodetotoggle.hasAttribute("scaled")){
    myscale = nodetotoggle.getAttribute("scaled");
  }

  if (locked)
  {
    nodetotoggle.style.transform = 'matrix(' + (myscale * basenodescalelocked) +', 0, 0, ' + (myscale * basenodescalelocked) +', 0, 0)';
  }
  else
  {
    nodetotoggle.style.transform = 'matrix(' + (myscale * basenodescaleunlocked) +', 0, 0, ' + (myscale * basenodescaleunlocked) +', 0, 0)';
  }
}

/**Pulls data from the database and sets it to the text editor, if this is a new document (as per the newdoc variable) it will set the selection to the title */
function selectdoc(docpath)
{
  if (docpath == null)
  {
    //ipcRenderer.send(EDITOR_DESELECT,);
    return;
  }

  ipcRenderer.invoke(REQUEST_DOCUMENT_BYDOC,docpath).then((result) => {
    if (result != null)
    {
      //console.log(result.content);
      savetext();
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

/**Same thing as doc but for the node. */
function selectnode(buttonelmnt)
{
  ipcRenderer.invoke(REQUEST_DOCUMENT_BYNODE, buttonelmnt.getAttribute("node-db-path")).then((result) => {
    if (result != null)
    {
      //console.log(result.content);
      savetext();
      loadtext(result);
    }
    else
    {
      highlightdecider(null, buttonelmnt.getAttribute("node-db-path"));
    }
  })
}

/**Handles construction of the hierarchy */
function rebuildhierarchy(content)
{
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
      if (openednodes.includes(i))
      {
        textinsert = "<div class='hierarchylist-close sub-tiles' onclick='closechildren(this,event," + i + ")'></div>";
      }
      else
      {
        textinsert = "<div class='hierarchylist-open sub-tiles' onclick='openchildren(event," + i + ")'></div>";
      }
    }
    
    newhtml = newhtml + '<li class="item" draggable="true" ondragstart="drag(event)" ondrop="drop(event)" ondragover="allowDrop(event)" this-index="' + i + '" Db-Path="' + textEntries[i].id + '" onclick="hierarchybuttonpressed(' + textEntries[i].id + ')">' +  textEntries[i].name + textinsert + '</li>';

    if (textEntries[i].childdocuments != null && textEntries[i].childdocuments.length > 0)
    {
      builddocs(textEntries, textEntries[i].childdocuments, i);
    }

    column = 0;
    //newhtml = newhtml + '</li>';
  }

  hierarchylist.innerHTML = newhtml;
  highlightdecider(selecteddocid, selectednodeid);


  //Hides anything that is a child and the parent is not opened.
  var x = hierarchylist.getElementsByClassName("itemchildren");
  for (var i = 0; i < x.length; i++) {
    if (x[i].hasAttribute("parent-index") && !openednodes.includes(parseInt(x[i].getAttribute("parent-index"))))
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
/**Loops through all children recursively building the html up further as it goes with the new li. */
function builddocs(textEntries, childEntries, parentindex)
{
  column = column + 1;
  columnrowcount.push(row);

  for (var i = 0; i < childEntries.length; i++)
  {   

    for (var j = 0; j < textEntries.length; j++)
    {
      if (textEntries[j].id != childEntries[i])
      {
        continue;
      }

      row = row + 1;

      var textinsert = '';
      var thisindex = '';
      if (textEntries[j].childdocuments != null && textEntries[j].childdocuments.length > 0)
      {
        thisindex = 'this-index="' + j + '"';
        if (openednodes.includes(j))
        {
          textinsert = "<div class='hierarchylist-close sub-tiles' onclick='closechildren(this,event," + j + ")'></div>";
        }
        else
        {
          textinsert = "<div class='hierarchylist-open sub-tiles' onclick='openchildren(event," + j + ")'></div>";
        }
      }

      newhtml = newhtml + '<li class="item itemchildren" draggable="true" ondragstart="drag(event)" ondrop="drop(event)" ondragover="allowDrop(event)" ' + thisindex + ' parent-index="'+ parentindex + '" Db-Path="' + textEntries[j].id + '" onclick="hierarchybuttonpressed(' + textEntries[j].id + ')" style="margin-left: ' + ((column * columnwidth) + 10) + 'px;">' +  textEntries[j].name + textinsert + '</li>';

      if (textEntries[j].childdocuments != null && textEntries[j].childdocuments.length > 0)
      {
        builddocs(textEntries, textEntries[j].childdocuments, j)
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
  console.log(openednodes);
  //refresh hierarchy
  ipcRenderer.send(REQUEST_HIERARCHY_REFRESH, openednodes);
}

function closechildren(element, event, i)
{
  event.stopPropagation();
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
    if (x[i].hasAttribute("parent-index") && parseInt(x[i].getAttribute("parent-index")) == index)
    {
      if (x[i].hasAttribute("this-index"))
      {
        const index = openednodes.indexOf(parseInt(x[i].getAttribute("this-index")));
        if (index > -1) {
          openednodes.splice(index, 1);
        }
        iterateallchildren(parseInt(x[i].getAttribute("this-index")));
      }
    }
  }
}

function iterateallparents(index)
{
  var thisreturn = false;
  var x = hierarchylist.getElementsByClassName("item");
  for (var i = 0; i < x.length; i++) {
    if (x[i].hasAttribute("this-index") && parseInt(x[i].getAttribute("this-index")) == index)
    {
      const index = openednodes.indexOf(parseInt(x[i].getAttribute("this-index")));
      if (index == -1) {
        openednodes.push(parseInt(x[i].getAttribute("this-index")));
        thisreturn = true;
      }

      if (x[i].hasAttribute("parent-index"))
      {
        if (iterateallparents(parseInt(x[i].getAttribute("parent-index"))))
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
      selectdoc(id);
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
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("Db-Path", ev.target.getAttribute("Db-Path"));
}

function drop(ev) {
  ev.preventDefault();
  var data = {
    child: ev.dataTransfer.getData("Db-Path"),
    parent: ev.target.getAttribute("Db-Path")
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

/**Handles highlighting the selected document/node, and it's corrosponding binded document/node if they exist, also unhighlights the last one. */
function highlightdecider(docid, nodeid)
{
  if (selectednodeid != null)
  {
    // -- UNHIGHLIGHTS NODE --//var oldnode = mapdiv.querySelector('*[node-db-path="' + selectednodeid + '"]');
  }
  if (selecteddocid != null)
  {
    hierarchylist.querySelector('*[Db-Path="' + selecteddocid + '"]').id = '';
  }

  selectednodeid = nodeid;
  selecteddocid = docid;

  if (nodeid != null)
  {
    highlightnode(nodeid);
    return;
  }
  if (docid != null)
  {
    highlightdoc(docid);
    return;
  }

  selectionchanged(null,null);
}

function highlightdoc(docid)
{
  var doc = hierarchylist.querySelector('*[Db-Path="' + docid + '"]');
  doc.id = 'highlight';

  var foundnode = mapdiv.querySelector('*[doc-db-path="' + docid + '"]');
  if(foundnode){

    // HIGHLIGHT NODE ----
    panto(foundnode.style.left, foundnode.style.top);
    
    selectionchanged(docid,foundnode.getAttribute('node-db-path'));
    return;    
  }

  selectionchanged(docid,null);
}

function highlightnode(nodeid)
{
  var node = mapdiv.querySelector('*[node-db-path="' + nodeid + '"]');
  // HIGHLIGHT NODE ----

  var docid = node.getAttribute('doc-db-path');
  if (docid){
    var founddoc = hierarchylist.querySelector('*[Db-Path="' + docid + '"]');
    
    if (founddoc){
      founddoc.id = 'highlight';
      selectionchanged(docid,nodeid);
      return;
    }
    else
    {
      node.setAttribute('doc-db-path','');
    }
  }

  selectionchanged(null,nodeid);
}

/**Handles Final part of setting the selected node/doc ids and sending that information to the toolbox. */
function selectionchanged(docid, nodeid)
{
  var data = {
    docid: docid,
    nodeid: nodeid,
    nodeinternalscale: null
  }

  selectednodeid = nodeid;
  selecteddocid = docid;

  if(nodeid != null)
  {
    data.nodeinternalscale = mapdiv.querySelector('*[node-db-path="' + nodeid + '"]').getAttribute("scaled");
  }
  
  if (editorwindow){
    editorwindow.webContents.send(EDITOR_SELECTION, data);
  }  
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
  
  var mouseorigin, nodelocked = true, softlockdistance;
  var scale;

  function dragMouseDown(e) {
    e = e || window.event;

    if (e.which == 2 || e.which == 3)
    {
      return;
    }
    //console.log(buttonelmnt.getAttribute("locked"));
    


    if (buttonelmnt.getAttribute("locked") == "true")
    {
        selectnode(buttonelmnt);
      return;
    }

    e.preventDefault();

    mouseorigin = {
      x: (e.clientX - 32),
      y: (e.clientY - 32)
    }
    
    scale = buttonelmnt.getAttribute("scaled");

    if (!scale){scale = currentscale;}
  
    console.log(scale + "--" + zoom);
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
      selectnode(buttonelmnt);      
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