const {
   app, 
   BrowserWindow, 
   Menu, 
   MenuItem,
   ipcMain,
   dialog,
   globalShortcut,
} = require('electron')
const url = require('url')
const path = require('path')
const {basename} = require('path')
const contextMenu = require('electron-context-menu');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

setInterval(() => {
   autoUpdater.checkForUpdatesAndNotify();
}, 1000 * 60 * 15);

//require('@treverix/remote/main').initialize()
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
   REQUEST_HIREARCHY_REFRESH,
   REFRESH_NODES,
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
   CHILD_DOCUMENT,
   MAIN_TO_RENDER_SETFOCUS,
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
   EDITOR_DOCSELECTED,
   EDITOR_DESELECT,
   TITLEBAR_OPEN_GENERATOR_WINDOW,
   Databasetemplate,
   DatabaseNodeentry,
   DatabaseTextentry,
   SETGLOBAL_CHARGEN,
} = require('./utils/constants');
const { data } = require('jquery');

var nodepath = "";
var docpath = "";
var extendedcontext = false;

var nodemenu = false;
//var debugmode = false;
//var downloadcomplete = false;
//var downloadstatus = "version: " + app.getVersion();
//var myItem;

let dirtyproject = false;
let CurrentContent = new Databasetemplate();

// Your code that starts a new application

global.win = null;
global.editorwindow = null;
global.generatorwindow = null;
global.updatechargenset = false;
var internaleditorshown = false;

function createWindow() {
   win = new BrowserWindow({backgroundColor: '#2e2c29', width: 1500, height: 1000, frame: false, webPreferences: {
    nodeIntegration: true, enableRemoteModule: true
    }})
   win.loadURL(url.format ({
      pathname: path.join(__dirname, './src/index.html'),
      protocol: 'file:',
      slashes: true,
   }))

   global.textwindow = win;

   win.on('close', function(e) 
   {
      if (dirtyproject)
      {
         const choice = require('electron').dialog.showMessageBoxSync(this,
         {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'You have unsaved data, Are you sure you want to quit?'
         });
         if (choice === 1) {
         e.preventDefault();
         }
      }
   });

   editorwindow = new BrowserWindow({backgroundColor: '#2e2c29',width: 300, height: 600,  parent: win, frame: false, show:false, webPreferences: {
      nodeIntegration: true, enableRemoteModule: true
   }});
   editorwindow.loadURL(url.format ({
      pathname: path.join(__dirname, './src/editor.html'),
      protocol: 'file:',
      slashes: true,
   }));

   editorwindow.on('close', function(e) 
   {
      editorwindow.hide();
      win.focus();

      e.preventDefault();        
   });

   generatorwindow = new BrowserWindow({backgroundColor: '#2e2c29',width: 300, height: 600,  parent: win, frame: false, show:false, webPreferences: {
      nodeIntegration: true, enableRemoteModule: true
   }});
   generatorwindow.loadURL(url.format ({
      pathname: path.join(__dirname, './src/generator.html'),
      protocol: 'file:',
      slashes: true,
   }));

   generatorwindow.on('close', function(e) 
   {
      generatorwindow.hide();
      win.focus();

      e.preventDefault();        
   });
}

function opentoolbarwindow()
{
   if (editorwindow.isVisible())
   {
      win.focus();
      editorwindow.hide();
   }
   else
   {
      editorwindow.show();
   }
}

function opengeneratorwindow()
{
   if (generatorwindow.isVisible())
   {
      win.focus();
      generatorwindow.hide();
   }
   else
   {
      generatorwindow.show();
   }
}


let deleteoptions  = {
   buttons: ["Yes","No"],
   message: "Do you really want to delete?"
  }

let nodedeleteoptions  = {
   buttons: ["Yes","No", "Cancel"],
   message: "Do you want to delete the attached document as well?"
}

