const StormDB = require("stormdb");
const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron').remote;
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

const bc = new BroadcastChannel('ezvj');

const makeHotCue = (num, timestamp) => {
    return `
    <div>
        <button class="hot-cue" onclick="recallHotCue(${num})">Cuepoint <span>${num}</span>: <span>${fancyTimeFormat(timestamp)}</span></button>
        <button class="delete-hot-cue" onclick="deleteHotCue(${num})">Delete Cuepoint <span>${num}</span></button>
    </div>
    `
}

const makePlaylistItem = (num, video, renderUp=true, renderDown=true) =>{
    return `
    <tr>
        <td>${num}</td>
        <td data-path="${video.filepath}">${video.filename}</td>
        <td>
            ${renderUp ? `<button class="move-up" onclick="movePlaylistItem(${num},false)">Up</button>`: ''}
            ${renderDown? `<button class="move-down" onclick="movePlaylistItem(${num},true)">Down</button>` : ''}
            <button class="pop-from-videolist" onclick="removeFromPlaylist(${num})">DEL</button>
            <button class="force-play" onclick="forcePlayVideo(${num})">PLAY</button>
        </td>
    </tr>`
}

const makePlayedlistItem = (num, video) =>{
    return `
    <tr>
        <td>${num}</td>
        <td data-path="${video.filepath}">${video.filename}</td>
        <td>
            <button class="pop-from-playedlist" onclick="removeFromPlayedlist(${num})">DEL</button>
            <button class="push-back-to-playlist" onclick="pushBackToPlaylist(${num})">PUSHBACK</button>
        </td>
    </tr>`
}

const playerSeekTo = (seekToTime) => {
    bc.postMessage(JSON.stringify({
        action:'SET_TIME',
        data:{
            seekToTime
        }
    }))
} 

const renderHotCueBanks = (hotcues) =>{
    let HCHtml = '', progressHCHtml = '';
    for(let i = 0; i < hotcues.length; i++) {
        HCHtml += makeHotCue(i,hotcues[i].timestamp);
        progressHCHtml += `
            <div class="slider-cuepoint" style="left:${hotcues[i].timestamp * (100 / playerInfo.totalTime)}%;">
                <button class="hot-cue" onclick="recallHotCue(${i})">Recall</button>
                <br>
                <span>HC#${i}</span>
                <br>
                <span>&#8595;</span>
            </div>
        `
    }
    hotCueBanksElm.innerHTML = HCHtml;
    progressCuepointsElm.innerHTML = progressHCHtml;
    if(playerInfo.totalTime > 0.01){
        hasProgressCueRendered = true;
    }
}

const renderPlaylist = () =>{
    let plHtml = '';
    for(let i = 0; i < playlist.length; i++){
        plHtml += makePlaylistItem(i,playlist[i], i !== 0, i !== playlist.length - 1);
    }
    playlistTableElm.innerHTML = plHtml;
    plHtml = '';
    for(let i = 0; i< playedList.length; i++){
        plHtml += makePlayedlistItem(i,playedList[i]);
    }
    playedlistTableElm.innerHTML = plHtml;
}

const saveCuePoints = () =>{
    datastore.set(playerInfo.filename, cuepointInfo);
    datastore.save();
}

const loadCuePoints = () =>{
    const result = datastore.get(playerInfo.filename);
    try{
        cuepointInfo = result.value();
    }catch(e){
        console.log('no cue point')
    }
};

const resetPlayer = () => {
    cuepointInfo = {
        mainCue: 0.0,
        hotCues: []
    }
    playerInfo = {
        filename:'',
        currentTime: 0.00,
        totalTime: 0.00,
        paused: true,
        tappingCue: false,
    };     
    hasProgressCueRendered = false;
    renderPlaylist();
    renderHotCueBanks(cuepointInfo.hotCues);
};

const serializePlaylist = () =>{
    const playlistStr = JSON.stringify(playlist)
    return playlistStr;
};

const deserializePlaylist = (jsonString) =>{
    const payload = JSON.parse(jsonString);
    playlist = payload;
    renderPlaylist();
    resetPlayer();
}

