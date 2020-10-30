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
   Databasetemplate,
   DatabaseNodeentry,
   DatabaseTextentry,
   SETGLOBAL_CHARGEN,
} = require('./utils/constants');
const { dir } = require('console');

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

   generatorwindow = new BrowserWindow({backgroundColor: '#2e2c29',width: 300, height: 600, maxWidth: 500, parent: win, frame: false, show:false, webPreferences: {
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
   buttons: ["Documents and Nodes","Just Nodes", "Cancel"],
   message: "Do you want to delete the attached documents as well?"
}

let backupoptions  = {
   buttons: ["Attempt project recovery.","Continue"],
   message: "DMmaps closed unexpectedly last time, would you like to recover your project?"
}

function checkbackup()
{
   if (fs.existsSync(path.join( app.getAppPath(), '/backup.dmdb' ))) {
      dialog.showMessageBox(null, backupoptions).then( (data) => {
         if (data.response == 0) // load backup
         {
            fs.readFile(path.join( app.getAppPath(), '/backup.dmdb' ), 'utf-8', (err, data) => {
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
            fs.unlink(path.join( app.getAppPath(), '/backup.dmdb' ), (err) => {
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
                  break;
               }

               if (CurrentContent.content.nodes[i].documentref == docpath)
               {
                  CurrentContent.content.nodes[i].documentref = "";
                  count = count + 1;
                  updateproject();
                  continue;
               }

               if (CurrentContent.content.nodes[i].id == nodepath[0])
               {
                  CurrentContent.content.nodes[i].documentref = docpath;
                  count = count + 1;
                  updateproject();
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

         cleanproject();
         win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
         win.webContents.send(NOTIFY_UPDATECOMPLETE, "gottem");
      }); 
   });
}


function updaterenderer()
{
   win.webContents.send(PROJECT_INITIALIZED , CurrentContent);
}

function updateproject()
{
   dirtyproject = true;
   
   fs.writeFile(path.join( app.getAppPath(), '/backup.dmdb' ), JSON.stringify(CurrentContent, null, 2), (err) => {
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

   if (fs.existsSync(path.join( app.getAppPath(), '/backup.dmdb' ))) {
      fs.unlink(path.join( app.getAppPath(), '/backup.dmdb' ), (err) => {
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
   if (data.delta < 5)
   {
      reorder(CurrentContent.content.textEntries, getlocation(data.child), getlocation(data.parent))
      win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
      updateproject();
      //setupperchild(data);
   }
   else if (data.delta > 15)
   {
      reorder(CurrentContent.content.textEntries, getlocation(data.child), getlocation(data.parent) + 1)
      //setupperchild(data);
      win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
      updateproject();
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
         data.parent = CurrentContent.content.textEntries[i].parentid;
         setchild(data);
      }
   }
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

   for (var i = 0; i < CurrentContent.content.textEntries.length; i++)
   {
      if (CurrentContent.content.textEntries[i].id == data)
      {
         if (CurrentContent.content.textEntries[i].parentid != "")
         {
            reorder(CurrentContent.content.textEntries, i, getlocation(CurrentContent.content.textEntries[i].parentid) + 1);

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

   win.webContents.send(REFRESH_HIERARCHY, CurrentContent.content);
   updateproject();
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

               return;
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
      const choice = require('electron').dialog.showMessageBoxSync(this,
      {
         type: 'question',
         buttons: ['Yes', 'No'],
         title: 'Confirm',
         message: 'You have unsaved data, Are you sure you want to restart?'
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

   
   if (data.versionnumber == 0.1)
   {
      data.opendocs = [];
   }

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
