const makePlaylistItem = (num, video, renderUp=true, renderDown=true) =>{
    return `
    <tr>
        <td>${num}</td>
        <td data-path="${video.filepath}">${video.filename}</td>
        <td>
            ${renderUp ? `<button class="move-up button" onclick="movePlaylistItem(${num},false)">Up</button>`: ''}
            ${renderDown? `<button class="move-down button" onclick="movePlaylistItem(${num},true)">Down</button>` : ''}
            <button class="pop-from-videolist button" onclick="removeFromPlaylist(${num})">DEL</button>
            <button class="force-play button" onclick="forcePlayVideo(${num})">PLAY</button>
        </td>
    </tr>`
}

const makePlayedlistItem = (num, video) =>{
    return `
    <tr>
        <td>${num}</td>
        <td data-path="${video.filepath}">${video.filename}</td>
        <td>
            <button class="pop-from-playedlist button" onclick="removeFromPlayedlist(${num})">DEL</button>
            <button class="push-back-to-playlist button" onclick="pushBackToPlaylist(${num})">PUSHBACK</button>
        </td>
    </tr>`
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