window.onload = () =>{
    const videoInputElm = document.querySelector('#video_input');
    const playPuaseBtnElm = document.querySelector('#play-puase-button');
    const reqFullScreenBtnElm = document.querySelector('#req-fullscreen-button');
    const loopOptionElm = document.querySelector('#loop');
    const currentTimeElm = document.querySelector('#current-time');
    const totalTimeElm = document.querySelector('#total-time');
    const progressSliderElm = document.querySelector('#video-slider');
    const setMainCueBtnElm = document.querySelector('#set-main-cue');
    mainCuePointElm = document.querySelector('#main-cue-point');
    const setZeroBtnElm = document.querySelector('#set-zero');
    hotCueBanksElm = document.querySelector('#hot-cue-banks');
    const addHotCueBtnElm = document.querySelector('#add-hot-cue');
    const tapCueBtnElm = document.querySelector('#tap-cue');
    const onDeckElm = document.querySelector('#current-filename');
    playlistTableElm = document.querySelector('#playlist-table');
    playedlistTableElm = document.querySelector('#playedlist-table');
    const cutToNextBtnElm = document.querySelector('#cut-to-next');
    const exportPlaylistBtnElm = document.querySelector('#export-playlist');
    const importPlaylistBtnElm = document.querySelector('#import-playlist');
    progressCuepointsElm = document.querySelector('#progress-cuepoints');

    const handleBCMessage = (evt) => {
        const payload = JSON.parse(evt.data);
        console.log(payload)
        switch(payload.action){
          case 'STATUS':
            switch(payload.data.status){
                case 'PAUSE':
                    playPuaseBtnElm.innerHTML = 'Play';
                    playerInfo.paused = true;
                break;
                case 'PLAY':
                    playPuaseBtnElm.innerHTML = 'Pause';
                    playerInfo.paused = false;
                break;  
                case 'END':
                    playPuaseBtnElm.innerHTML = 'Play';
                    playerInfo.paused = true;
                    if(!loopOptionElm.checked){
                        handleCutToNext();
                    }    
                break;
            }
            break;
            case 'TIME_UPDATE':
                currentTimeElm.innerHTML = fancyTimeFormat(payload.data.event.currentTime);
                totalTimeElm.innerHTML = fancyTimeFormat(payload.data.event.totalTime);
                playerInfo.currentTime = payload.data.event.currentTime;
                playerInfo.totalTime = payload.data.event.totalTime;
                handleProgressSliderUpdate(playerInfo);
                loopOptionElm.checked = payload.data.loop;
                playerInfo.paused = payload.data.paused;
                playerInfo.filename = payload.data.fileinfo.filename;
                onDeckElm.innerHTML = payload.data.fileinfo.filename;

                if(!hasProgressCueRendered){
                    renderHotCueBanks(cuepointInfo.hotCues);
                }
            break;

        }
    }

    const handleVideoInput = (evt) =>{
        const filepath = evt.target.files[0].path,
            filename = evt.target.files[0].name;
        console.log(evt.target.files[0]);
        playlist.push({filename,filepath});
        renderPlaylist();
    }

    const handlePlayPause = () =>{
        playerInfo.paused = playPuaseBtnElm.innerHTML === 'Pause';
        bc.postMessage(JSON.stringify({
            action:'CONTROL',
            data:{
                status: playPuaseBtnElm.innerHTML === 'Play' ? 'PLAY' : 'PAUSE'
            }
        }))
    }

    const handleReqFullscreen = () =>{
        bc.postMessage(JSON.stringify({
            action:'FULLSCREEN',
            data:{
                requested:true
            }
        }))
    };

    const handleSetLoop = (evt) =>{
        bc.postMessage(JSON.stringify({
            action:'SET_LOOP',
            data:{
                loop:evt.target.checked
            }
        }))
    }

    const handleProgressSlider = (evt)=>{
        const seekVal = evt.target.value;
        const seekto = playerInfo.totalTime * (seekVal / 100);
        playerSeekTo(seekto)
    }

    const handleProgressSliderUpdate = (evt) =>{
        const currentProgress = evt.currentTime * (100 / evt.totalTime);
        progressSliderElm.value = currentProgress;
    }

    const handleOnMainCue = (evt) =>{
        if(playerInfo.paused){
            cuepointInfo.mainCue = playerInfo.currentTime;
            mainCuePointElm.innerHTML = fancyTimeFormat(cuepointInfo.mainCue);
            saveCuePoints();
        }else{
            playerSeekTo(cuepointInfo.mainCue)
        }
    }

    const handleSetZero = (evt) => {
        playerSeekTo(0)
    }

    const handleAddHotCue = (evt) =>{
        cuepointInfo.hotCues.push({
            timestamp: playerInfo.currentTime
        })
        saveCuePoints();
        renderHotCueBanks(cuepointInfo.hotCues)
    }

    const handleTapCueDown = (evt) =>{
        playerSeekTo(cuepointInfo.mainCue);
        if(playerInfo.paused){
            playerInfo.tappingCue = true;
        }
        bc.postMessage(JSON.stringify({
            action:'CONTROL',
            data:{
                status: 'PLAY'
            }
        }))
    }

    const handleTapCueUp = (evt) => {
        if(!playerInfo.tappingCue){
            return;   
        }
        playerSeekTo(cuepointInfo.mainCue)
        bc.postMessage(JSON.stringify({
            action:'CONTROL',
            data:{
                status: 'PAUSE'
            }
        }))
    }
    
    const handleCutToNext = (evt) => {
        resetPlayer();       
        if(playlist.length > 0){
            forcePlayVideo(0);
        }else{
            alert('No more video to cut to next!');
        }
    };

    const handleExportPlaylist = (evt) => {
        if(playlist.length < 0) {
            alert('No video in playlist');
            return;
        }
        const saveLocation = dialog.showSaveDialogSync({
            properties: ['openFile'],
            filters: [
                { name: 'JSON File', extensions: ['json'] },
            ]
        })
        if(saveLocation !== undefined){
            const serializedPlaylist = serializePlaylist();
            fs.writeFileSync(saveLocation,serializedPlaylist,'utf-8')
        }
    };

    const handleImportPlaylist = (evt) => {
        const selectedFile = dialog.showOpenDialogSync({
            properties: ['openFile'],
            filters: [
                { name: 'JSON File', extensions: ['json'] },
            ]
        })
        if(selectedFile !== undefined){
            const fileContent = fs.readFileSync(selectedFile[0],'utf-8');
            deserializePlaylist(fileContent);
        }
    }

    videoInputElm.addEventListener('change',handleVideoInput);
    playPuaseBtnElm.addEventListener('click',handlePlayPause);
    reqFullScreenBtnElm.addEventListener('click',handleReqFullscreen);
    loopOptionElm.addEventListener('change', handleSetLoop);
    progressSliderElm.addEventListener('change', handleProgressSlider);
    setMainCueBtnElm.addEventListener('click',handleOnMainCue);
    tapCueBtnElm.addEventListener('mousedown', handleTapCueDown);
    tapCueBtnElm.addEventListener('mouseup', handleTapCueUp);
    setZeroBtnElm.addEventListener('click',handleSetZero);
    addHotCueBtnElm.addEventListener('click',handleAddHotCue);
    cutToNextBtnElm.addEventListener('click', handleCutToNext);
    exportPlaylistBtnElm.addEventListener('click',handleExportPlaylist);
    importPlaylistBtnElm.addEventListener('click',handleImportPlaylist);
    bc.onmessage = handleBCMessage;
}

