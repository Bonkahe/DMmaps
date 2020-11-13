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
   SET_MOUSEMODE,
   NOT_ON_MAP,
   REFRESH_DATABASE,
   REFRESH_DATABASE_COMPLETE,
   REFRESH_PAGE,
   REFRESH_HIERARCHY,
   REQUEST_HIERARCHY_REFRESH,
   REFRESH_NODES,
   REQUEST_NODE_CONTEXT,
   REQUEST_EXTENDED_NODE_CONTEXT,
   REFRESH_DOCUMENTS,
   RELOAD_DOCUMENT,
   DELETE_NODE,
   VERIFY_NODE,
   CHANGE_NODE_ICON,
   SCALE_ALL_NODES,
   SCALE_ONE_NODE,
   CLEAR_NODE_SCALE,
   REQUEST_DOCUMENT_BYNODE,
   REQUEST_DOCUMENT_BYDOC,
   SAVE_DOCUMENT,
   NEW_DOCUMENT,
   CHILD_DOCUMENT,
   SELECT_DOCUMENT,
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
   EDITOR_UPDATEICONS,
   EDITOR_MEASUREMENTSETTINGS,
   TITLEBAR_OPEN_GENERATOR_WINDOW,
   UPDATE_THEME,
   EDITOR_SETPACK,
   EDITOR_CHECKBROKEN,
   Databasetemplate,
   DatabaseNodeentry,
   DatabaseTextentry,
   SETGLOBAL_CHARGEN,
} = require('../utils/constants');
const { dir } = require('console');
const { send } = require('process');

var cachePath = path.join( app.getPath('userData'), '/Cache/');
var nodepath = [];
var docpath = "";
var extendedcontext = false;
var docselected = false;

var nodemenu = false;
var notonmap = false;
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

if (!fs.existsSync(path.join( app.getPath('userData'), '/DmmapsSettings/'))){
   fs.mkdirSync(path.join( app.getPath('userData'), '/DmmapsSettings/'));
}

if (!fs.existsSync(path.join( app.getPath('userData'), '/Cache/'))){
   fs.mkdirSync(path.join( app.getPath('userData'), '/Cache/'));
}

clearCache();