contextMenu({
	prepend: (defaultActions, params, browserWindow) => [
      /*
      {
         label: 'stresstest',
         click: () => {
            win.webContents.send(NOTIFY_UPDATECOMPLETE , );
         }
      },
      */
		{
         label: 'Load Background Image',
         click: () => {
            win.webContents.send(CHANGE_MAP , );
         }
      },
      {
         label: 'Create Node',
         visible: CurrentContent.backgroundurl != "",
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
            
            /**TEST DOCUMENT CREATOR */
            var newdoc = new DatabaseTextentry();
            loop = true;
            var newr = 0;
            
            while(loop){
               newr = Math.random() * 10000;

               var ownerData = CurrentContent.content.textEntries.filter(function(doc) {
                  return doc.id === newr;
               })[0];
               //console.log(ownerData);
               if(ownerData == null)
               {
                  loop = false;
               }
            }

            newdoc.id = newr;

            /**Handles keeping the doc reference in the node */
            newnode.documentref = newr;

            CurrentContent.content.textEntries.push(newdoc);

            /** end region */

            CurrentContent.content.nodes.push(newnode);

            //console.log(newnode);

            var docnodepair = {
               doc: newdoc,
               node: newnode
            }

            win.webContents.send(CREATE_NEW_NODE , docnodepair);
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
            dialog.showMessageBox(null, nodedeleteoptions).then( (data) => {
               if (data.response != 2)
               {
                  for (var i = 0; i < CurrentContent.content.nodes.length; i++)
                  {
                     if (CurrentContent.content.nodes[i].id == nodepath)
                     {
                        if (data.response == 0 && CurrentContent.content.nodes[i].documentref != "")
                        {
                           for (var j = 0; j < CurrentContent.content.textEntries.length; j++)
                           {
                              if (CurrentContent.content.textEntries[j].id == CurrentContent.content.nodes[i].documentref)
                              {
                                 if (CurrentContent.content.textEntries[j].childdocuments.length > 0)
                                 {
                                    for (var k = 0; k < CurrentContent.content.textEntries[j].childdocuments.length; k++)
                                    {
                                       for (var l = 0; l < CurrentContent.content.textEntries.length; l++)
                                       {
                                          if (CurrentContent.content.textEntries[l].id == CurrentContent.content.textEntries[j].childdocuments[k])
                                          {
                                             CurrentContent.content.textEntries[l].parentid = "";
                                          }
                                       }
                                    }
                                 }
                                 CurrentContent.content.textEntries.splice(j, 1);
                              }
                           }
                        }

                        CurrentContent.content.nodes.splice(i, 1);
                        break;
                     }
                  }

                  win.webContents.send(DELETE_NODE, nodepath);

                  win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
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
      },
      {
         label: 'Bind node to Document',
         visible: (nodemenu === true && extendedcontext === true && !iscurrentdoc()),
         click: () => {
            var count = 0;
            for (var i = 0; i < CurrentContent.content.nodes.length; i++)
            {
               if (count == 2)
               {
                  break;
               }

               if (CurrentContent.content.nodes[i].documentref == docpath)
               {
                  CurrentContent.content.nodes[i].documentref = "";
                  count = count + 1;
                  dirtyproject = true;
                  continue;
               }

               if (CurrentContent.content.nodes[i].id == nodepath)
               {
                  CurrentContent.content.nodes[i].documentref = docpath;
                  count = count + 1;
                  dirtyproject = true;
                  continue;
               }
               
               
            }
            
            nodemenu = false;
            extendedcontext = false;

            win.webContents.send(REFRESH_NODES, CurrentContent);
         }
      }
	]
});

function iscurrentdoc()
{
   for (var i = 0; i < CurrentContent.content.nodes.length; i++)
   {
      if (CurrentContent.content.nodes[i].id == nodepath)
      {
         if (CurrentContent.content.nodes[i].documentref == docpath)
         {
            return true;
         }
         break;
      }
   }
   return false;
}


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
            saveproject(false, true);
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
            saveproject();
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
      CurrentContent.projecturl = filename.filePaths[0];
      updaterenderer();
   }); 
}

function saveproject()
{
   win.webContents.send(REFRESH_DATABASE);
}

const saveasproject = async () => {
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
                  
      //console.log("The file has been succesfully saved");

      fs.readFile(filename.filePath, 'utf-8', (err, data) => {
         if(err){
            console.log("An error ocurred reading the file :" + err.message);
             return;
         }

         dirtyproject = false;
         win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
         win.webContents.send(NOTIFY_UPDATECOMPLETE, "gottem");
      }); 
   });
}


function updaterenderer()
{
   win.webContents.send(PROJECT_INITIALIZED , CurrentContent);
}

