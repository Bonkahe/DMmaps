const remote = require('electron'); // Load remote compnent that contains the dialog dependency
const { Menu} = remote; // Load the dialogs component of the OS
const { dialog, BrowserWindow, screen } = require('electron').remote
const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
const {ipcRenderer} = require('electron');
const {
  SAVE_PROJECT_TO_STORAGE,
  LOAD_PROJECT_FROM_STORAGE,
  CREATE_NEW_PROJECT,
  PROJECT_INITIALIZED,
}  = require('../utils/constants');

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
  if (!files) {
      return;
  }

  // Pulls the first file out of the array

  //const file = files[0];
  // Reads from the file and converts the resulting buffer to a string
  //const content = fs.readFileSync(file).toString();

  // Log the Files to the Console
  console.log(files)
  console.log(files.filePaths[0])
}



ipcRenderer.on(PROJECT_INITIALIZED, (event, message) => {
  const info = document.getElementById('no-project-info');
  info.style.display = 'none';
  //console.log('newprojectloaded')
  let options = {properties:["multiSelections","openFile"]}

  let filePaths = dialog.showOpenDialog(options)
  console.log(filePaths);
})

// Make the DIV element draggable:
dragElement(document.getElementById("mapdiv"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  var zoom = 1;

  /* The flag that determines whether the wheel event is supported. */
  var supportsWheel = false;

  /* The function that will run when the events are triggered. */
  function DoSomething (e) {
    /* Check whether the wheel event is supported. */
    if (e.type == "wheel") supportsWheel = true;
    else if (supportsWheel) return;

    /* Determine the direction of the scroll (< 0 → up, > 0 → down). */
    var delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;

    //var mousePos = screen.getCursorScreenPoint();

    /* ... */
    if (delta < 0)
    {
      zoom = zoom + 0.1;
      elmnt.style.transform = "scale(" + zoom + "," + zoom + ")";
    }
    else if (delta > 0)
    {
      zoom = zoom - 0.1;
      if (zoom <= 0.1) {
        zoom = 0.1;
      }
      elmnt.style.transform = "scale(" + zoom + "," + zoom + ")";
    }
  }

  /* Add the event listeners for each event. */
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


//USE FOR REFERENCE!

/**    
 * <hr>
      <video></video>
      <button id ="startBtn" class="button is-primary">Start</button>
      <button id ="stopBtn" class="button is-warning">Stop</button>
    </hr>

    <button id="videoSelectBtn" class="button is-text"> Choose a video source</button>
     */
/*
const { desktopCapturer, remote } = require('electron');

const { writeFile } = require('fs');

const { dialog, Menu } = remote;

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );


  videoOptionsMenu.popup();
}

// Change the videoSource window to record
async function selectSource(source) {

  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }

}
*/