function createWindow() {
   win = new BrowserWindow({backgroundColor: '#2e2c29', width: 1500, height: 1000, frame: false, webPreferences: {
    nodeIntegration: true, enableRemoteModule: true
    }})
   win.loadURL(url.format ({
      pathname: path.join(__dirname, './index.html'),
      protocol: 'file:',
      slashes: true,
   }))

   global.textwindow = win;

   win.on('close', function(e) 
   {
      if (dirtyproject)
      {
         const choice = dialog.showMessageBoxSync(this,
         {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'You have unsaved data, Are you sure you want to quit?'
         });
         if (choice === 1) {
            e.preventDefault();
         }
         else
         {
            cleanproject();
         }
      }
   });

   editorwindow = new BrowserWindow({backgroundColor: '#2e2c29',width: 450, height: 900, maxWidth: 600,  parent: win, frame: false, show:false, webPreferences: {
      nodeIntegration: true, enableRemoteModule: true
   }});
   editorwindow.loadURL(url.format ({
      pathname: path.join(__dirname, './editor.html'),
      protocol: 'file:',
      slashes: true,
   }));

   editorwindow.on('close', function(e) 
   {
      editorwindow.hide();
      win.focus();

      e.preventDefault();        
   });

   generatorwindow = new BrowserWindow({backgroundColor: '#2e2c29',width: 300, height: 600, maxWidth: 500, parent: win, frame: false, show:false, webPreferences: {
      nodeIntegration: true, enableRemoteModule: true
   }});
   generatorwindow.loadURL(url.format ({
      pathname: path.join(__dirname, './generator.html'),
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
   buttons: ["Delete Document","Don't Delete"],
   message: "Do you really want to delete this document?",
   defaultId: 1, // bound to buttons array
  }

let nodedeleteoptions  = {
   buttons: ["Documents and Nodes","Just Nodes", "Cancel"],
   message: "Do you want to delete the attached documents as well?",
   defaultId: 2, // bound to buttons array

}

let backupoptions  = {
   buttons: ["Attempt project recovery.","Continue"],
   message: "DMmaps closed unexpectedly last time, would you like to recover your project?"
}

function checkbackup()
{
   if (fs.existsSync(path.join( app.getPath('userData'), '/DmmapsSettings/backup.dmdb' ))) {
      dialog.showMessageBox(null, backupoptions).then( (data) => {
         if (data.response == 0) // load backup
         {
            fs.readFile(path.join( app.getPath('userData'), '/DmmapsSettings/backup.dmdb' ), 'utf-8', (err, data) => {
               if(err){
                  console.log("An error ocurred reading the file :" + err.message);
                   return;
               }
               Databasetemplate.fromjson(data);
               //CurrentContent.projecturl = filename.filePaths[0];
               updaterenderer();
               updateproject();
            }); 
         }
         else // delete backup
         {
            fs.unlink(path.join( app.getPath('userData'), '/DmmapsSettings/backup.dmdb' ), (err) => {
               if (err) {
                  //alert("An error ocurred updating the file" + err.message);
                  console.log(err);
                  return;
               }
               //console.log("File succesfully deleted");
            });
         }
      });
   } 
   else {
      //alert("This file doesn't exist, cannot delete");
      console.log("File doesn't exist.");
   }
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
         label: 'Select Mode',
         click: () => {
            win.webContents.send(SET_MOUSEMODE,0);
            //win.webContents.send(CHANGE_MAP , );
         }
      },
      {
         label: 'Measure Mode',
         click: () => {
            win.webContents.send(SET_MOUSEMODE,1);
            //win.webContents.send(CHANGE_MAP , );
         }
      },
      {
         label: 'Spline Mode',
         visible: docselected,
         click: () => {
            win.webContents.send(SET_MOUSEMODE,2);
            //win.webContents.send(CHANGE_MAP , );
         }
      },
      {
         type: 'separator',
      },
		{
         label: 'Load Background Image',
         visible: !notonmap,
         click: () => {
            win.webContents.send(CHANGE_MAP , );
         }
      },
      {
         label: 'Create Node',
         visible: (CurrentContent.backgroundurl != "" && !notonmap),
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

            win.webContents.send(CREATE_NEW_NODE , newnode);
            updateproject();
         }
      },
      {
         label: 'Reset Map',
         visible: (CurrentContent.backgroundurl != "" && !notonmap),
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
                  for (var o in nodepath)
                  {
                     for (var i = 0; i < CurrentContent.content.nodes.length; i++)
                     {
                        if (CurrentContent.content.nodes[i].id == nodepath[o])
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
                  }

                  win.webContents.send(DELETE_NODE, nodepath);

                  win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
                  updateproject();
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

            for (var j in nodepath)
            {
               for (var i = 0; i < CurrentContent.content.nodes.length; i++)
               {
                  if (CurrentContent.content.nodes[i].id == nodepath[j])
                  {
                     CurrentContent.content.nodes[i].locked = !CurrentContent.content.nodes[i].locked;
                     locked = CurrentContent.content.nodes[i].locked;
                     break;
                  }
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
                  updateproject();
                  break;
               }

               if (CurrentContent.content.nodes[i].documentref == docpath)
               {
                  CurrentContent.content.nodes[i].documentref = "";
                  count = count + 1;
                  continue;
               }

               if (CurrentContent.content.nodes[i].id == nodepath[0])
               {
                  CurrentContent.content.nodes[i].documentref = docpath;
                  count = count + 1;                  
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
      if (CurrentContent.content.nodes[i].id == nodepath[0])
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
      let tempdeleteoptions  = {
         buttons: ["Yes","No"],
         message: "You have unsaved data, do you wish to save first?",
         defaultId: 1, // bound to buttons array
      }
      dialog.showMessageBox(null, tempdeleteoptions).then( (data) => {
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

   if (CurrentContent.packmode)
   {
      verifyImages();
   }

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

         cleanproject();
         win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
         win.webContents.send(NOTIFY_UPDATECOMPLETE, "gottem");
      }); 
   });
}

const saveasprojectReturnUnpack = async () => {
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

   if (CurrentContent.packmode)
   {
      verifyImages();
   }

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

         cleanproject();
         win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
         win.webContents.send(NOTIFY_UPDATECOMPLETE, "gottem");
         convertDatabaseToUnpacked();
      }); 
   });
}