const recallHotCue = (num) =>{
    playerSeekTo(cuepointInfo.hotCues[num].timestamp)
};

const deleteHotCue = (num) => {
    cuepointInfo.hotCues.splice(num, 1);
    renderHotCueBanks(cuepointInfo.hotCues)
    saveCuePoints();
}

const forcePlayVideo = (num)=>{
    resetPlayer();
    const fileinfo = playlist[num];
    playerInfo.filename = fileinfo.filename;
    loadCuePoints();
    renderHotCueBanks(cuepointInfo.hotCues);
    mainCuePointElm.innerHTML = fancyTimeFormat(cuepointInfo.mainCue);
    playedList.push(playlist[num]);
    playlist.splice(num, 1);
    bc.postMessage(JSON.stringify({
        action:'PLAY_VIDEO',
        data:{
            path:fileinfo.filepath,
            filename: fileinfo.filename,
            startTime: cuepointInfo.mainCue
        }
    }))
    renderPlaylist();
}

const removeFromPlaylist = (num) => {
    playlist.splice(num, 1);
    renderPlaylist();
}

const removeFromPlayedlist = (num) =>{
    playedList.splice(num, 1);
    renderPlaylist();
}

const pushBackToPlaylist = (num) =>{
    playlist.push(playedList[num])
    playedList.splice(num, 1);
    renderPlaylist();
}

/**
 * Move Playlist Item
 * @param {number} num idx
 * @param {boolean} dir false = up, true = down
 */
const movePlaylistItem = (num, dir) => {
    if(!dir){ // move item up
        const tempItem = playlist[num-1];
        playlist[num-1] = playlist[num];
        playlist[num] = tempItem;
    }else{ // move item down
        const tempItem = playlist[num+1];
        playlist[num+1] = playlist[num];
        playlist[num] = tempItem;
    }
    renderPlaylist();
}