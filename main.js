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

const {
   SAVE_MAP_TO_STORAGE,
   CHANGE_MAP,
   CREATE_NEW_NODE,
   PROJECT_INITIALIZED,
   RESET_MAP,
   REQUEST_NODE_CONTEXT,
   DELETE_NODE,
   VERIFY_NODE,
   TOGGLE_NODE,
   Databasetemplate,
   DatabaseNodeentry,
   DatabaseTextentry
} = require('./utils/constants');

const dbpath = "";
var nodepath = "";
var nodemenu = false;

let dirtyproject = false;

let CurrentContent = new Databasetemplate();



let deleteoptions  = {
   buttons: ["Yes","No","Cancel"],
   message: "Do you really want to delete?"
  }

contextMenu({
	prepend: (defaultActions, params, browserWindow) => [
		{
         label: 'Load Background Image',
         click: () => {
            win.webContents.send(CHANGE_MAP , );
         }
      },
      {
         label: 'Create Node',
         visible: CurrentContent.backgroundurl != "",
         visible: params.mediaType === 'image',
         click: () => {
            var newnode = new DatabaseNodeentry();
            //console.log(CurrentContent);
            var loop = true;
            var r = 0;
            
            while(loop){
               r = Math.random() * 10000;

               var ownerData = CurrentContent.content.nodes.filter(function(node) {
                  return node.id === r;
               })[0];
               //console.log(ownerData);
               if(ownerData == null)
               {
                  loop = false;
               }
            }

            newnode.id = r;

            CurrentContent.content.nodes.push(newnode);

            //console.log(newnode);

            win.webContents.send(CREATE_NEW_NODE , r);
            dirtyproject = true;
         }
      },
      {
         label: 'Reset Map',
         visible: CurrentContent.backgroundurl != "",
         click: () => {
            win.webContents.send(RESET_MAP , );
         }
      },
      {
         type: 'separator',
         visible: nodemenu === true,
      },
      {
         label: 'Delete Node',
         visible: nodemenu === true,
         click: () => {
            dialog.showMessageBox(null, deleteoptions).then( (data) => {
               if (data.response == 0)
               {
                  for (var i = 0; i < CurrentContent.content.nodes.length; i++)
                  {
                     if (CurrentContent.content.nodes[i].id == nodepath)
                     {
                        CurrentContent.content.nodes.splice(i, 1);
                        break;
                     }
                  }

                  win.webContents.send(DELETE_NODE, nodepath);
                  dirtyproject = true;
               }
             });
            /*
            dialog.showMessageBox(deleteoptions, (response, checkboxChecked) => {
               win.webContents.send(DELETE_NODE, nodepath);
            })
            */
            nodemenu = false;
         }
      },
      {
         label: 'Lock/Unlock Node',
         visible: nodemenu === true,
         click: () => {
            var locked = false;

            for (var i = 0; i < CurrentContent.content.nodes.length; i++)
            {
               if (CurrentContent.content.nodes[i].id == nodepath)
               {
                  CurrentContent.content.nodes[i].locked = !CurrentContent.content.nodes[i].locked;
                  locked = CurrentContent.content.nodes[i].locked;
                  break;
               }
            }

            var data = {
               locked: locked,
               id: nodepath
            }

            win.webContents.send(TOGGLE_NODE, data);
            /*
            dialog.showMessageBox(deleteoptions, (response, checkboxChecked) => {
               win.webContents.send(DELETE_NODE, nodepath);
            })
            */
            nodemenu = false;
         }
      }
	]
});



// Your code that starts a new application
let win;

