const playerSeekTo = (seekToTime) => {
    bc.postMessage(JSON.stringify({
        action:'SET_TIME',
        data:{
            seekToTime
        }
    }))
} 

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