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
      overflow: "hidden"
  });

  menu = Menu.buildFromTemplate(template)

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
})


//const Quill = require('quill');
//const ImageResize = require('quill-image-resize-module');

const {
  SAVE_MAP_TO_STORAGE,
  CHANGE_MAP,
  CREATE_NEW_NODE,
  PROJECT_INITIALIZED,
  RESET_MAP,
  REFRESH_DATABASE,
  REFRESH_DATABASE_COMPLETE,
  REFRESH_PAGE,
  REFRESH_HIREARCHY,
  REQUEST_NODE_CONTEXT,
  DELETE_NODE,
  VERIFY_NODE,
  REQUEST_DOCUMENT_BYNODE,
  REQUEST_DOCUMENT_BYDOC,
  SAVE_DOCUMENT,
  NEW_DOCUMENT,
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
}  = require('../utils/constants');
//const { map } = require('jquery');
/** -------------------- Variables --------------------- */

let rightClickPosition;
var caratindex;
var zoom = 1;
var textchanged = false;
var instance;
var node;
var deactivatepanning = false;
var newdoc = false;
var previoustexteditorsize = 30;
var previoushirearchysize = 15;

var texteditortoolbar = document.getElementById('toolbar');
var toolbarheight;
var editorcontainer = document.getElementById('editor');
var texteditorcontainer = document.getElementById('textcontainer');

//console.log(editorcontainer);

var nodelist = [];
var hirearchylist = document.getElementById('hirearchylist');
var selecteddocid;
var selectednodeid;
var depth;
var newhtml;

const canvas = document.getElementById('canvaswindow');
const canvascontext = canvas.getContext('2d');
var drawings = [];
let freedrawing = false;
let isDrawing = false;
let currentdrawing = 0;
let basedistance = 10;
let currentcolor = "#fff";
let currentwidth = 5;
let currentisfill = true;
let currentfillstyle = "rgba(32, 45, 21, 0.2)";


var mapdiv = document.getElementById('mapdiv');
var map = document.getElementById('map');
map.onload = function () {
  resetmap();
}

var menu;
var infodisplay;
var downloaddisplay;
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
          click: () => { ipcRenderer.send(TITLEBAR_OPENWINDOW); }
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
     label: '|',
     enabled: false
  },
  {
    label: "output",
    enabled: false
  },
  {
    label: "animation",
    enabled: false
  }
]



ipcRenderer.invoke(RETRIEVE_VERSION).then((result) => {
  if (result)
  {
    infodisplay.innerHTML = "version: " + result;
  }
  else{
    infodisplay.innerHTML = "no version number";
  }
})

//var texteditorwindow = document.getElementById('texteditor');
var texteditortitle = document.getElementById('texteditor-title');

let Embed = Quill.import('blots/embed');

Embed.whitelist = ['doclink', 'rt'];
class QuillRuby extends Embed {
    static create(value, top, body) {
        var node = super.create(value);
        node.setAttribute('contenteditable', false);
        node.setAttribute('db-path', value);
        node.setAttribute('onclick', 'hirearchybuttonpressed(' + value + ')')
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
 
//Quill.register('modules/imageResize', ImageResize);
var resize = Quill.import('modules/imageResize');
Quill.register(resize, true);
//var drop = Quill.import('modules/imageDrop');
//Quill.register(drop, true);

var Size = Quill.import('attributors/style/size');
Size.whitelist = ['14px', '16px', '18px', '20px', '26px', '32px'];
Quill.register(Size, true);


var toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],

  //[{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  //[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  //[{ 'direction': 'rtl' }],                         // text direction

  [{ 'size': ['14px', '16px', '18px', '20px', '26px', '32px'] }],  // custom dropdown
  //[{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],
  ['image' ],

  ['clean']                                         // remove formatting button
];

var editor = new Quill('#editor', {
  modules: {
    toolbar: '#toolbar',
    imageResize: {modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]},
    //imageDrop: true
  },
  theme: 'snow'
  //imageHandler: imageHandler
});







/** ---------------- Canvas Prototyping --------------------- */

