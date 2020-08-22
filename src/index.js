const {app, BrowserWindow, Menu, MenuItem} = require('electron')
const url = require('url')
const path = require('path')
const contextMenu = require('electron-context-menu');

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
      pathname: path.join(__dirname, 'index.html'),
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
            click: function(){
               console.log('test')
            }
         },
         {
            label: 'Load Project'
         },
         {
            label: 'Save Project'
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

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})
app.on('ready', createWindow)