function updaterenderer()
{
   sendPack();
   win.webContents.send(PROJECT_INITIALIZED , CurrentContent);
}

function updateproject()
{
   dirtyproject = true;
   
   fs.writeFile(path.join( app.getPath('userData'), '/DmmapsSettings/backup.dmdb' ), JSON.stringify(CurrentContent, null, 2), (err) => {
      if(err){
          console.log("An error ocurred creating the file "+ err.message)
          return;
      }
      //console.log("File succesfully created")
   });
}

function cleanproject()
{
   dirtyproject = false;

   if (fs.existsSync(path.join(app.getPath('userData'), '/DmmapsSettings/backup.dmdb' ))) {
      fs.unlink(path.join( app.getPath('userData'), '/DmmapsSettings/backup.dmdb' ), (err) => {
          if (err) {
              //alert("An error ocurred updating the file" + err.message);
              console.log(err);
              return;
          }
          //console.log("File succesfully deleted");
      });
  } else {
      //alert("This file doesn't exist, cannot delete");
      //console.log("File doesn't exist.");
  }
  clearCache();
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
   //find and replace all img urls with data urls

   if (documentData == null)
   {
      return null;
   }
   else
   {

      if (CurrentContent.packmode)
      {
         //console.log("test1");
         documentData.content = buildCache(documentData.content);
      }

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
      if (CurrentContent.packmode)
      {
         //console.log("test1");
         documentData.content = buildCache(documentData.content);
      }

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
            if (CurrentContent.packmode)
            {
               //var test = packDocument(document.content);
               CurrentContent.content.textEntries[i].content = packDocument(document.content);
               clearCache();
               buildCache(CurrentContent.content.textEntries[i].content);
               win.webContents.send(RELOAD_DOCUMENT, CurrentContent.content.textEntries[i]);
            }
            

            win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
            updateproject();
            
            return true;
         }
      }
   }   

   return false;
})

ipcMain.handle(SAVE_MAP_TO_STORAGE, async (event, mappath) =>
{
   CurrentContent.backgroundurl = mappath;
   updateproject();
   return true;
})

ipcMain.on(REFRESH_DATABASE_COMPLETE, function(event) {
   //console.log("test");

   if (CurrentContent.projecturl == "")
   {
      saveasproject();
      return;
   }

   if (CurrentContent.packmode)
   {
      verifyImages();
   }
   //CurrentContent.projectdata.name = "newname";

   let data = JSON.stringify(CurrentContent, null, 2);
   //console.log("output:" + data);

   fs.writeFile(CurrentContent.projecturl, data, (err) => {
      if(err){
          console.log("An error ocurred creating the file "+ err.message)
      }
      cleanproject();
      win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
      console.log("The file has been succesfully saved");

      win.webContents.send(NOTIFY_UPDATECOMPLETE, "gottem");
   });
});

ipcMain.on(REFRESH_PAGE, function(event) {
   loadSettings();
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
   win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
   updateproject();
});

ipcMain.on(CHILD_DOCUMENT, function(event, data) 
{
   console.log(data);
   if (data.delta < 5)
   {
      reorder(CurrentContent.content.textEntries, getlocation(data.child), getlocation(data.parent))
      setupperchild(data);
   }
   else if (data.delta > 15)
   {
      reorder(CurrentContent.content.textEntries, getlocation(data.child), getlocation(data.parent) + 1)
      setupperchild(data);   
   }
   else
   {
      setchild(data);
   }
});

function getlocation(id)
{
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == id)
      {
         return i;
      }
   }
}

function reorder(input, from, to) {
   let numberOfDeletedElm = 1;
   if (from < to){
      to -= 1;
      if (to < 0){to = 0;}
   }
 
   const elm = input.splice(from, numberOfDeletedElm)[0];
 
   numberOfDeletedElm = 0;
 
   input.splice(to, numberOfDeletedElm, elm);
 }

