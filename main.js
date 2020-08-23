const {
   app, 
   BrowserWindow, 
   Menu, 
   ipcMain
} = require('electron')
const url = require('url')
const path = require('path')
const contextMenu = require('electron-context-menu');
const {
   SAVE_PROJECT_TO_STORAGE,
   LOAD_PROJECT_FROM_STORAGE,
   CREATE_NEW_PROJECT,
} = require('./utils/constants');

// Add an item to the context menu that appears only when you click on an image
contextMenu({
	prepend: (params, browserWindow) => [{
		label: 'Rainbow',
		// Only show it when right-clicking images
		visible: params.mediaType === 'image'
	}]
});

// Your code that starts a new application
let win;

function createWindow() {
   win = new BrowserWindow({width: 800, height: 600,webPreferences: {
    nodeIntegration: true, enableRemoteModule: true
    }})
   win.loadURL(url.format ({
      pathname: path.join(__dirname, './src/index.html'),
      protocol: 'file:',
      slashes: true
   }))
}

const template = [
   {
      label: 'File',
      submenu: [
         {
            label: 'New Project',
            click: () => { win.webContents.send('newproject', 'Launchnewproject') }
         },
         {
            label: 'Load Project',
            click: () => { win.webContents.send(LOAD_PROJECT_FROM_STORAGE, 'ArtalacesMap.jpg') }
         },
         {
            label: 'Save Project',
            click: () => { win.webContents.send('saveproject', 'Launchsavewindow') }
         },
         {
            type: 'separator'
         },
         {
            role: 'close'
         }
      ]
   },
  {
      label: 'Edit',
      submenu: [
         {
            role: 'undo'
         },
         {
            role: 'redo'
         },
         {
            type: 'separator'
         },
         {
            role: 'cut'
         },
         {
            role: 'copy'
         },
         {
            role: 'paste'
         }
      ]
   },
   
   {
      label: 'View',
      submenu: [
         {
            role: 'reload'
         },
         {
            role: 'toggledevtools'
         },
         {
            type: 'separator'
         },
         {
            role: 'resetzoom'
         },
         {
            role: 'zoomin'
         },
         {
            role: 'zoomout'
         },
         {
            type: 'separator'
         },
         {
            role: 'togglefullscreen'
         }
      ]
   },
   {
      role: 'help',
      submenu: [
         {
            label: 'Learn More'
         }
      ]
   }
]
/* Replace showwindow with the constant of the ping to recieve from render commands.
ipcMain.on(SHOW_WINDOW, () => {
   showWindow();
});
*/
app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})
app.on('ready', createWindow)