function drawing(points, color, width, fillstyle, isfill)
{
  this.points = [points];
  this.color = color;
  this.width = width;
  this.isfill = isfill;
  this.fillstyle = fillstyle;
  var x = 0;
  var y = 0;

  this.draw = function(){
    if (points.length > 1)
    {
      x = points[0].x;
      y = points[0].y;
      if (isfill)
      {
        canvascontext.moveTo(x, y);
        canvascontext.strokeStyle = color;
        canvascontext.lineWidth = width;
        canvascontext.fillStyle = fillstyle;
        canvascontext.beginPath();
        for(var i = 0; i < points.length; i++)
        {
          drawpolygon( points[i].x, points[i].y);
        }
        canvascontext.stroke();
        canvascontext.closePath();
        canvascontext.fill();
      }
      else
      {
        for(var i = 1; i < points.length; i++)
        {
          drawLine( x, y, points[i].x, points[i].y);
          x = points[i].x;
          y = points[i].y;
        }
      }
    }
  }

  function drawpolygon(x1,y1)
  {
    canvascontext.lineTo(x1, y1);
  }

  function drawLine( x1, y1, x2, y2) {
    console.log(x1, y1, x2, y2 );
    canvascontext.beginPath();
    canvascontext.strokeStyle = color;
    canvascontext.lineWidth = width;
    canvascontext.moveTo(x1, y1);
    canvascontext.lineTo(x2, y2);
    canvascontext.stroke();
    canvascontext.closePath();
  }

  this.drag = function(mousex,mousey){
    if (points.length > 0)
    {
      drawLine( points[points.length - 1].x, points[points.length - 1].y, mousex, mousey,);
    }
  }

  this.addpoint = function(newx,newy){
    var newpoint = {
      x:newx,
      y:newy
    }
    points.push(newpoint);
  }

  this.getDistanceFrom = function(x, y){
    if (points.length > 0)
    {
      return getDistance(x,y,points[points.length - 1].x, points[points.length - 1].y);
    }
  }

  function getDistance(xA, yA, xB, yB) { 
    var xDiff = xA - xB; 
    var yDiff = yA - yB;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  }

  this.exportsaveable = function()
  {
    var newdrawing = {
      points: points,
      color: color,
      width: width,
      isfill: isfill,
      fillstyle: fillstyle
    }

    return newdrawing;
  }
}

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
}

canvas.addEventListener('mousedown', e => {
  if (e.which != 1 || selecteddocid === null) { return;}

  var coords = convertworldtodoccords(e.pageX,e.pageY);

  if (!isDrawing)
  {
    drawings.push(new drawing([], currentcolor, currentwidth, currentfillstyle, currentisfill));
    isDrawing = true;
  }
  

  drawings[currentdrawing].addpoint(coords.x, coords.y)
  freedrawing = true;
});

canvas.addEventListener('mouseup', e => {
  freedrawing = false;
});

canvas.addEventListener('mousemove', e => {
  if (freedrawing === true){
    var coords = convertworldtodoccords(e.pageX,e.pageY);

    if (drawings[currentdrawing].getDistanceFrom(coords.x, coords.y) > basedistance)
    {
      drawings[currentdrawing].addpoint(coords.x, coords.y)
      
      canvascontext.clearRect(0,0, canvas.width, canvas.height);
      for(var i = 0; i < drawings.length; i++)
      {
        drawings[i].draw();
      }

      return;
    }
  }

  if (isDrawing === true) {
    var coords = convertworldtodoccords(e.pageX,e.pageY);
    
    canvascontext.clearRect(0,0, canvas.width, canvas.height);
    for(var i = 0; i < drawings.length; i++)
    {
      drawings[i].draw();
    }

    drawings[currentdrawing].drag(coords.x, coords.y)
    return;
  }
});

/** ------------------  END DRAWING ---------------------  */












//console.log(editor.root);
editor.root.setAttribute('ondrop', 'textdrop(event)');
editor.root.setAttribute('ondragover', 'allowDrop(event)');
editor.on('text-change', function(delta, source) {
  textchanged = true;
});

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