ipcMain.handle(REQUEST_DOCUMENT_BYDOC, async (event, docid) =>
{
   var documentData;

   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == docid)
      {
         documentData = CurrentContent.content.textEntries[i];
         break;
      }
   }

   if (documentData == null)
   {
      return null;
   }
   else
   {
      return documentData;
   }
})

ipcMain.handle(REQUEST_DOCUMENT_BYNODE, async (event, nodeid) =>
{
   var ownerData;
   var documentData;
  
   for (var i =0; i < CurrentContent.content.nodes.length; i++)
   {
      if (CurrentContent.content.nodes[i].id == nodeid)
      {
         ownerData = CurrentContent.content.nodes[i];
         break;
      }
   }

   if (ownerData == null)
   {
      return null;
   }

   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == ownerData.documentref)
      {
         documentData = CurrentContent.content.textEntries[i];
         break;
      }
   }

   if (documentData == null)
   {
      return null;
   }
   else
   {
      //global.editorwin.webContents.send(EDITOR_DOCSELECTED, documentData);
      return documentData;
   }
})

ipcMain.handle(SAVE_DOCUMENT, async (event, document) =>
{
   //console.log(document);
   //console.log(CurrentContent.content.textEntries);
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == document.id)
      {
         //console.log("found id " + document.id);
         if (CurrentContent.content.textEntries[i].content != document.content 
            || CurrentContent.content.textEntries[i].name != document.name 
            || CurrentContent.content.textEntries[i].drawing != document.drawing)
         {
            CurrentContent.content.textEntries[i].name = document.name;
            CurrentContent.content.textEntries[i].content = document.content;
            CurrentContent.content.textEntries[i].drawing = document.drawing;
            //console.log(document.drawing);

            win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
            dirtyproject = true;
            
            return true;
         }
      }
   }   

   return false;
})

ipcMain.handle(SAVE_MAP_TO_STORAGE, async (event, mappath) =>
{
   CurrentContent.backgroundurl = mappath;
   dirtyproject = true;
   return true;
})

ipcMain.on(REFRESH_DATABASE_COMPLETE, function(event) {
   //console.log("test");

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
      win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
      console.log("The file has been succesfully saved");

      win.webContents.send(NOTIFY_UPDATECOMPLETE, "gottem");
   });
});

ipcMain.on(REFRESH_PAGE, function(event) {
   updaterenderer();
});

ipcMain.on(NEW_DOCUMENT, function(event, selectedid) {
   var newdoc = new DatabaseTextentry();
   loop = true;
   var newr = 0;
   
   while(loop){
      newr = Math.random() * 10000;

      var ownerData = CurrentContent.content.textEntries.filter(function(doc) {
         return doc.id === newr;
      })[0];
      //console.log(ownerData);
      if(ownerData == null)
      {
         loop = false;
      }
   }
   newdoc.id = newr;
   //console.log(newdoc);
   if (selectedid != "" && selectedid != null)
   {
      newdoc.parentid = selectedid;
   }
   var huntdata = {
      child: newr,
      parent: selectedid
   }

   addchild(huntdata);

   CurrentContent.content.textEntries.push(newdoc);
   win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
   dirtyproject = true;
});

ipcMain.on(CHILD_DOCUMENT, function(event, data) 
{
   setchild(data);
});

function setchild(data)
{
   //console.log(data);
   var done = 0;
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data.child)
      {
         if (CurrentContent.content.textEntries[i].parentid != "")
         {
            var huntdata = {
               child: data.child,
               parent: CurrentContent.content.textEntries[i].parentid
            }

            removechild(huntdata);
         }


         if (CurrentContent.content.textEntries[i].childdocuments.length > 0)
         {
            for (var j = 0; j < CurrentContent.content.textEntries[i].childdocuments.length; j++)
            {
               if (CurrentContent.content.textEntries[i].childdocuments[j] == data.parent)
               {
                  CurrentContent.content.textEntries[i].childdocuments.splice(j, 1);
               }
            }
         }

         CurrentContent.content.textEntries[i].parentid = data.parent;
         done = done + 1;
      }

      if (CurrentContent.content.textEntries[i].id == data.parent)
      {
         if (CurrentContent.content.textEntries[i].parentid == data.child)
         {
            CurrentContent.content.textEntries[i].parentid = "";
         }

         CurrentContent.content.textEntries[i].childdocuments.push(data.child);
         done = done + 1;
      }

      if (done > 2)
      {
         break;
      }
   }   

   win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
   dirtyproject = true;
}