function setupperchild(data)
{
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data.parent)
      {
         if (CurrentContent.content.textEntries[i].parentid != '')
         {
            data.parent = CurrentContent.content.textEntries[i].parentid;
            setchild(data);

            win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
            updateproject();  
         }
         else
         {
            reorderremoveParent(data);
            return;
         }
      }
   }
}

function reorderremoveParent(data)
{
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

            CurrentContent.content.textEntries[i].parentid = "";
         }
         break;
      }
   }   

   win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
   updateproject();
}

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

   win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
   updateproject();
}

ipcMain.on(REMOVE_PARENT_DOCUMENT, function(event, data) {
   removeParent(data);
});

function removeParent(data)
{
   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data)
      {
         if (CurrentContent.content.textEntries[i].parentid != "")
         {
            //reorder(CurrentContent.content.textEntries, i, getlocation(CurrentContent.content.textEntries[i].parentid) + 1);

            var huntdata = {
               child: data,
               parent: CurrentContent.content.textEntries[i].parentid
            }

            removechild(huntdata);         
            
            var parentid = CurrentContent.content.textEntries[i].parentid;
            CurrentContent.content.textEntries[i].parentid = "";   
            reorder(CurrentContent.content.textEntries, i, getlocation(parentid) + 1);
         }
         break;
      }
   }   

   win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
   updateproject();
}

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

               if (CurrentContent.content.textEntries[i].parentid != null)
               {
                  var huntdata = {
                     child: CurrentContent.content.textEntries[i].id,
                     parent: CurrentContent.content.textEntries[i].parentid
                  }
      
                  removechild(huntdata);
               }

               CurrentContent.content.textEntries.splice(i, 1);
               win.webContents.send(COMPLETE_DOCUMENT_DELETE);
               win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);

               break;
            }
         }

         for(var i in CurrentContent.content.nodes)
         {
            if (CurrentContent.content.nodes[i].documentref == docid)
            {
               CurrentContent.content.nodes[i].documentref = "";
               win.webContents.send(REFRESH_NODES, CurrentContent);
               break;
            }
         }
      }
   });
});

ipcMain.on(SELECT_DOCUMENT, function(event, value) {
   docselected = value;
})

ipcMain.on(REQUEST_EXTENDED_NODE_CONTEXT, function(event, data) {
   nodepath = data.nodes;
   docpath = data.docid;
   extendedcontext = true;
   nodemenu = true;
   notonmap = false;
   //data.nodes = selectednodeids
})

ipcMain.on(REQUEST_NODE_CONTEXT, function(event, data) {
   nodepath = data.nodes;
   extendedcontext = false;
   nodemenu = true;
   notonmap = false;
});

ipcMain.on(NOT_ON_MAP, function(event,message) {
   notonmap = message;
   extendedcontext = false;
   nodemenu = false;
})

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
        
         win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
         updateproject();
         return; //Stop this loop, we found it!
      }
    }
});

ipcMain.on(CHANGE_NODE_ICON, function(event, data) {
   for (var n in data.nodes)
   {
      for (var i in CurrentContent.content.nodes) {
         if (CurrentContent.content.nodes[i].id == data.nodes[n]) {
            //console.log(CurrentContent.content.nodes[i].tokenurl + "---" + data.url)
            CurrentContent.content.nodes[i].tokenurl = data.url;
            
            updateproject();
            break; //Stop this loop, we found it!
         }
      }
   }
})

ipcMain.on(SCALE_ALL_NODES, function(event, scale) {
   CurrentContent.nodescale = scale;
   updateproject();
})

ipcMain.on(SCALE_ONE_NODE, function(event, data) {
   for (var n in data.nodes)
   {
      for (var i in CurrentContent.content.nodes) {
         if (CurrentContent.content.nodes[i].id == data.nodes[n]) {
            
            CurrentContent.content.nodes[i].individualnodescale = data.scale;
            updateproject();
            break; //Stop this loop, we found it!
         }
      }
   }
   //win.webContents.send(REFRESH_NODES, CurrentContent);
})
/*
ipcMain.on(CLEAR_NODE_SCALE, function(event, data) {
   win.webContents.send(REFRESH_NODES, CurrentContent);
})
*/
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
   if (dirtyproject)
   {
      const choice = dialog.showMessageBoxSync(this,
      {
         type: 'question',
         buttons: ['Yes', 'No'],
         title: 'Confirm',
         message: 'You have unsaved data, Are you sure you want to restart?',
         defaultId: 1, // bound to buttons array
      });
      if (choice === 1) {
      }
      else
      {
         autoUpdater.quitAndInstall();
      }
   }
   else
   {
      autoUpdater.quitAndInstall();
   }
});