//May need to swap out later to allow hirearchy
var splitinstance = Split(['.a','.b', '.c'], {
  sizes: [0, 100, 0],
  minSize: [0, 0 ,0],
  gutterSize: 20,
  snapOffset: 100,
  onDrag: function(sizes) {
    resizetextwindow();
  }
})

function resizetextwindow()
{
  toolbarheight = texteditortoolbar.getBoundingClientRect().height + texteditortitle.getBoundingClientRect().height;
  editorcontainer.style.height = (texteditorcontainer.getBoundingClientRect().height  - (toolbarheight + 10)) + 'px';
}

dragElement(mapdiv, document.getElementById("textcontainer"), document.getElementById("hirearchycontainer"));

ipcRenderer.send(REFRESH_PAGE);

window.addEventListener('contextmenu', (e) => {
  if(isDrawing){
    e.preventDefault();
    finishdrawing(e);
    console.log(isDrawing);
    return;
  }
  rightClickPosition = {x: e.x, y: e.y}
  node = document.elementFromPoint(rightClickPosition.x, rightClickPosition.y);
  if (node.className == "node-icon")
  {
    ipcRenderer.send(REQUEST_NODE_CONTEXT, node.getAttribute("node-db-path"));
  }
}, false)

/** -------------------------------- HOTKEYS ----------------------------- */

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
  togglehirearchy();
  return false;
});

Mousetrap.bind(['command+d', 'ctrl+d'], function() {
  highlightdecider(null, null);
  return false;
});

Mousetrap.bind(['command+w', 'ctrl+w'], function() {
  ipcRenderer.send(TITLEBAR_OPENWINDOW); 
  return false;
});


Mousetrap.prototype.stopCallback = function(e, element, combo) {
  return false;
}


/** ------------------------------ END HOTKEYS --------------------------- */

const backgroundload = document.getElementById('backgroundBtn');
backgroundload.onclick = e => {
  getFileFromUser();
};

const newdocbtn = document.getElementById('btn-newdoc');
newdocbtn.onclick = e => {
  createdocument();
  newdoc = true;
};

const deletdocbtn = document.getElementById('btn-deletedoc');
deletdocbtn.onclick = e => {
  deletedocument();
};

texteditortitle.addEventListener("input", function() {
  textchanged = true;
}, false);

texteditortitle.addEventListener('focusout', (event) => {
  savetext();   
});

editor.onblur = function(){
  console.log(editor.getSelection());
};

editor.on('selection-change', function(range, oldRange, source) {
  if (range === null && oldRange !== null) {
    caratindex = oldRange;
  } 
  else if (range !== null && oldRange === null)
  {
    //console.log("focus");
  }
});






/** -------------------- IPC BLOCK ---------------------  */
/*
ipcRenderer.on(TEST_NODES, (event, message) => {
  if (nodelist.length > 0)
  {
    nodelist.forEach(element => {
      element.style.width = (64 * message) + "px";
      element.style.height = (64 * message) + "px";
    });
  }
})
*/

ipcRenderer.on(EDITOR_DRAWINGSETTINGS, (event, data) => {
  if (data.currentcolor != null){currentcolor = data.currentcolor;}
  if (data.currentwidth != null){currentwidth = data.currentwidth;}
  if (data.currentisfill != null){currentisfill = data.currentisfill;}
  if (data.currentfillstyle != null){currentfillstyle = data.currentfillstyle;}
})

ipcRenderer.on(NOTIFY_UPDATEDOWNLOADING, (event, message) => {
  infodisplay.innerHTML = "Downloading... ";
  downloaddisplay.style.display = "block";
})

