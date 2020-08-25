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

let CurrentContent = {
   projectdata: [
      {
         name: basename("NA"),
         backgroundurl: ""
      }
   ],
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
   SAVE_PROJECT_TO_STORAGE,
   LOAD_PROJECT_FROM_STORAGE,
   CREATE_NEW_PROJECT,
   PROJECT_INITIALIZED,
} = require('./utils/constants');

const dbpath = "";

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
      projectdata: [
         {
            name: basename(filename.filePath, '.dmdb'),
            backgroundurl: ""
         }
      ],
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
   });

   currentContent = DefaultContent;
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
   if (!filename) {
       return;
   }

   fs.readFile(filename.filePaths[0], 'utf-8', (err, data) => {
      if(err){
         console.log("An error ocurred reading the file :" + err.message);
          return;
      }

      // Change how to handle the file content
      const loadedUsers = JSON.parse(data);
    //console.log(loadedUsers);

    console.log(loadedUsers);
  });
}

function saveproject()
{

}

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