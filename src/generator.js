const {remote, ipcRenderer} = require('electron');
const app = require('electron').remote.app;
const { Menu, MenuItem} = remote;
const { dialog, getCurrentWindow, BrowserWindow, screen } = require('electron').remote
const fs = require('fs');
const { renderer } = require('./renderer');
window.$ = window.jQuery = require('jquery');
const Split = require('split.js');
const customTitlebar = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');
const jscolor = require('./colorpicker/jscolor');
var glob = require("glob")
const { GoogleSpreadsheet } = require('google-spreadsheet');
//const creds = require('./vitaedatabase-a2beb10b1687.json'); // the file saved above
const { clipboard } = require('electron')
var faker = require('./char/faker.js');
var xlsx = require('node-xlsx').default

const {
    SETGLOBAL_CHARGEN,
    TITLEBAR_OPENWINDOW,
    TITLEBAR_OPEN_GENERATOR_WINDOW,
    TITLEBAR_SAVEPROJECT,
    TITLEBAR_SAVEASPROJECT
}  = require('../utils/constants');

const primarywindow = remote.getGlobal ('textwindow');
var btncontainer = document.getElementById('buildcontainer');
var data = [];
var currentgender;
var locales = [
    'ar',
    'cz',
    'de',
    'en',
    'en_AU',
    'en_BORK',
    'en_CA',
    'en_GB',
    'en_IE',
    'en_IND',
    'en_US',
    'en_ZA',
    'es',
    'es_MX',
    'fa',
    'fr',
    'fr_CA',
    'fr_CH',
    'id_ID',
    'it',
    'ja',
    'ko',
    'nb_NO',
    'nep',
    'nl',
    'nl_BE',
    'pl',
    'pt_BR',
    'pt_PT',
    'ro',
    'ru',
    'sk',
    'sv',
    'tr',
    'uk',
    'vi'
]
var localesnames = [
    'Arabic',
    'Czech',
    'German',
    'English',
    'English Australia',
    'English Bork',
    'English Canadian',
    'United Kingdom',
    'English Ireland',
    'English India',
    'USA',
    'South Africa',
    'Spanish',
    'Mexican',
    'Farsi',
    'French',
    'French Canadian',
    'French Switzerland',
    'Indonesian',
    'Italian',
    'Japanese',
    'Korean',
    'Norwegian',
    'Nepali',
    'Dutch',
    'Dutch Belgium',
    'Polish',
    'Brazil',
    'Portuguese',
    'Romanian',
    'Russian',
    'Slovak',
    'Swedish',
    'Turkish',
    'Ukrainian',
    'Vietnamese'
]

var e = document.getElementById("ddlViewBy");

for (var i = 0; i < locales.length; i++)
{
    var newoption = document.createElement('option');
    newoption.value = i;
    newoption.text = localesnames[i];

    if (i == 0){
        newoption.selected = "selected";
    }
    e.appendChild(newoption);
}

sortSelect(e);

function sortSelect(selElem) {
    var tmpAry = new Array();
    for (var i=0;i<selElem.options.length;i++) {
        tmpAry[i] = new Array();
        tmpAry[i][0] = selElem.options[i].text;
        tmpAry[i][1] = selElem.options[i].value;
    }
    tmpAry.sort();
    while (selElem.options.length > 0) {
        selElem.options[0] = null;
    }
    for (var i=0;i<tmpAry.length;i++) {
        var op = new Option(tmpAry[i][0], tmpAry[i][1]);
        selElem.options[i] = op;
    }
    return;
}

faker.locale = locales[e.options[e.selectedIndex].value];
console.log(faker.locale);

e.onchange = function(){
    faker.locale = locales[e.options[e.selectedIndex].value];
    console.log(faker.locale);
};


window.addEventListener('DOMContentLoaded', () => {
    const titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#1a1918'),
        overflow: 'auto',
        titleHorizontalAlignment: "left"
    });
    var menu = new Menu();
    titlebar.updateMenu(menu);
    titlebar.updateTitle('Character Generator');
    //getversion();
})

Mousetrap.bind(['command+w', 'ctrl+w', 'f3'], function() {
    ipcRenderer.send(TITLEBAR_OPENWINDOW); 
    return false;
});

Mousetrap.bind(['f5'], function() {
    ipcRenderer.send(TITLEBAR_OPEN_GENERATOR_WINDOW); 
    return false;
});

  /**Had unwanted results, removed. */
Mousetrap.bind(['pageup', 'pagedown'], function(){
    return false;
})
  
  Mousetrap.bind(['command+s', 'ctrl+s'], function() {
    ipcRenderer.send(TITLEBAR_SAVEPROJECT);
    return false;
});
  
  Mousetrap.bind(['command+shift+s', 'ctrl+shift+s'], function() {
    ipcRenderer.send(TITLEBAR_SAVEASPROJECT);
    return false;
});