ipcRenderer.on(NOTIFY_UPDATECOMPLETE, (event, message) => {
  downloaddisplay.style.display = "none";
  infodisplay.innerHTML = "Download Complete!"
  menu = Menu.buildFromTemplate(template)

  menu.append(new MenuItem({
    label: 'Restart',
    click: () => { 
      clearInterval(animation);
      ipcRenderer.send(NOTIFY_RESTART); }
  }));
  titlebar.updateMenu(menu);
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

/** -------------------- END TITLEBAR --------------------- */

ipcRenderer.on(EDITOR_INITIALIZED, (event) => {
  selectionchanged(selecteddocid, selectednodeid);
})

ipcRenderer.on(PROJECT_INITIALIZED, (event, message) => {
  selecteddocid = null;
  selectednodeid = null;
  textchanged = false;

  //console.log(message.CurrentContent.content.textEntries);

  document.querySelectorAll('.node-icon').forEach(function(a) {
    a.remove()
  })
  
  cleartexteditor();
  rebuildhirearchy(message.CurrentContent.content);

  const projecttitle = document.getElementById('project-title');
  projecttitle.innerHTML = "ProjectName: " + message.CurrentContent.name;
  if (message.CurrentContent.backgroundurl == "")
  {
    switchtonomap();
  }
  else
  {
    map.src = message.CurrentContent.backgroundurl;
    resetmap();
    
    switchtomap();
    importnodes(message);
  }
})

ipcRenderer.on(REFRESH_DATABASE, (event, message) => {

  savetext(completerefresh);
  //ipcRenderer.send(REFRESH_DATABASE_COMPLETE);
})

ipcRenderer.on(RESET_MAP, (event, message) => {
  resetmap(); 
})

ipcRenderer.on(REFRESH_HIREARCHY, (event, message) =>{
  rebuildhirearchy(message);
})

ipcRenderer.on(CHANGE_MAP, (event, message) => {
  getFileFromUser();
})

ipcRenderer.on(CREATE_NEW_NODE, (event, message) => {
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
  completedelete();
})

ipcRenderer.on(TOGGLE_NODE, (event, message) => {
  togglenode(message.id, message.locked);
})




/** -------------------- End region ---------------------  */







































//** -------------------- Text editor button handlers. --------------------- */

function btnsave ()
{
  savetext();
}

function btnweight ()
{
  var string = getSelectionHtml();

  var stick = false;
  var arrayOfStrings = string.split('<br>')

  if (arrayOfStrings[0].fontweight == "normal")
  {
    stick = true;
  }

  string = "";
  arrayOfStrings.forEach(element => {
    if (stick)
    {
      element.fontweight = "bold"
    }
    else
    {
      element.fontweight = "normal"
    }
    string = string + element + '<br>';
  });
  //string = arrayOfStrings.join('<br>');
  pasteHtmlAtCaret(string, false);
}

function btnitalics ()
{
  var string = getSelectionHtml();

  var stick = false;
  var arrayOfStrings = string.split('<br>')

  if (arrayOfStrings[0].fontStyle == "normal")
  {
    stick = true;
  }

  string = "";
  arrayOfStrings.forEach(element => {
    if (stick)
    {
      element.fontStyle = "italic"
    }
    else
    {
      element.fontStyle = "normal"
    }
    string = string + element + '<br>';
  });
  //string = arrayOfStrings.join('<br>');
  pasteHtmlAtCaret(string, false);
}

function btnvariable (styletype)
{
  var string = getSelectionHtml();

  var arrayOfStrings = string.split('<br>')
  string = "";
  arrayOfStrings.forEach(element => {
    element = element.fontStyle(styletype)
    string = string + element + '<br>';
  });
  //string = arrayOfStrings.join('<br>');
  pasteHtmlAtCaret(string, false);

  /*
  var string = getSelectionHtml();

  var arrayOfStrings = string.split('<br>')
  string = "";
  arrayOfStrings.forEach(element => {
    element = element.fontsize(100);
    string = string + element + '<br>';
  });
  //string = arrayOfStrings.join('<br>');
  pasteHtmlAtCaret(string, false);
  */
}

function pasteHtmlAtCaret(html, selectPastedContent) {
  var sel, range;
  if (window.getSelection) {
      // IE9 and non-IE
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
          range = sel.getRangeAt(0);

          if (!texteditorwindow.contains(range.commonAncestorContainer))
          {
            sel.removeAllRanges();
            return;
          }

          range.deleteContents();

          // Range.createContextualFragment() would be useful here but is
          // only relatively recently standardized and is not supported in
          // some browsers (IE9, for one)
          var el = document.createElement("div");
          el.innerHTML = html;
          var frag = document.createDocumentFragment(), node, lastNode;
          while ( (node = el.firstChild) ) {
              lastNode = frag.appendChild(node);
          }
          var firstNode = frag.firstChild;
          range.insertNode(frag);
          
          // Preserve the selection
          if (lastNode) {
              range = range.cloneRange();
              range.setStartAfter(lastNode);
              if (selectPastedContent) {
                  range.setStartBefore(firstNode);
              } else {
                  range.collapse(true);
              }
              sel.removeAllRanges();
              sel.addRange(range);
          }
      }
  } else if ( (sel = document.selection) && sel.type != "Control") {
      // IE < 9
      var originalRange = sel.createRange();
      originalRange.collapse(true);
      sel.createRange().pasteHTML(html);
      if (selectPastedContent) {
          range = sel.createRange();
          range.setEndPoint("StartToStart", originalRange);
          range.select();
      }
  }
}

/**Handles replacing change of divs with <br> wwhich breaks the line without killing the ability to format them. */
$('div[contenteditable]').keydown(function(e) {
  // trap the return key being pressed
  if (e.keyCode === 13) {
      // insert 2 br tags (if only one br tag is inserted the cursor won't go to the next line)
      if (texteditortitle.contains(window.getSelection().getRangeAt(0).commonAncestorContainer))
      {
        savetext();
        return false;
      }
      // prevent the default behaviour of return key pressed
      return false;
  }
});

function getSelectionText() {
	var text = "";
	if (document.getSelection) {
		text = document.getSelection().toString();
	} else if (document.selection && document.selection.type != "Control") {
		text = document.selection.createRange().text;
	}
	return text;
}

function getSelectionHtml() {
  var html = "";
  if (typeof window.getSelection != "undefined") {
      var sel = window.getSelection();
      if (sel.rangeCount) {
          var container = document.createElement("div");
          for (var i = 0, len = sel.rangeCount; i < len; ++i) {
              container.appendChild(sel.getRangeAt(i).cloneContents());
          }
          html = container.innerHTML;
      }
  } else if (typeof document.selection != "undefined") {
      if (document.selection.type == "Text") {
          html = document.selection.createRange().htmlText;
      }
  }
  return html;
}
/** -------------------- End region ---------------------  */









/** -------------------- Helper Functions ---------------------  */

function open(sizes, index)
{
  if (index == 0)
  {
    if (sizes[0] > 10) {return;}
    sizes = [previoushirearchysize, ((100 - previoushirearchysize) - sizes[2]), sizes[2]];
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
  /*

  if (index == 0)
  {
    sizes = [0, (99.5 - sizes[2]), sizes[2]];
  }
  else if(index == 1)
  {
    sizes[0.5,99,0.5];
  }
  else if (index == 2)
  {
    sizes = [sizes[0],(99.5 - sizes[0]), 0.5];
  }
  console.log(index);
  splitinstance.setSizes((99.5 - sizes[0]) + "-----" + sizes);
  */
}

function togglehirearchy()
{
  var sizes = splitinstance.getSizes();
  if (sizes[0] > 10)
  {
    previoushirearchysize = sizes[0];
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

function cleartexteditor()
{
  //closetexteditor();
  editor.setText('')
  //texteditorwindow.innerHTML = null;
  texteditortitle.innerText = null;
  texteditortitle.setAttribute('db-path',null);
}



function loadtext(document)
{
  lasttext = document.content;
  opentexteditor();
  editor.setHTML(document.content);

  drawings = [];
  freedrawing = false;
  isDrawing = false;
  currentdrawing = 0;

  if (document.drawing.length > 0)
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
  console.log(drawings);


  canvascontext.clearRect(0,0, canvas.width, canvas.height);
  if (drawings.length > 0)
  {
    for(var i = 0; i < drawings.length; i++)
    {
      drawings[i].draw();
    }

    currentdrawing = drawings.length;
  }


  var buttons = retrievebuttons();

  //console.log(buttons);
  for (var i = 0; i < buttons.length; i++)
  {
    buttons[i].innerHTML = retrievename(buttons[i].getAttribute('db-path'));
    
    buttons[i].setAttribute('onclick', 'hirearchybuttonpressed(' + buttons[i].getAttribute('db-path') + ')')
  }

  /*
  buttons.forEach(element => {
    element.innerHTML = retrievename(element.getAttribute('db-path'));
  });
  */
  //texteditorwindow.innerHTML = document.content;
  texteditortitle.innerText = document.name;
  texteditortitle.setAttribute('db-path',document.id);
  highlightdecider(document.id, null);
}

function retrievebuttons()
{
  return document.getElementsByClassName('quill-doclink');
}

function completerefresh ()
{
  ipcRenderer.send(REFRESH_DATABASE_COMPLETE);
}

function savetext (callback)
{
  if (textchanged == false)
  {
    if (callback != null)
    {
      callback();
    }

    //console.log("nothing to save")
    return false;
  }
  var newdoc = new DatabaseTextentry();
  newdoc.id = texteditortitle.getAttribute('db-path');
  newdoc.name = texteditortitle.innerText;
  newdoc.content = editor.getHTML();
  newdoc.drawing = drawings;

  var newdrawings = [];

  if (drawings.length > 0)
  {
    for (var i = 0; i < drawings.length; i++)
    {
      newdrawings.push(drawings[i].exportsaveable());      
    }
  }

  newdoc.drawing = newdrawings;
  
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
    if (callback != null)
    {
      callback();
    }
  })
}

function switchtomap()
{
  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'none';

  
  mapdiv.style.display = 'block';
}

function switchtonomap()
{
  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'flex';


  mapdiv.style.display = 'none';
}

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
    /*
  instance.panTo({ 
    originX: window.innerWidth / 2, 
    originY: window.innerHeight / 2, 
    zoom 
  });
  */
}

function importnodes(database)
{
  //console.log(database.CurrentContent);
  database.CurrentContent.content.nodes.forEach(element => {
    createnode(element.location.x, element.location.y, element.id, element.documentref, element.locked);
  });

  //createnode(rightClickPosition.x,rightClickPosition.y,message);
}

function createnode(x,y, nodeid, docid, locked)
{
  var img = document.createElement('button');
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

  dragNode(img, mapdiv);
  //img.id = "node-icon";
  img.className = "node-icon";
  img.setAttribute("node-db-path", nodeid)
  img.setAttribute("doc-db-path", docid)
  img.setAttribute("locked", locked)

  mapdiv.appendChild(img); 
    
  img.style.left = (x  + "px");
  img.style.top = (y  + "px");

  if (locked)
  {
    img.style.transform = `matrix(1, 0, 0, 1, 0, 0)`;
  }
  else
  {
    img.style.transform = `matrix(1.1, 0, 0, 1.1, 0, 0)`;
  }

  nodelist.push(img);
}

function createdocument()
{
  ipcRenderer.send(NEW_DOCUMENT, selecteddocid);
}

function deletedocument()
{
  if (selecteddocid != null)
  {
    ipcRenderer.send(DELETE_DOCUMENT, selecteddocid);
  }
}

function completedelete()
{
  texteditortitle.setAttribute('db-path', "");
  texteditortitle.innerText = "";
  editor.setText("");

  selecteddocid = null;
}

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
    x: multipliednormalizedx ,
    y: multipliednormalizedy
  }
  return coords;
}

