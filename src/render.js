const remote = require('electron'); // Load remote compnent that contains the dialog dependency
const { Menu} = remote; // Load the dialogs component of the OS
const { dialog, BrowserWindow, screen } = require('electron').remote
const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
const {ipcRenderer} = require('electron');
const { renderer } = require('./renderer');
window.$ = window.jQuery = require('jquery');



const Split = require('split.js')
var splitinstance = Split(['.a','.b'], {
  sizes: [100, 0],
  minSize: [100, 0],
})
//document.getElementsByClassName('gutter')[0].style.display = "block";
//document.getElementById('textbox').style.display = "block";
const {
  SAVE_MAP_TO_STORAGE,
  CHANGE_MAP,
  CREATE_NEW_NODE,
  PROJECT_INITIALIZED,
  RESET_MAP,
  REFRESH_PAGE,
  REQUEST_NODE_CONTEXT,
  DELETE_NODE,
  VERIFY_NODE,
  TOGGLE_NODE,
  TOGGLE_TEXT_EDITOR,
}  = require('../utils/constants');

let rightClickPosition = null;
var zoom = 1;
var instance;
var node;

ipcRenderer.send(REFRESH_PAGE);

//contextmenuonnodes
window.addEventListener('contextmenu', (e) => {
  rightClickPosition = {x: e.x, y: e.y}
  node = document.elementFromPoint(rightClickPosition.x, rightClickPosition.y);
  if (node.id == "node-icon")
  {
    ipcRenderer.send(REQUEST_NODE_CONTEXT, node.getAttribute("Db-Path"));
  }
}, false)



const backgroundload = document.getElementById('backgroundBtn');
backgroundload.onclick = e => {
  getFileFromUser();
};

const getFileFromUser = async () => {
  let options = {
    title : "Load a Map image", 

    defaultPath : ".",
    
    buttonLabel : "Import image",
    
    filters :[
      {name: 'Images', extensions: ['jpg', 'png', 'gif']}
    ],
    properties: ['openFile']
  }
  let Remotewin = BrowserWindow.getFocusedWindow();
  // Triggers the OS' Open File Dialog box. We also pass it as a Javascript
  // object of different configuration arguments to the function

  //This operation is asynchronous and needs to be awaited
  const files = await dialog.showOpenDialog(Remotewin, options, {
      // The Configuration object sets different properties on the Open File Dialog 
      properties: ['openFile']
  });

  // If we don't have any files, return early from the function
  if (!files.filePaths[0]) {
      return;
  }

  // Pulls the first file out of the array

  //const file = files[0];
  // Reads from the file and converts the resulting buffer to a string
  //const content = fs.readFileSync(file).toString();
  
  // Log the Files to the Console
  ipcRenderer.invoke(SAVE_MAP_TO_STORAGE, files.filePaths[0]).then((result) => {
    if (result)
    {
      const map = document.getElementById('map');
  
      map.src = files.filePaths[0];
      switchtomap();
    }
    else
    {
      console.log("Unable to save map due to no database selected.")
    }
  })
}

function switchtomap()
{
  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'none';

  const map = document.getElementById('mapdiv');
  map.style.display = 'block';
}

function switchtonomap()
{
  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'flex';

  const map = document.getElementById('mapdiv');
  map.style.display = 'none';
}


