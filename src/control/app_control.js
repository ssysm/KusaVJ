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
    const volPercentElm = document.querySelector('#volume-percent');
    const volSliderElm = document.querySelector('#volume-slider');
    const dncOptionElm = document.querySelector('#dnc-option');
    const adjustTimeScalerInputElm = document.querySelector('#adjust-time-scaler');
    const skipFwdBtnElm = document.querySelector('#skip-forward-btn');
    const skipBwdBtnElm = document.querySelector('#skip-backward-btn');

    const handleBCMessage = (evt) => {
        const payload = JSON.parse(evt.data);
        console.log(payload)
        switch(payload.action){
          case 'STATUS':
            switch(payload.data.status){
                case 'PAUSE':
                    playPuaseBtnElm.innerHTML = 'Play';
                    playerInfo.paused = true;
                    setMainCueBtnElm.classList.add('blink');
                break;
                case 'PLAY':
                    playPuaseBtnElm.innerHTML = 'Pause';
                    playerInfo.paused = false;
                    setMainCueBtnElm.classList.remove('blink');
                break;  
                case 'END':
                    playPuaseBtnElm.innerHTML = 'Play';
                    playerInfo.paused = true;
                    if(!loopOptionElm.checked && !dncOptionElm.checked){
                        handleCutToNext();
                    }
                break;
            }
            break;
            case 'TIME_UPDATE':
                const playerCurrentTime = fancyTimeFormat(payload.data.event.currentTime);
                if(playerCurrentTime !== currentTimeElm.innerHTML){
                    currentTimeElm.innerHTML = playerCurrentTime
                }
                const playerTotalTime = fancyTimeFormat(payload.data.event.totalTime);
                if(playerTotalTime !== totalTimeElm.innerHTML){
                    totalTimeElm.innerHTML = playerTotalTime
                }
                playerInfo.currentTime = payload.data.event.currentTime;
                playerInfo.totalTime = payload.data.event.totalTime;
                handleProgressSliderUpdate(playerInfo);
                loopOptionElm.checked = payload.data.loop;
                playerInfo.paused = payload.data.paused;
                playerInfo.filename = payload.data.fileinfo.filename;
                onDeckElm.innerHTML = payload.data.fileinfo.filename;
                volPercentElm.innerHTML = parseInt(payload.data.event.volume * 100)
                volSliderElm.value = payload.data.event.volume;
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

    const handleVolumeChange = (evt) =>{
        const vol = evt.target.value;
        bc.postMessage(JSON.stringify({
            action:'SET_VOL',
            data:{
                vol
            }
        }));
    }

    const handleSkipFwd = (evt) =>{
        const skipScaler = adjustTimeScalerInputElm.value;
        bc.postMessage(JSON.stringify({
            action: 'SKIP_TIME',
            data: {
                direction: 'FWD',
                time: skipScaler
            }
        }))
    };

    const handleSkipBwd = (evt) =>{
        const skipScaler = adjustTimeScalerInputElm.value;
        bc.postMessage(JSON.stringify({
            action: 'SKIP_TIME',
            data: {
                direction: 'BWD',
                time: skipScaler
            }
        }))
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
    volSliderElm.addEventListener('change', handleVolumeChange);
    skipFwdBtnElm.addEventListener('click', handleSkipFwd);
    skipBwdBtnElm.addEventListener('click',handleSkipBwd);
    bc.onmessage = handleBCMessage;
}