function mousecreatenode(x,y, nodeid, docid)
{
  
  var img = document.createElement('button');
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

  dragNode(img, mapdiv);
  //img.id = "node-icon";
  img.setAttribute("node-db-path", nodeid)
  img.setAttribute("doc-db-path", docid)
  img.setAttribute("locked", "false")
  img.className = "node-icon";
  /*
  var modifiedzoom = 1 / zoom;

  
  var originx = mapdiv.getBoundingClientRect().left;
  var originy = mapdiv.getBoundingClientRect().top;
  

  var normalizedx = (x - originx);
  var multipliednormalizedx = (normalizedx * modifiedzoom) - 32;

  var normalizedy = (y - originy);
  var multipliednormalizedy = (normalizedy * modifiedzoom) - 32;
  */
  var coords = convertworldtodoccords(x,y);
  console.log(coords);
  mapdiv.appendChild(img); 
    
  img.style.left = ((coords.x - 32)  + "px");
  img.style.top = ((coords.y - 32)  + "px");
  img.style.transform = `matrix(1.1, 0, 0, 1.1, 0, 0)`;

  data = {
    x:coords.x,
    y:coords.y,
    id:nodeid
  };
  ipcRenderer.send(VERIFY_NODE, data);

  nodelist.push(img);
}

function togglenode(id, locked)
{
  //console.log(id + "----" + locked);
  var nodetotoggle = document.querySelector('[node-db-path="' + id +'"]');
  nodetotoggle.setAttribute("locked", locked)

  if (locked)
  {
    nodetotoggle.style.transform = `matrix(1, 0, 0, 1, 0, 0)`;
  }
  else
  {
    nodetotoggle.style.transform = `matrix(1.1, 0, 0, 1.1, 0, 0)`;
  }
}

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