function createWindow() {
   win = new BrowserWindow({backgroundColor: '#2e2c29', width: 1500, height: 1000, webPreferences: {
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
            click: () => { saveproject(); },
            accelerator: 'CommandOrControl+S'
         },
         {
            label: 'Save Project As',
            click: () => { saveasproject(); },
            accelerator: 'CommandOrControl+Shift+S'
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
   if (dirtyproject)
   {
      let deleteoptions  = {
         buttons: ["Yes","No"],
         message: "You have unsaved data, do you wish to save first?"
      }
      dialog.showMessageBox(null, deleteoptions).then( (data) => {
         if (data.response == 0)
         {
            saveasproject(false, true);
         }
         else
         {
            CurrentContent = new Databasetemplate();
            updaterenderer();
         }
      });
   }
   else
   {
      CurrentContent = new Databasetemplate();
      updaterenderer();
   }
   

   /*
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
   CurrentContent.name = basename(filename.filePath, '.dmdb');
   CurrentContent.projecturl = filename.filePath;

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

         
         updaterenderer();
      }); 
   });
   */
}

function loadproject()
{
   if (dirtyproject)
   {
      let deleteoptions  = {
         buttons: ["Yes","No"],
         message: "You have unsaved data, do you wish to save first?"
      }
      dialog.showMessageBox(null, deleteoptions).then( (data) => {
         if (data.response == 0)
         {
            saveasproject(true, false);
            return;
         }
         else
         {
            deeploadproject();
         }
      });
   }
   else
   {
      deeploadproject();
   }
}

const deeploadproject = async () => {

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
      Databasetemplate.fromjson(data);
      updaterenderer();
   }); 
}

const saveasproject = async (load, newfile) => {
   let options = {
      title : "Save as", 

      defaultPath : ".",
      
      buttonLabel : "Save Project",
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
   CurrentContent.name = basename(filename.filePath, '.dmdb');
   CurrentContent.projecturl = filename.filePath;

   let data = JSON.stringify(CurrentContent, null, 2);

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

         dirtyproject = false;

         if (load == true)
         {
            deeploadproject();
         }
         if (newfile == true)
         {
            newproject();
         }
      }); 
   });
}

function saveproject()
{
   if (CurrentContent.projecturl == "")
   {
      saveasproject();
      return;
   }

   //CurrentContent.projectdata.name = "newname";

   let data = JSON.stringify(CurrentContent, null, 2);
   //console.log("output:" + data);

   fs.writeFile(CurrentContent.projecturl, data, (err) => {
      if(err){
          console.log("An error ocurred creating the file "+ err.message)
      }
      dirtyproject = false;
      console.log("The file has been succesfully saved");
   });
}

function updaterenderer()
{
   win.webContents.send(PROJECT_INITIALIZED , {CurrentContent});
}

ipcMain.handle(SAVE_MAP_TO_STORAGE, async (event, mappath) =>
{
   CurrentContent.backgroundurl = mappath;
   dirtyproject = true;
   return true;
})

ipcMain.on(REQUEST_NODE_CONTEXT, function(event, message) {
   nodepath = message;
   nodemenu = true;
});

ipcMain.on(VERIFY_NODE, function(event, data) {
   for (var i in CurrentContent.content.nodes) {
      if (CurrentContent.content.nodes[i].id == data.id) {
         CurrentContent.content.nodes[i].location = {x: data.x, y: data.y}
         //console.log(CurrentContent.content.nodes[i].location);
         dirtyproject = true;
         break; //Stop this loop, we found it!
      }
    }
});

Databasetemplate.fromjson = function(json)
{
   //console.log(json);
   var data = JSON.parse(json);
   //console.log(data);
   db = new Databasetemplate;
   db.projecturl = data.projecturl;
   db.backgroundurl = data.backgroundurl;
   db.name = data.name;

   data.content.textEntires.forEach(jsondoc => {
      var newdoc = new DatabaseTextentry();
      newdoc.id = jsondoc.id;
      newdoc.content = jsondoc.content;
      db.content.textEntires.push(newdoc);
   });

   data.content.nodes.forEach(jsonnode => {
      var newnode = new DatabaseNodeentry();
      newnode.id = jsonnode.id;
      newnode.location = jsonnode.location;
      newnode.documentrefs = jsonnode.documentrefs;
      newnode.locked = jsonnode.locked;
      db.content.nodes.push(newnode);
      //console.log(newnode);
   });

   CurrentContent = db;
}


app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})
app.on('ready', createWindow)