Mousetrap.bind(['ctrl+r'], function() {
    ipcRenderer.send(SETGLOBAL_CHARGEN);
});

asyncCall();

async function asyncCall() {
    //var updatechargenset = remote.getGlobal ('updatechargenset');

    var sheet, headers; // or use doc.sheetsById[id]
    var rows = [];

    var __dirname = app.getAppPath();

    const workSheetsFromFile = xlsx.parse(`${__dirname}/NPC Generator Database.xlsx`);

    //console.log(workSheetsFromFile);
    /*
    if (updatechargenset)
    {
        // spreadsheet key is the long id in the sheets URL
        const doc = new GoogleSpreadsheet('1pLKJWsJpgJLJXCGANR35pRrlGu31iOLUrdkCp3x8Uto');


        await doc.useServiceAccountAuth(creds);

        await doc.loadInfo(); // loads document properties and worksheets

        sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
        rows = await sheet.getRows();
        headers = sheet.headerValues;
    }
    */
    headers = workSheetsFromFile[0].data[0];
    //console.log(headers);
    for (var i = 1; i < workSheetsFromFile[0].data.length; i++)
    {
        if (workSheetsFromFile[0].data[i].length == 0)
        {
            break;
        }

        var row = {
            rawdata: workSheetsFromFile[0].data[i]
        }
        rows.push(row);
    }
    

    //console.table(sheet.headerValues);

    /**Setup the data storage with header values. creating the buttons for each one. */
    data = [];
    
    var index = 0;
    if (headers.length > 0)
    {
        
        for (var j = 0; j < headers.length; j++)
        {
            if (j % 2 === 0)
            {
                var newattribute = {
                    name: headers[j],
                    optionpairs: [],
                    weights: []
                }

                data.push(newattribute);

                
                //console.log(headers[j]);
                var newcontainer = document.createElement("div");
                newcontainer.classList.add('flexcontainer');

                var newbtn = document.createElement('button');
                newbtn.classList.add('basebtn');
                newbtn.innerText = headers[j];

                newbtn.setAttribute('onclick', 'rebuildselected(' + index +')')
                newbtn.id = "rebuild" + index;

                var outputdisplay = document.createElement('p');
                outputdisplay.classList.add('baseoutput');
                outputdisplay.id = 'output' + index;

                newcontainer.appendChild(newbtn);
                newcontainer.appendChild(outputdisplay);
                btncontainer.appendChild(newcontainer);
                index++;
            }
        }
    }

    

    /**iterate through rows puttings the data into those storage locations */
    
    if (rows.length > 0)
    {
        for (var i = 0; i < rows.length; i ++)
        {
            var thisrow = rows[i].rawdata;
            if (thisrow.length > 0)
            {
                index = 0;
                
                for (var j = 0; j < thisrow.length; j++)
                {
                    if (j % 2 === 0)
                    {
                        //console.log(thisrow[j]);
                        if (thisrow[j] != "")
                        {
                            var weight = thisrow[j + 1];
                            if (weight == null) { weight = 0;}
                            var optionpairpair = {
                                optionpair: thisrow[j],
                                weight: weight
                            }

                            data[index].optionpairs.push(optionpairpair);
                        }

                        index++;
                    }
                }
            }
        }
    }    

    /**Gender locks buttons */

    if (data.length > 1)
    {
        for (var i = 1; i < data.length; i++)
        {
            for (var j = 0; j < data[0].optionpairs.length; j++)
            {
                if (data[i].name.startsWith(data[0].optionpairs[j].optionpair))
                {
                    var reg = new RegExp((data[0].optionpairs[j].optionpair), "g");
                    var newname = data[i].name.replace(reg, '');

                    document.getElementById('output' + i).classList.add('genderlock-' + data[0].optionpairs[j].optionpair);
                    document.getElementById('rebuild' + i).innerText = newname;
                }
            }
        }
    }
}

function rebuildselected(index)
{ 
    
    var random = randomizer(data[index].optionpairs);
    var output = document.getElementById('output' + index);
    output.innerText = random.optionpair;
    if (output.parentElement.classList.contains('greyout')){output.parentElement.classList.remove('greyout');}
    

    if (index == 0)
    {
        currentgender = random.optionpair;
        checkall();
        rebuildname();
    }
    else
    {
        if (output.classList.forEach(element => {
            if (element.startsWith('genderlock-') && element != 'genderlock-' + currentgender)
            {
                output.innerText = "";
                output.parentElement.classList.add('greyout');
            }
        }));        
    }
    copytext();
}

function checkall()
{
    for (var i = 1; i < data.length; i++)
    {
        var output = document.getElementById('output' + i);
        if (output.parentElement.classList.contains('greyout')){
            output.parentElement.classList.remove('greyout');
        }

        if (output.classList.forEach(element => {
            if (element.startsWith('genderlock-') && element != 'genderlock-' + currentgender)
            {
                output.innerText = "";
                output.parentElement.classList.add('greyout');
            }
        }));   
    }
}

