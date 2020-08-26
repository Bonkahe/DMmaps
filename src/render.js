const remote = require('electron'); // Load remote compnent that contains the dialog dependency
const { Menu} = remote; // Load the dialogs component of the OS
const { dialog, BrowserWindow, screen } = require('electron').remote
const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
const {ipcRenderer} = require('electron');
const { renderer } = require('./renderer');
const {
  SAVE_MAP_TO_STORAGE,
  CHANGE_MAP,
  CREATE_NEW_NODE,
  PROJECT_INITIALIZED,
  RESET_MAP,
}  = require('../utils/constants');

let rightClickPosition = null;
var zoom = 1;

window.addEventListener('contextmenu', (e) => {
  rightClickPosition = {x: e.x, y: e.y}
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
  const noprojectinfo = document.getElementById('no-project-info');
  noprojectinfo.style.display = 'none';

  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'none';

  const map = document.getElementById('mapdiv');
  map.style.display = 'block';
}

function switchtonomap()
{
  const noprojectinfo = document.getElementById('no-project-info');
  noprojectinfo.style.display = 'none';

  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'flex';

  const map = document.getElementById('mapdiv');
  map.style.display = 'none';
}


function switchtoblank()
{
  const noprojectinfo = document.getElementById('no-project-info');
  noprojectinfo.style.display = 'flex';

  const nomapinfo = document.getElementById('no-map-info');
  nomapinfo.style.display = 'none';

  const map = document.getElementById('mapdiv');
  map.style.display = 'none';
}



ipcRenderer.on(PROJECT_INITIALIZED, (event, message) => {
  const noprojectinfo = document.getElementById('no-project-info');
  noprojectinfo.style.display = 'none';
  const projecttitle = document.getElementById('project-title');
  projecttitle.innerHTML = "ProjectName: " + message.CurrentContent.projectdata.name;

  //console.log(message.CurrentContent.projectdata.backgroundurl);
  if (message.CurrentContent.projectdata.backgroundurl == "")
  {
    switchtonomap();
  }
  else
  {
    const map = document.getElementById('map');

    map.src = message.CurrentContent.projectdata.backgroundurl;
    switchtomap();
  }
})

ipcRenderer.on(RESET_MAP, (event, message) => {
  var elmnt = document.getElementById("mapdiv")
  elmnt.style.left = 0 + "px";
  elmnt.style.top = 0 + "px";
})

ipcRenderer.on(CHANGE_MAP, (event, message) => {
  getFileFromUser();
})

ipcRenderer.on(CREATE_NEW_NODE, (event, message) => {
  var elmnt = document.getElementById("mapdiv")
  
  var img = document.createElement('button'); 
  img.addEventListener("click", function() {
    clickednode(img);
  });
  
  img.id = "node-icon";
  img.setAttribute("Db-Path", "nothingyet")
  var modifiedzoom = 1 / zoom;

  //var previousorigin = elmnt.style.transformOrigin;
  //var transforms = previousorigin.split("px");
  
  var originx = elmnt.getBoundingClientRect().left;
  var originy = elmnt.getBoundingClientRect().top;

  
  //var toriginx = parseFloat(transforms[0]);
  //var toriginy = parseFloat(transforms[1]);
  
  //var testx = toriginx - originx;
  //var testy = toriginy - originy;
  

  var normalizedx = (rightClickPosition.x - originx);
  var multipliednormalizedx = (normalizedx * modifiedzoom) - 32;

  var normalizedy = (rightClickPosition.y - originy);
  var multipliednormalizedy = (normalizedy * modifiedzoom) - 32;

  elmnt.appendChild(img); 
    
  img.style.left = (multipliednormalizedx  + "px");
  img.style.top = (multipliednormalizedy  + "px");

  //var nnormalizedx = (normalizedx + originx);

  //var nnormalizedy = (normalizedy + originy);


  //console.log(transforms);
  
/*
  img.onload=function() { 
    
        console.log("mousex:" + rightClickPosition.x)
        console.log(" -- originx:" + originx)
        console.log(" -- normalized:" + normalizedx)
        console.log(" -- modifiedzoom:" + modifiedzoom)
        console.log(" -- multipliednormalized:" + multipliednormalizedx)
        console.log(" -- final:" + (multipliednormalizedx - 32)  + "px");
    
    //console.log("test " + rightClickPosition.x + "/" + nnormalizedx + "----" + nnormalizedy + "/" + rightClickPosition.y);

    
    console.log("current origin:x" + originx + ".y" + originy + 
    " --current mouseloc:x" + rightClickPosition.x + ".y" + rightClickPosition.y + 
    " --current normalizedloc:x" + normalizedx + ".y" + normalizedy + 
    " --current finalMultiplied:x" + multipliednormalizedx + ".y" + multipliednormalizedy +
    " --current experiement1:x" + toriginx + ".y" + toriginy +
    " --current experiement3:" + modifiedzoom + "---" + zoom
    )
    
    elmnt.appendChild(img); 
    
    img.style.left = (multipliednormalizedx  + "px");
    img.style.top = (multipliednormalizedy  + "px");

    
    
    img.style.left = ((rightClickPosition.x - elmnt.offsetLeft) * modifiedzoom) - 32  + "px";
    img.style.top = ((rightClickPosition.y - elmnt.offsetTop) * modifiedzoom) - 32 + "px";
    
  } // assign before src
*/
})

function clickednode(elmnt)
{
  console.log("test");
}


// Make the DIV element draggable:
dragElement(document.getElementById("mapdiv"));


function dragElement(elmnt) {
  const instance = renderer({ scaleSensitivity: 10, minScale: .1, maxScale: 5, element: elmnt });

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
    if (e.type == "wheel") supportsWheel = true;
    else if (supportsWheel) return;
    /*
    var delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;

    var difference = elmnt.style.offsetWidth * 0.05;


    console.log(difference);

    //var mousePos = screen.getCursorScreenPoint();
    if (delta < 0)
    {      
      zoom = zoom + 0.05;
      if (zoom > 5) {
        zoom = 5;
      }
    }
    else if (delta > 0)
    {
      zoom = zoom - 0.05;
      if (zoom < 0.05) {
        zoom = 0.05;
      }
    }
    */
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
    
    //set div loc
    /*
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    */
    //scales in 0.05 increments only.




    //elmnt.style.transform = "scale(" + zoom + "," + zoom + ")";
  }

  // Add the event listeners for each event.
  document.addEventListener('wheel', DoSomething);
  document.addEventListener('mousewheel', DoSomething);
  document.addEventListener('DOMMouseScroll', DoSomething);

  function dragMouseDown(e) {
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