ipcRenderer.on(PROJECT_INITIALIZED, (event, message) => {

  var text = document.getElementById('texteditor').innerHTML;
  console.log(text);

  document.querySelectorAll('.node').forEach(function(a) {
    a.remove()
  })
  /*
  oldnodes.forEach(element => {
    element.parentelmnt.removeChild(element);
  });
  */

  const projecttitle = document.getElementById('project-title');
  projecttitle.innerHTML = "ProjectName: " + message.CurrentContent.name;
  //console.log(message.CurrentContent.backgroundurl);
  //console.log(message.CurrentContent.projectdata.backgroundurl);
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


ipcRenderer.on(RESET_MAP, (event, message) => {
  resetmap(); 
})

function resetmap()
{
  if (instance == null)
  {
    return;
  }

  instance.forcezoom({})  

  var test = instance.getzoom(
    {
      deltaScale: -1
    }
  )
  zoom = test[0];
}

function importnodes(database)
{
  //console.log(database.CurrentContent);
  database.CurrentContent.content.nodes.forEach(element => {
    createnode(element.location.x,element.location.y,element.id, element.locked);
  });
  //createnode(rightClickPosition.x,rightClickPosition.y,message);
}

function createnode(x,y, message,locked)
{
  var elmnt = document.getElementById("mapdiv")
  
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

  dragNode(img, elmnt);
  img.id = "node-icon";
  img.className = "node";
  img.setAttribute("Db-Path", message)
  img.setAttribute("locked", locked)

  elmnt.appendChild(img); 
    
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
}


function mousecreatenode(x,y, message)
{
  var elmnt = document.getElementById("mapdiv")
  
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

  dragNode(img, elmnt);
  img.id = "node-icon";
  img.setAttribute("Db-Path", message)
  img.setAttribute("locked", "false")
  img.className = "node";
  var modifiedzoom = 1 / zoom;

  
  var originx = elmnt.getBoundingClientRect().left;
  var originy = elmnt.getBoundingClientRect().top;
  

  var normalizedx = (x - originx);
  var multipliednormalizedx = (normalizedx * modifiedzoom) - 32;

  var normalizedy = (y - originy);
  var multipliednormalizedy = (normalizedy * modifiedzoom) - 32;

  elmnt.appendChild(img); 
    
  img.style.left = (multipliednormalizedx  + "px");
  img.style.top = (multipliednormalizedy  + "px");
  img.style.transform = `matrix(1.1, 0, 0, 1.1, 0, 0)`;

  data = {
    x:multipliednormalizedx,
    y:multipliednormalizedy,
    id:message
  };
  ipcRenderer.send(VERIFY_NODE, data);
}

ipcRenderer.on(CHANGE_MAP, (event, message) => {
  
  getFileFromUser();
})

ipcRenderer.on(DELETE_NODE, (event, message) => {
  node.parentNode.removeChild(node);
  document.getElementById("mapdiv").style.pointerEvents = 'auto';
})

var deactivatepanning = false;

ipcRenderer.on(TOGGLE_TEXT_EDITOR, (event, message) => {
  if (splitinstance.getSizes()[1] > 10)
  {
    splitinstance.setSizes([100, 0]);
  }
  else
  {
    splitinstance.setSizes([50, 50]);
  }
})

ipcRenderer.on(CREATE_NEW_NODE, (event, message) => {
  mousecreatenode(rightClickPosition.x,rightClickPosition.y,message);
})

ipcRenderer.on(TOGGLE_NODE, (event, message) => {
  togglenode(message.id, message.locked);
})

function togglenode(id, locked)
{
  //console.log(id + "----" + locked);
  var nodetotoggle = document.querySelector('[Db-Path="' + id +'"]');
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



function dragNode(buttonelmnt, parentelmnt){
  buttonelmnt.onmousedown = dragMouseDown; 

  function dragMouseDown(e) {
    e = e || window.event;

    if ((e.keyCode || e.which) == 3)
    {
      return;
    }
    //console.log(buttonelmnt.getAttribute("locked"));


    if (buttonelmnt.getAttribute("locked") == "true")
    {
      return;
    }

    e.preventDefault();

    parentelmnt.style.pointerEvents = 'none';

    document.body.appendChild(buttonelmnt);
    buttonelmnt.style.left = (e.clientX - 32) + "px";
    buttonelmnt.style.top = (e.clientY - 32) + "px";
    buttonelmnt.style.transform = `matrix(${zoom * 1.1}, 0, 0, ${zoom * 1.1}, 0, 0)`;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    buttonelmnt.style.left = (e.clientX - 32) + "px";
    buttonelmnt.style.top = (e.clientY - 32) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    parentelmnt.style.pointerEvents = 'auto';

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
      id:buttonelmnt.getAttribute("Db-Path"),
    };
    ipcRenderer.send(VERIFY_NODE, data);
  }
}

dragElement(document.getElementById("mapdiv"), document.getElementById("textcontainera"));

function dragElement(elmnt, textelmnt) {
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

    if (e.pageX > textelmnt.getBoundingClientRect().left)
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
    if (deactivatepanning) {return;}
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