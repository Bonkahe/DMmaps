const {
   app, 
   BrowserWindow, 
   Menu, 
   ipcMain,
   dialog,
} = require('electron')
const url = require('url')
const path = require('path')
const {basename} = require('path')
const contextMenu = require('electron-context-menu');
const fs = require('fs');

let ActiveProject = false;

let CurrentContent = {
   projectdata:{
      projecturl: "",
      name: basename("NA"),
      backgroundurl: ""
   },
   content: [
      {
         textEntries: [
            {
               defaultentry: "NA"
            }
         ]
      }
   ]
}  

const {
   SAVE_MAP_TO_STORAGE,
   CHANGE_MAP,
   CREATE_NEW_NODE,
   PROJECT_INITIALIZED,
   RESET_MAP,
} = require('./utils/constants');

const dbpath = "";

contextMenu({
	prepend: (defaultActions, params, browserWindow) => [
		{
         label: 'Load Background Image',
         visible: ActiveProject === true,
         click: () => {
            win.webContents.send(CHANGE_MAP , );
         }
      },
      {
         label: 'Add Node',
         visible: params.mediaType === 'image',
         click: () => {
            win.webContents.send(CREATE_NEW_NODE , );
         }
      },
      {
         label: 'Reset Map',
         visible: ActiveProject === true,
         click: () => {
            win.webContents.send(RESET_MAP , );
         }
		}
	]
});



// Your code that starts a new application
let win;

function createWindow() {
   win = new BrowserWindow({backgroundColor: '#2e2c29', width: 1500, height: 1000,webPreferences: {
    nodeIntegration: true, enableRemoteModule: true
    }})
   win.loadURL(url.format ({
      pathname: path.join(__dirname, './src/index.html'),
      protocol: 'file:',
      slashes: true,
   }))
}

const template = [
   {
      label: 'File',
      submenu: [
         {
            label: 'New Project',
            click: () => { newproject() }
         },
         {
            label: 'Load Project',
            click: () => { loadproject(); }
         },
         {
            label: 'Save Project',
            click: () => { saveproject(); }
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


const newproject = async () => {
   let options = {
      title : "Choose new file path", 

      defaultPath : ".",
      
      buttonLabel : "Create Project",
      filters: [
         { name: 'DungeonMaster Database', extensions: ['dmdb'] }
       ],
      properties: ['openFile']
   }
   // Triggers the OS' Open File Dialog box. We also pass it as a Javascript
   // object of different configuration arguments to the function
 
   //This operation is asynchronous and needs to be awaited
   const filename = await dialog.showSaveDialog(win, options, {
       // The Configuration object sets different properties on the Open File Dialog 
       //properties: ['openDirectory']
   });
 
   // If we don't have any files, return early from the function
   if (!filename) {
       return;
   }

   let DefaultContent = {
      projectdata:{
            projecturl: filename.filePath,
            name: basename(filename.filePath, '.dmdb'),
            backgroundurl: ""
      },
      content: [
         {
            textEntries: [
               {
                  defaultentry: "You can add or remove entries as you like."
               }
            ]
         }
      ]
   }  

   let data = JSON.stringify(DefaultContent, null, 2);

   fs.writeFile(filename.filePath, data, (err) => {
      if(err){
          console.log("An error ocurred creating the file "+ err.message)
      }
                  
      console.log("The file has been succesfully saved");

      fs.readFile(filename.filePath, 'utf-8', (err, data) => {
         if(err){
            console.log("An error ocurred reading the file :" + err.message);
             return;
         }
   
         CurrentContent = JSON.parse(data);
         ActiveProject = true;
         updaterenderer();
      }); 
   });
}

const loadproject = async () => {
   let options = {
      title : "Choose a database", 

      defaultPath : ".",
      
      buttonLabel : "Load database",
      filters: [
         { name: 'DungeonMaster Database', extensions: ['dmdb'] }
       ],
      properties: ['openFile']
   }
   // Triggers the OS' Open File Dialog box. We also pass it as a Javascript
   // object of different configuration arguments to the function
 
   //This operation is asynchronous and needs to be awaited
   const filename = await dialog.showOpenDialog(win, options, {
      // The Configuration object sets different properties on the Open File Dialog
   });

 
   // If we don't have any files, return early from the function
   if (!filename.filePaths[0]) {
       return;
   }

   fs.readFile(filename.filePaths[0], 'utf-8', (err, data) => {
      if(err){
         console.log("An error ocurred reading the file :" + err.message);
          return;
      }

      CurrentContent = JSON.parse(data);
      ActiveProject = true;
      updaterenderer();
   }); 
}

function saveproject()
{
   if (!ActiveProject)
   {
      return;
   }

   //CurrentContent.projectdata.name = "newname";

   let data = JSON.stringify(CurrentContent, null, 2);

   fs.writeFile(CurrentContent.projectdata.projecturl, data, (err) => {
      if(err){
          console.log("An error ocurred creating the file "+ err.message)
      }
                  
      console.log("The file has been succesfully saved");
   });
}

function updaterenderer()
{
   win.webContents.send(PROJECT_INITIALIZED , {CurrentContent});
}

ipcMain.handle(SAVE_MAP_TO_STORAGE, async (event, mappath) => {
   if (ActiveProject)
   {
      CurrentContent.projectdata.backgroundurl = mappath;
      return true
   }
   else
   {
      return false
   }
 })



app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})
app.on('ready', createWindow)