ipcMain.on(REQUEST_HIERARCHY_REFRESH, function(event, message) {
   CurrentContent.opendocs = message;   
   win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
   updateproject();
});


ipcMain.on(SETGLOBAL_CHARGEN, function(event) {
   updatechargenset = true;
})

ipcMain.on(EDITOR_MEASUREMENTSETTINGS, function(event, message) {

   if (message != null)
   {
      CurrentContent.measurementscale = message.length;
      CurrentContent.measurementtype = message.type;
      updateproject();
   }
   else
   {
      var editorinitializationdata = {
         icons: CurrentContent.availableicons
       };
       win.webContents.send(EDITOR_MEASUREMENTSETTINGS, editorinitializationdata);
   }
})

ipcMain.on(EDITOR_UPDATEICONS, function(event, message) {
   CurrentContent.availableicons = message;
   var editorinitializationdata = {
      icons: CurrentContent.availableicons
   };
   win.webContents.send(EDITOR_MEASUREMENTSETTINGS, editorinitializationdata);
   updateproject();
})

ipcMain.on(UPDATE_THEME, function(event, data) {
   if (data != null)
   {
      fs.writeFile(path.join( app.getPath('userData'), '/DmmapsSettings/themesettings.json') , JSON.stringify(data, null, 2), (err) => {
         if(err){
             console.log("An error ocurred creating the file "+ err.message)
             return;
         }
         loadSettings();        
      });
   }
   else
   {
      loadSettings();
   }
})

ipcMain.on(EDITOR_SETPACK, function(event, data) {
   CurrentContent.packmode = !CurrentContent.packmode;
   console.log(CurrentContent.packmode);

   if (CurrentContent.packmode)
   {
      convertDatabaseToPacked();
   }
   else
   {
      convertDatabaseToUnpacked();
   }

   sendPack();
   updaterenderer();
   updateproject();
})

function convertDatabaseToPacked()
{
   CurrentContent.packedimages = [];
   var imagesUrls = [];
   for (var i in CurrentContent.content.textEntries)
   {
      var currentImages = getAttrFromString(CurrentContent.content.textEntries[i].content, 'img', 'src');
      currentImages.forEach(element => {
         imagesUrls.push(element);
         var filename = element.substring(element.lastIndexOf("/") + 1, element.length);
         CurrentContent.content.textEntries[i].content = CurrentContent.content.textEntries[i].content.split(element).join(path.join(cachePath, filename).replace(/\\/g, '/'));
      });

   }

   imagesUrls.forEach(element => {
      var found = false;

      for (let otherelement of CurrentContent.packedimages)
      {
         if (element == otherelement.url)
         {
            found = true;
            break;
         }
      }
      
      if (!found)
      {
         var filename = element.substring(element.lastIndexOf("/") + 1, element.length);
         
         if (fs.existsSync(element)) {

            var newimageurl = {
               url: path.join(cachePath, filename).replace(/\\/g, '/'),
               data: fs.readFileSync(element, {encoding: 'base64'})
            }
            console.log(newimageurl.url)
            CurrentContent.packedimages.push(newimageurl);
            
         }
         else
         {
            var newimageurl = {
               url: path.join(cachePath, filename).replace(/\\/g, '/'),
               data: null
            }
   
            CurrentContent.packedimages.push(newimageurl);
         }
      }
   });
}

function getAttrFromString(str, node, attr) {
   var regex = new RegExp('<' + node + ' .*?' + attr + '="(.*?)"', "gi"), result, res = [];
   while ((result = regex.exec(str))) {
       res.push(result[1]);
   }

   return res;
}

