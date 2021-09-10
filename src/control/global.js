const StormDB = require("stormdb");
const fs = require('fs');
const path = require('path');
const { app, dialog } = require('@electron/remote')
var dataFilePath = path.join(app.getPath('userData'), 'cuepoints_db.json');
const engine = new StormDB.localFileEngine(dataFilePath);
const datastore = new StormDB(engine);

let hotCueBanksElm = document;
let playlistTableElm = document;
let playedlistTableElm = document;
let mainCuePointElm = document;
let progressCuepointsElm = document;

let hasProgressCueRendered = false;

let playerInfo = {
    filename:'',
    currentTime: 0.00,
    totalTime: 0.00,
    paused: true,
    tappingCue: false,
};

let cuepointInfo = {
    mainCue: 0.0,
    hotCues: []
}

let playlist  = [

];

let playedList = [

];

const bc = new BroadcastChannel('kusavj');