ipcMain.on(REMOVE_PARENT_DOCUMENT, function(event, data) {

   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data)
      {
         if (CurrentContent.content.textEntries[i].parentid != "")
         {
            var huntdata = {
               child: data,
               parent: CurrentContent.content.textEntries[i].parentid
            }

            removechild(huntdata);
         }

         CurrentContent.content.textEntries[i].parentid = "";
         break;
      }
   }   

   win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
   dirtyproject = true;
});

ipcMain.on(DELETE_DOCUMENT, function(event, docid) {
   dialog.showMessageBox(null, deleteoptions).then( (data) => {
      if (data.response == 0)
      {
         for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
         {
            if (CurrentContent.content.textEntries[i].id == docid)
            {
               if (CurrentContent.content.textEntries[i].childdocuments != null)
               {
                  for (var j = 0; j < CurrentContent.content.textEntries[i].childdocuments.length; j++)
                  {
                     for (var k = 0; k < CurrentContent.content.textEntries.length; k++)
                     {
                        if (CurrentContent.content.textEntries[i].childdocuments[j] == CurrentContent.content.textEntries[k].id)
                        {
                           CurrentContent.content.textEntries[k].parentid = "";
                        }
                     }
                  }
               }
               CurrentContent.content.textEntries.splice(i, 1);
               win.webContents.send(COMPLETE_DOCUMENT_DELETE);
               win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);

               return;
            }
         }
      }
   });
   
});

ipcMain.on(REQUEST_EXTENDED_NODE_CONTEXT, function(event, data) {
   nodepath = data.nodeid;
   docpath = data.docid;
   extendedcontext = true;
   nodemenu = true;
})

ipcMain.on(REQUEST_NODE_CONTEXT, function(event, message) {
   nodepath = message;
   nodemenu = true;
});

ipcMain.on(VERIFY_NODE, function(event, data) {
   for (var i in CurrentContent.content.nodes) {
      if (CurrentContent.content.nodes[i].id == data.id) {
         CurrentContent.content.nodes[i].location = {x: data.x, y: data.y}
         
         if(data.parentid != null)
         {
            var docdata = {
               child: CurrentContent.content.nodes[i].documentref,
               parent: data.parentid
            }
             
            setchild(docdata)
            win.webContents.send(MAIN_TO_RENDER_SETFOCUS, docdata.child);
            return;
         }

         win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
         dirtyproject = true;
         return; //Stop this loop, we found it!
      }
    }
});

ipcMain.on(SCALE_ALL_NODES, function(event, scale) {
   CurrentContent.nodescale = scale;
   dirtyproject = true;
})

ipcMain.on(SCALE_ONE_NODE, function(event, data) {
   for (var i in CurrentContent.content.nodes) {
      if (CurrentContent.content.nodes[i].id == data.id) {
         
         CurrentContent.content.nodes[i].individualnodescale = data.scale;
         dirtyproject = true;
         return; //Stop this loop, we found it!
      }
    }
})

ipcMain.on(CLEAR_NODE_SCALE, function(event, data) {
   win.webContents.send(REFRESH_NODES, CurrentContent);
})

/** ---------------------------   TITLE BAR IPCS   ----------------------------- */

ipcMain.on(TITLEBAR_NEWPROJECT, function(event) {
   newproject()
});

ipcMain.on(TITLEBAR_LOADPROJECT, function(event) {
   loadproject();
});

ipcMain.on(TITLEBAR_SAVEPROJECT, function(event) {
   win.webContents.send(NOTIFY_UPDATEDOWNLOADING, "Saving Database... ");
   saveproject();
});

ipcMain.on(TITLEBAR_SAVEASPROJECT, function(event) {
   win.webContents.send(NOTIFY_UPDATEDOWNLOADING, "Saving Database... ");
   saveasproject();
});

ipcMain.on(TITLEBAR_CLOSE, function(event) {
   win.close();
});

ipcMain.on(TITLEBAR_CHECKFORUPDATES, function(event) {
  autoUpdater.checkForUpdates(RETRIEVE_VERSION).then((result) => {
   win.webContents.send(NOTIFY_CURRENTVERSION);
 })
});