function convertDatabaseToUnpacked()
{
   if (CurrentContent.projecturl == null || CurrentContent.projecturl == "")
   {
      let unpackoptions  = {
         buttons: ["Yes","No"],
         message: "You must save to unpack images, would you like to save and proceed?"
      }

      dialog.showMessageBox(null, unpackoptions).then( (data) => {
         if (data.response == 0)
         {
            saveasprojectReturnUnpack();
         }
         else
         {
            CurrentContent.packmode = true;
         }
      });

      return;
   }


   var folderpath = CurrentContent.projecturl.substring(0, CurrentContent.projecturl.lastIndexOf("/"));
   var projectname = CurrentContent.projecturl.substring(CurrentContent.projecturl.lastIndexOf("/") + 1, CurrentContent.projecturl.length).split('.').slice(0, -1).join('.');
   
   folderpath = path.join(folderpath, projectname + " unpacked data/");

   fs.mkdirSync(folderpath, { recursive: true })

   CurrentContent.packedimages.forEach(packedImage => {
      var filename = packedImage.url.substring(packedImage.url.lastIndexOf("/") + 1, packedImage.url.length);
      console.log(path.join(folderpath, filename).replace(/\\/g, '/'));

      fs.writeFile(path.join(folderpath, filename), packedImage.data, 'base64', function(err) {
         if (err)
         {
            console.log(err);
         }
      });

      CurrentContent.content.textEntries.forEach(documententry => {
         
         //var text = documententry.content;
         //var newpath = path.join(folderpath, filename);
         //text = text.split(packedImage.url).join(newpath.replace(/\\/g, '/'));
         documententry.content = documententry.content.split(packedImage.url).join(path.join(folderpath, filename).replace(/\\/g, '/'));
         //text = text.replaceAll(packedImage.url, path.join(folderpath, filename));
         //documententry.content = documententry.content.replaceAll(packedImage.url, path.join(folderpath, filename));
      });
   });
}

function getName() {
   var fullPath = document.getElementById("img1").src;
   var filename = fullPath.replace(/^.*[\\\/]/, '');
   // or, try this, 
   // var filename = fullPath.split("/").pop();

  document.getElementById("result").value = filename;
}

function sendPack()
{
   var editorupdatedata = {
      packtrue: CurrentContent.packmode
    }

   editorwindow.webContents.send(EDITOR_MEASUREMENTSETTINGS, editorupdatedata);
   win.webContents.send(EDITOR_MEASUREMENTSETTINGS, editorupdatedata);
}

function loadSettings()
{
   fs.readFile( path.join( app.getPath('userData'), '/DmmapsSettings/themesettings.json'), 'utf-8', (err, data) => {
      if(err){
         console.log("An error ocurred reading the file :" + err.message);
          return;
      }
      if (data != null)
      {
         editorwindow.webContents.send(UPDATE_THEME, JSON.parse(data));
         win.webContents.send(UPDATE_THEME, JSON.parse(data));
      }
  });

  sendPack();
}

function clearCache()
{
   fs.readdir(cachePath, (err, files) => {
      if (err) throw err;
    
      for (const file of files) {
        fs.unlink(path.join(cachePath, file), err => {
          if (err) throw err;
        });
      }
    });
}

var loadingimages = 0;

function buildCache(documentContents)
{
   var imagesUrls = [];   
   var currentImages = getAttrFromString(documentContents, 'img', 'src');
   currentImages.forEach(element => {
      imagesUrls.push(element);
   });

   imagesUrls.forEach(element => {
      //console.log(element);
      //console.log(CurrentContent.packedimages.length);
      for (let otherelement of CurrentContent.packedimages)
      {
         //console.log(otherelement.url);
         if (element == otherelement.url)
         {
            var filename = element.substring(element.lastIndexOf("/") + 1, element.length);
            //console.log(path.join(cachePath, filename));
            loadingimages = loadingimages + 1;
            fs.writeFile(path.join(cachePath, filename), otherelement.data, 'base64', function(err) {
               if (err)
               {
                  console.log(err);
               }
               loadingimages = loadingimages - 1;
            });

            documentContents = documentContents.split(element).join(path.join(cachePath, filename).replace(/\\/g, '/'));
            otherelement.url = path.join(cachePath, filename).replace(/\\/g, '/');
         }
      }
   });
   updateDocument();
   //console.log(documentContents);
   return documentContents;
}