function rebuildhirearchy(content)
{
  highlightdecider(selecteddocid, selectednodeid);
  hirearchylist.innerHTML = null;

  var textEntries = [];
  textEntries = content.textEntries;

  //console.log(textEntries);

  newhtml = '';
  depth = 0;

  for(var i = 0; i < textEntries.length; i++)
  {
    if (textEntries[i].parentid != "")
    {
      continue;
    }
    
    newhtml = newhtml + '<li draggable="true" ondragstart="drag(event)" ondrop="drop(event)" ondragover="allowDrop(event)" Db-Path="' + textEntries[i].id + '" onclick="hirearchybuttonpressed(' + textEntries[i].id + ')">' +  textEntries[i].name + '</li>';

    if (textEntries[i].childdocuments != null && textEntries[i].childdocuments.length > 0)
    {
      builddocs(textEntries, textEntries[i].childdocuments, textEntries[i].id)
    }

    depth = 0;
    //newhtml = newhtml + '</li>';
  }


  hirearchylist.innerHTML = newhtml;

  var x = document.getElementsByClassName("hirearchylist-items");
  for (var i = 0; i < x.length; i++) {
    //sortList(x[i]);
  }

  if (selecteddocid != null)
  {
    hirearchylist.querySelector('*[Db-Path="' + selecteddocid + '"]').id = 'highlight';
  }

  if (newdoc)
  {
    hirearchybuttonpressed(textEntries[textEntries.length - 1].id);
  }
}

