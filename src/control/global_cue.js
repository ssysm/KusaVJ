const makeHotCue = (num, timestamp) => {
    return `
    <div class="button-group">
        <button class="hot-cue button" onclick="recallHotCue(${num})">Cue #<span>${num}</span>: <span>${fancyTimeFormat(timestamp)}</span></button>
        <button class="delete-hot-cue button alert" onclick="deleteHotCue(${num})">Delete Cue #<span>${num}</span></button>
    </div>
    `
}

const renderHotCueBanks = (hotcues) =>{
    let HCHtml = '', progressHCHtml = '';
    for(let i = 0; i < hotcues.length; i++) {
        HCHtml += makeHotCue(i,hotcues[i].timestamp);
        progressHCHtml += `
            <div class="slider-cuepoint" style="left:${hotcues[i].timestamp * (100 / playerInfo.totalTime)}%;">
                <span>| HC#${i}</span>
                <br>
                <button class="hot-cue button" onclick="recallHotCue(${i})">Recall</button>
            </div>
        `
    }
    hotCueBanksElm.innerHTML = HCHtml;
    progressCuepointsElm.innerHTML = progressHCHtml;
    if(playerInfo.totalTime > 0.01){
        hasProgressCueRendered = true;
    }
}

const loadCuePoints = () =>{
    const result = datastore.get(playerInfo.filename);
    try{
        cuepointInfo = result.value();
    }catch(e){
        console.log('no cue point')
    }
};

const saveCuePoints = () =>{
    datastore.set(playerInfo.filename, cuepointInfo);
    datastore.save();
}

const recallHotCue = (num) =>{
    playerSeekTo(cuepointInfo.hotCues[num].timestamp)
};

const deleteHotCue = (num) => {
    cuepointInfo.hotCues.splice(num, 1);
    renderHotCueBanks(cuepointInfo.hotCues)
    saveCuePoints();
}