function updateDocument()
{ 
   var id = setInterval(function()
   {
      win.webContents.send(REFRESH_DOCUMENTS);

      if(loadingimages <= 0)
      {
         clearInterval(id);
      }
   }, 100);
}

function packDocument(documentContents)
{
   var imagesUrls = getAttrFromString(documentContents, 'img', 'src');   

   imagesUrls.forEach(element => {
      var found = false;

      var filename = element.substring(element.lastIndexOf("/") + 1, element.length);
      var filepath = path.join(cachePath, filename).replace(/\\/g, '/');

      documentContents = documentContents.split(element).join(filepath);

      //console.log(element + " ----- " + filepath + " ------------- " + documentContents);
      
      for (let otherelement of CurrentContent.packedimages)
      {
         var otherfilename = otherelement.url.substring(otherelement.url.lastIndexOf("/") + 1, otherelement.url.length);
         if (otherfilename == filename)
         {
            found = true;
            break;
         }
      }

      if (!found)
      {
         if (fs.existsSync(element)) {
            var newimageurl = {
               url: filepath,
               data: fs.readFileSync(element, {encoding: 'base64'})
            }
   
            CurrentContent.packedimages.push(newimageurl);
         }
         else
         {
            var newimageurl = {
               url: filepath,
               data: null
            }
   
            CurrentContent.packedimages.push(newimageurl);
         }
      }
   });

   return documentContents;
}

function verifyImages()
{
   for (var i = CurrentContent.packedimages.length - 1; i >= 0; i--) {
      var returnLoop = false;
      for (var d in CurrentContent.content.textEntries)
      {
         var currentImages = getAttrFromString(CurrentContent.content.textEntries[d].content, 'img', 'src');

         for (var im in currentImages)
         {
            console.log(currentImages[im]);
            if (currentImages[im] == CurrentContent.packedimages[i].url)
            {
               returnLoop = true;
               break;
            }
         }

         if (returnLoop)
         {
            break;
         }
      }

      if (!returnLoop)
      {
         CurrentContent.packedimages.splice(i, 1);
      }

      returnLoop = false;
   }
}

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
   
   db.availableicons = data.availableicons;
   db.opendocs = data.opendocs;
   db.packmode = data.packmode;
   db.packedimages = data.packedimages;
   db.measurementscale = data.measurementscale;
   db.measurementtype = data.measurementtype;

   //backwards compatible;
   if (data.measurementscale == null){db.measurementscale = 1;}
   if (data.measurementtype == null){db.measurementtype = 0;}
   if (data.availableicons == null || data.availableicons.length < 10){db.availableicons = [
      './images/Tokens/House.png',
      './images/Tokens/PersonofInterest.png',
      './images/Tokens/Party.png',
      './images/Tokens/City.png',
      './images/Tokens/Outpost.png',
      './images/Tokens/Fortress.png',
      './images/Tokens/Ruins.png',
      './images/Tokens/Camp.png',
      './images/Tokens/Town.png',
      './images/Tokens/Flag.png',
      './images/Tokens/Cave.png'
   ];}

   db.versionnumber = data.versionnumber;

   if (data.versionnumber < 0.3)
   {
      db.opendocs = [];
      db.packmode = false;
      db.packedimages = [];
   }

   db.versionnumber = 0.3;

   //console.log(db.availableicons+"---"+data.availableicons)


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
      newnode.tokenurl = jsonnode.tokenurl;
      
      //console.log(db.availableicons);
      //console.log(newnode.tokenurl);
      //backwards compatible
      if (newnode.tokenurl == null){newnode.tokenurl = db.availableicons[0];}

      
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

   win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
}


/*
ipcMain.on('app_version', (event) => {
   event.sender.send('app_version', { version: app.getVersion() });
 });
*/



app.on('ready', () => {
   autoUpdater.checkForUpdatesAndNotify();
   checkbackup();
})
app.on('ready', createWindow)