function selectElementContents(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function builddocs(textEntries, childEntries)
{
  depth = depth + 10;
  for (var i = 0; i < childEntries.length; i++)
  {   

    for (var j = 0; j < textEntries.length; j++)
    {
      if (textEntries[j].id != childEntries[i])
      {
        continue;
      }

      newhtml = newhtml + '<li draggable="true" ondragstart="drag(event)" ondrop="drop(event)" ondragover="allowDrop(event)" Db-Path="' + textEntries[j].id + '" onclick="hirearchybuttonpressed(' + textEntries[j].id + ')" style="padding-left: ' + depth + 'px;">' +  textEntries[j].name + '</li>';

      if (textEntries[j].childdocuments != null && textEntries[j].childdocuments.length > 0)
      {
        //newhtml = newhtml + '<ul class="hirearchylist-items">';
        builddocs(textEntries, textEntries[j].childdocuments, textEntries[j].id)
        //newhtml = newhtml + '</ul>';
      }
      //newhtml = newhtml + '</li>';
      break;
    }
  }
  depth = depth - 10;
}


function sortList(ul) {
  Array.from(ul.getElementsByTagName("li"))
    .sort((a, b) => a.textContent.localeCompare(b.textContent))
    .forEach(li => ul.appendChild(li));
}

function hirearchybuttonpressed(id)
{ 
  //console.log(id);
  //dochighlighttoggle(id);
  selectdoc(id);
}

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

function textdrop(ev){
  if (ev.dataTransfer.getData("Db-Path") != "")
  {
    ev.preventDefault();
  
    //var range = editor.getSelection(true);
  
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

  
  /*
  editor.updateContents([
    { insert: { doclink: ev.dataTransfer.getData("Db-Path") } },
  ]);
  */
  //editor.insertEmbed(range.index, 'variable', ev.dataTransfer.getData("Db-Path"), Quill.sources.USER);
  //editor.insertHTML(html);
}

function retrievename(id)
{
  var doc = hirearchylist.querySelector('*[Db-Path="' + id + '"]');
  if (doc != null)
  {
    return doc.innerText;
  }
  return "Document has no name...";
}

function highlightdecider(docid, nodeid)
{
  if (selectednodeid != null)
  {
    // -- UNHIGHLIGHT --//var oldnode = mapdiv.querySelector('*[node-db-path="' + selectednodeid + '"]');
  }
  if (selecteddocid != null)
  {
    hirearchylist.querySelector('*[Db-Path="' + selecteddocid + '"]').id = '';
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
  var doc = hirearchylist.querySelector('*[Db-Path="' + docid + '"]');
  doc.id = 'highlight';

  var foundnode = mapdiv.querySelector('*[doc-db-path="' + docid + '"]');
  if(foundnode){

    // HIGHLIGHT NODE ----
    
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
    var founddoc = hirearchylist.querySelector('*[Db-Path="' + docid + '"]');
    
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

function selectionchanged(docid, nodeid)
{
  var data = {
    docid: docid,
    nodeid: nodeid
  }

  //console.log(data)
  //selecteddocid

  var editorwindow = remote.getGlobal ('editorwindow');
  var teststring = "test";

  //console.log(editorwindow);
  
  if (editorwindow){
    editorwindow.webContents.send(EDITOR_SELECTION, data);
  }  
}

/** Maybe remove later and move to main.js */

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

  function dragMouseDown(e) {
    e = e || window.event;

    if ((e.keyCode || e.which) == 3)
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
    softlockdistance = 32 * zoom;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    if (nodelocked)
    {
      if ((e.clientX - 32) - mouseorigin.x > softlockdistance 
      || (e.clientX - 32) - mouseorigin.x < -softlockdistance 
      || (e.clientY - 32) - mouseorigin.y > softlockdistance 
      || (e.clientY - 32) - mouseorigin.y < -softlockdistance)
      {
        //console.log(mouseorigin.x + " -- " + mouseorigin.y + " ----- x:" + (e.clientX - 32) + " -- y:" + (e.clientY - 32));
        nodelocked = false;

        
        parentelmnt.style.pointerEvents = 'none';

        document.body.appendChild(buttonelmnt);
        buttonelmnt.style.left = (e.clientX - 32) + "px";
        buttonelmnt.style.top = (e.clientY - 32) + "px";
        buttonelmnt.style.transform = `matrix(${zoom * 1.1}, 0, 0, ${zoom * 1.1}, 0, 0)`;
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

    if (nodelocked)
    {
      selectnode(buttonelmnt);
      return;
    }

    nodelocked = true;

    var x = (parseFloat(buttonelmnt.style.left) + 32);
    var y = (parseFloat(buttonelmnt.style.top) + 32);

    buttonelmnt.style.transform = `matrix(1.1, 0, 0, 1.1, 0, 0)`;

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
    data = {
      x:multipliednormalizedx,
      y:multipliednormalizedy,
      id:buttonelmnt.getAttribute("node-db-path"),
    };
    ipcRenderer.send(VERIFY_NODE, data);
  }
}

function dragElement(elmnt, textelmnt, hirearchyelmnt) {
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
    if (e.pageX > textelmnt.getBoundingClientRect().left ||e.pageX < hirearchyelmnt.getBoundingClientRect().right || e.which === 1 || e.which === 3)
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