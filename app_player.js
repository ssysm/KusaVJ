let player = null;
let fileinfo = {
  filename:'',
  filepath: ''
}
window.onload = () =>{
    const fullscreenBtn = document.querySelector('#fullscreen-btn');
    const bc = new BroadcastChannel('ezvj');

    player = videojs('player', {
        responsive:true,
        aspectRatio: '16:9',
        plugins: {
					abLoopPlugin: {}
				}
    });

    const handleBCMessage = (evt) => {
      const payload = JSON.parse(evt.data);
      console.log(payload)
      switch(payload.action){
        case 'PLAY_VIDEO':
          player.src({
            src:payload.data.path
          });
          player.play();
          player.currentTime(payload.data.startTime);
          fileinfo = {
            filename: payload.data.filename,
            filepath: payload.data.path
          };
          bc.postMessage(JSON.stringify({
            action:'STATUS',
            data:{
                status: 'PLAY'
            }
          }))
          break;
        case 'CONTROL':
          switch(payload.data.status){
              case 'PAUSE':
                  player.pause();
                break;
              case 'PLAY':
                  player.play();
              break;
          }
          bc.postMessage(JSON.stringify({
              action:'STATUS',
              data:{
                  status: player.paused() ? 'PAUSE' : 'PLAY'
              }
          }))
          break;
        case 'FULLSCREEN':
          window.ipcApi.requestVideoFullscreen()
          break;
        case 'SET_TIME':
          player.currentTime(payload.data.seekToTime)
          break;
        case 'SET_LOOP':
          player.loop(payload.data.loop)
          break;
      }
    }

    const handleFullscreenReq = (evt) =>{
      player.requestFullscreen();
    }

    const handlePlayerUpdate = (evt)=>{
      bc.postMessage(JSON.stringify({
        action:'TIME_UPDATE',
        data:{
            loop: player.loop(),
            paused: player.paused(),
            fileinfo,
            event: {
              currentTime: player.currentTime(),
              totalTime: player.duration()
            }
        }
      }))
    }

    const handlePlayerReady = (evt)=>{
      handlePlayerUpdate(evt);
    }

    const handleVideoEnd = (evt) =>{
      bc.postMessage(JSON.stringify({
        action:'STATUS',
        data:{
            status: 'END'
        }
      }))
    }

    fullscreenBtn.addEventListener('click', handleFullscreenReq)
    player.on('timeupdate', handlePlayerUpdate);
    player.on('ready',handlePlayerReady)
    player.on('ended',handleVideoEnd);
    bc.onmessage = handleBCMessage; 

}