function rebuildname()
{
    var nameoutput = document.getElementById('Name-output');
    var randomName = '';
    if (currentgender.toLowerCase() === 'male')
    {
        randomName = faker.name.findName('','',0);
    }
    else if (currentgender.toLowerCase() === 'female')
    {
        randomName = faker.name.findName('','',1);
    }
    else
    {
        randomName = faker.name.findName();
    }
    
    nameoutput.innerText = randomName;
    copytext();
}

function rebuildheight() 
{
    var heightoutput = document.getElementById('Height-output');
    var randomHeight = getRndInteger(3,9);

    var randomheightinches = getRndInteger(1,13);

    if (randomheightinches == 12)
    {
        randomHeight++;
        heightoutput.innerText = randomHeight + "'" + '0"';
    }
    else
    {
        heightoutput.innerText = randomHeight + "'" + randomheightinches + '"';
    }
    copytext();
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function rebuildall()
{
    for (var i = 0; i < data.length; i++)
    {
        rebuildselected(i);
    }
    //rebuildregion();
    rebuildheight();
    copytext();
}
/*
function rebuildregion()
{
    var localeoutput = document.getElementById('region-output');
    var newlocale = locales[Math.floor(Math.random()*locales.length)];

    faker.locale = newlocale;
    localeoutput.innerText = newlocale;
    rebuildname();
}
*/
function copytext()
{
    var text = '';
    if (document.getElementById('Name-output').innerText != ''){
        text = text + "\nName: " + document.getElementById('Name-output').innerText;
    }    
    if (document.getElementById('Height-output').innerText != ''){
        text = text + "\nHeight: " + document.getElementById('Height-output').innerText;
    }   

    for (var i = 0; i < data.length; i++)
    {
        if (document.getElementById('output' + i).innerText != ''){
            text = text + "\n" + document.getElementById('rebuild' + i).innerText + ": " + document.getElementById('output' + i).innerText;
        }        
    }

    clipboard.writeText(text);
}

const randomizer = (array) => {
    var weightedArray = [];

    for (var i = 0; i < array.length; i++) {
        for (var n = 0; n < array[i].weight; n++){
            weightedArray.push(i);
        }
    }
    
    return array[weightedArray[Math.floor(Math.random() * weightedArray.length)]];
}

/**
 <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Name">Rebuild</button> <p>Name:</p><p class="baseoutput" id="Name-output"> test</p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Gender">Rebuild</button><p>Gender:</p><p class="baseoutput" id="Gender-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Height">Rebuild</button><p>Height:</p><p class="baseoutput" id="Height-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Build">Rebuild</button><p>Build:</p><p class="baseoutput" id="Build-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Weight">Rebuild</button><p>Weight:</p><p class="baseoutput" id="Weight-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Temperment">Rebuild</button><p>Temperment:</p><p class="baseoutput" id="Temperment-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Skills">Rebuild</button><p>Skills:</p><p class="baseoutput" id="Skills-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Color-Palette">Rebuild</button><p>Color Palette:</p><p class="baseoutput" id="Color-Palette-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Job">Rebuild</button><p>Job:</p><p class="baseoutput" id="Job-output"></p>
            </div>
            <div class="flexcontainer">
                <button class="basebtn" id="Rebuild-Genitals">Rebuild</button><p>Genital Size:</p><p class="baseoutput" id="Genitals-output"></p>
            </div>
 */

/**
 * builds = 0
 * weights = 1
 * temperments = 2
 * skills = 3
 * colorpalettes = 4
 * jobs = 5
 * sexs = 6
 * breastsizes = 7
 * dicksizes = 8
 * ages = 9
 */

/*
var btnall = document.getElementById('Rebuild-All');
var btnname = document.getElementById('Rebuild-Name');
var btngender = document.getElementById('Rebuild-Gender');
var btnheight = document.getElementById('Rebuild-Height');
var btnbuild = document.getElementById('Rebuild-Build');
var btnweight = document.getElementById('Rebuild-Weight');
var btntemperment = document.getElementById('Rebuild-Temperment');
var btnskills = document.getElementById('Rebuild-Skills');
var btncolor = document.getElementById('Rebuild-Color-Palette');
var btnjob = document.getElementById('Rebuild-Job');
var btngenitals = document.getElementById('Rebuild-Genitals');

btnall.onclick = function(){
    
};
btnname.onclick = function(){
    
};
btngender.onclick = function(){
    
};
btnheight.onclick = function(){
    
};
btnbuild.onclick = function(){
    
};
btnweight.onclick = function(){
    
};
btntemperment.onclick = function(){
    
};
btnskills.onclick = function(){
    
};
btncolor.onclick = function(){
    
};
btnjob.onclick = function(){
    
};
btngenitals.onclick = function(){
    
};
*/