ipcMain.on(TITLEBAR_OPENWINDOW, function(event) {
   opentoolbarwindow();
});

ipcMain.on(TITLEBAR_OPEN_GENERATOR_WINDOW, function(event) {
   opengeneratorwindow();
});

ipcMain.handle(RETRIEVE_VERSION, async (event) =>
{
   return app.getVersion();
})

autoUpdater.on('update-available', () => {
   win.webContents.send(NOTIFY_UPDATEDOWNLOADING, "Downloading... ");
});
 
autoUpdater.on('update-downloaded', () => {
   win.webContents.send(NOTIFY_UPDATECOMPLETE);
});

ipcMain.on(NOTIFY_RESTART, function(event) {
   autoUpdater.quitAndInstall()
});

ipcMain.on(REQUEST_HIREARCHY_REFRESH, function(event) {
   win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
});


ipcMain.on(SETGLOBAL_CHARGEN, function(event) {
   updatechargenset = true;
})



/** ---------------------------   Document editor functions   ----------------------------- */

function addchild(data)
{
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data.parent)
      {
         CurrentContent.content.textEntries[i].childdocuments.push(data.child); 
      }
   }  
}

function removechild(data)
{
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data.parent)
      {
         for (var k = 0; k < CurrentContent.content.textEntries[i].childdocuments.length; k++)
         {
            if (CurrentContent.content.textEntries[i].childdocuments[k] == data.child)
            {
               CurrentContent.content.textEntries[i].childdocuments.splice(k, 1);
               return;
            }
         }   
      }
   }   
}

function removeparent(data)
{
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data)
      {
         CurrentContent.content.textEntries[i].parentid = "";
      }
   } 
}

/** ---------------------------   END -- Document editor functions   ----------------------------- */

Databasetemplate.fromjson = function(json)
{
   //console.log(json);
   var data = JSON.parse(json);
   //console.log(data);
   db = new Databasetemplate;
   db.projecturl = data.projecturl;
   db.backgroundurl = data.backgroundurl;
   db.name = data.name;
   db.nodescale = data.nodescale;

   data.content.textEntries.forEach(jsondoc => {
      var newdoc = new DatabaseTextentry();
      newdoc.parentid = jsondoc.parentid;
      newdoc.id = jsondoc.id;
      newdoc.name = jsondoc.name;
      newdoc.content = jsondoc.content;
      newdoc.childdocuments = jsondoc.childdocuments;
      newdoc.drawing = jsondoc.drawing;
      db.content.textEntries.push(newdoc);
   });

   data.content.nodes.forEach(jsonnode => {
      var newnode = new DatabaseNodeentry();
      newnode.id = jsonnode.id;
      newnode.location = jsonnode.location;
      newnode.documentref = jsonnode.documentref;
      newnode.locked = jsonnode.locked;
      newnode.individualnodescale = jsonnode.individualnodescale;
      newnode.nodetoken = jsonnode.nodetoken;
      db.content.nodes.push(newnode);
      //console.log(newnode);
   });

   CurrentContent = db;
}


function stresstest()
{
   win.webContents.openDevTools();

   for (var i = 0; i < 100000; i++)
   {
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
      
      /**TEST DOCUMENT CREATOR */
      var newdoc = new DatabaseTextentry();
      loop = true;
      var newr = 0;
      
      while(loop){
         newr = Math.random() * 10000;

         var ownerData = CurrentContent.content.textEntries.filter(function(doc) {
            return doc.id === newr;
         })[0];
         //console.log(ownerData);
         if(ownerData == null)
         {
            loop = false;
         }
      }

      newdoc.id = newr;
      newdoc.content = Math.random() * 1000000;

      /**Handles keeping the doc reference in the node */
      newnode.documentref = newr;

      CurrentContent.content.textEntries.push(newdoc);

      /** end region */

      CurrentContent.content.nodes.push(newnode);
   }

   win.webContents.send(REFRESH_HIREARCHY, CurrentContent.content);
}


/*
ipcMain.on('app_version', (event) => {
   event.sender.send('app_version', { version: app.getVersion() });
 });
*/



app.on('ready', () => {
   autoUpdater.checkForUpdatesAndNotify();
})
app.on('ready', createWindow)
