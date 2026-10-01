// --- night2-sys/camerasN2.js ---

const cameraNav = document.getElementById('camera-nav');
const cameraFeed = document.getElementById('camera-feed');
const elongSprite = document.getElementById('elong-sprite'); 

const camUIMonitor = document.getElementById('camera-monitor');
const camUILeftPanel = document.getElementById('left-panel');
const camUIRightPanel = document.getElementById('right-panel');

// Audio setup
const camSounds = [
    new Audio('../Sounds/freesound_community-aiwa-cx-930-vhs-vcr-video-cassette-recorderwav-14430.mp3'),
    new Audio('../Sounds/designerschoice-comav_vcr-rewinding-vhs-tape_nicholas-judy_tdc-493294.mp3')
];

let currentCamAudio = null;

// The static rooms (Guest Room is handled dynamically)
const rooms = {
    'Conference Room': '../Scenes/Conference room.jpg',
    'Diner': '../Scenes/Diner.jpg',
    'Guest Room': 'DYNAMIC', 
    'Janitor Room': '../Scenes/Janitor-room.jpg',
    'Kitchen': '../Scenes/Kitchen.jpg',
    'Storage': '../Scenes/Storage.jpg'
};

// Expose the current camera globally so CharrlieAIN2.js knows what the player is looking at
window.currentCamera = 'Guest Room'; 


// --- REAL SURVEILLANCE TERMINAL UI ---
(function buildCameraTerminalUI(){
    const monitor=document.getElementById('camera-monitor');
    const layout=document.getElementById('camera-layout');
    const screen=document.getElementById('camera-screen');
    const nav=document.getElementById('camera-nav');
    if(!monitor||!layout||!screen||!nav)return;

    const style=document.createElement('style');
    style.textContent=`
        #camera-monitor{background:#070909!important;color:#dbe5df!important;font-family:"DM Mono","Courier New",monospace!important}
        #camera-layout{position:relative!important;box-sizing:border-box!important;padding:28px!important;gap:18px!important;background:radial-gradient(circle at 60% 35%,#18201c 0,#090c0a 45%,#040505 100%)!important}
        #camera-nav{flex:0 0 285px!important;box-sizing:border-box!important;padding:13px!important;gap:7px!important;overflow-y:auto!important;background:linear-gradient(160deg,#111613,#080b09)!important;border:1px solid #39443e!important;border-radius:8px!important;box-shadow:inset 0 1px rgba(255,255,255,.04),0 12px 30px rgba(0,0,0,.45)!important}
        #camera-nav:before{content:"BLACK HOUSE SECURITY";display:block;color:#e2ebe5;font:700 14px "DM Mono",monospace;letter-spacing:.12em;padding:4px 2px 1px}
        #camera-nav:after{content:"CAMERA NETWORK  //  06 NODES";display:block;order:99;color:#56635b;font:8px "DM Mono",monospace;letter-spacing:.12em;padding:7px 2px 0;border-top:1px solid #26302b}
        #camera-map-img{width:100%!important;height:128px!important;object-fit:cover!important;box-sizing:border-box!important;margin:4px 0 5px!important;border:1px solid #4c5952!important;border-radius:4px!important;filter:brightness(.55) contrast(1.35) grayscale(.3)!important}
        .cam-btn{position:relative!important;background:#0c110f!important;color:#89958e!important;border:1px solid #303a34!important;padding:10px 11px!important;font:700 9px "DM Mono",monospace!important;letter-spacing:.08em!important;border-radius:3px!important;transition:.15s!important}
        .cam-btn:before{content:"";display:inline-block;width:5px;height:5px;margin-right:8px;border:1px solid #536058;border-radius:50%;vertical-align:1px}
        .cam-btn:hover{background:#151d18!important;border-color:#66756b!important;color:#d9e4dd!important}
        .cam-btn.active{background:linear-gradient(90deg,#18241d,#101713)!important;border-color:#7d9888!important;color:#eff8f2!important;box-shadow:inset 3px 0 #8ac99d,0 0 12px rgba(90,170,115,.08)!important}
        .cam-btn.active:before{background:#8cffb0!important;border-color:#8cffb0!important;box-shadow:0 0 7px #8cffb0}
        #camera-screen{min-width:0!important;border:1px solid #5a655f!important;border-radius:7px!important;background:#000!important;box-shadow:0 18px 45px rgba(0,0,0,.55),inset 0 0 0 5px #090c0a!important}
        #camera-feed{filter:contrast(1.08) saturate(.78) brightness(.82)!important}
        .camera-terminal-hud{position:absolute;inset:0;z-index:14;pointer-events:none;font-family:"DM Mono","Courier New",monospace;color:#cbd8d0;text-shadow:0 1px 2px #000}
        .camera-hud-top{position:absolute;left:16px;right:16px;top:13px;display:flex;justify-content:space-between;align-items:flex-start;font-size:9px;letter-spacing:.1em}
        .camera-hud-left{display:flex;flex-direction:column;gap:4px}.camera-hud-title{font-size:12px;font-weight:700;color:#f0f6f2}.camera-hud-sub{font-size:7px;color:#829087}
        .camera-hud-right{display:flex;align-items:center;gap:9px;color:#8ff3ae}.camera-rec{display:flex;align-items:center;gap:5px}.camera-rec i{width:6px;height:6px;border-radius:50%;background:#ff5d5d;box-shadow:0 0 7px #ff5d5d;animation:camRec 1s steps(2,end) infinite}
        @keyframes camRec{50%{opacity:.25}}
        .camera-hud-bottom{position:absolute;left:16px;right:16px;bottom:13px;display:flex;justify-content:space-between;align-items:end;font-size:7px;color:#91a098;letter-spacing:.08em}
        .camera-crosshair{position:absolute;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%);opacity:.18}
        .camera-crosshair:before,.camera-crosshair:after{content:"";position:absolute;background:#c7e7d2}.camera-crosshair:before{left:16px;top:0;width:1px;height:34px}.camera-crosshair:after{left:0;top:16px;width:34px;height:1px}
        .camera-corner{position:absolute;width:22px;height:22px;border-color:rgba(196,225,207,.55);border-style:solid}.camera-c1{left:10px;top:10px;border-width:1px 0 0 1px}.camera-c2{right:10px;top:10px;border-width:1px 1px 0 0}.camera-c3{left:10px;bottom:10px;border-width:0 0 1px 1px}.camera-c4{right:10px;bottom:10px;border-width:0 1px 1px 0}
        .camera-scanline{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 4px);opacity:.55}
        @media(max-width:850px){#camera-layout{padding:14px!important;gap:10px!important}#camera-nav{flex:0 0 220px!important}.camera-hud-top{left:10px;right:10px}.camera-hud-bottom{left:10px;right:10px}}
    `;
    document.head.appendChild(style);

    const hud=document.createElement('div');
    hud.className='camera-terminal-hud';
    hud.innerHTML=`
        <div class="camera-scanline"></div>
        <div class="camera-corner camera-c1"></div><div class="camera-corner camera-c2"></div>
        <div class="camera-corner camera-c3"></div><div class="camera-corner camera-c4"></div>
        <div class="camera-crosshair"></div>
        <div class="camera-hud-top">
            <div class="camera-hud-left"><span class="camera-hud-title" id="cam-hud-room">GUEST ROOM</span><span class="camera-hud-sub" id="cam-hud-id">NODE // CAM-03</span></div>
            <div class="camera-hud-right"><span class="camera-rec"><i></i>REC</span><span id="cam-hud-time">00:00:00</span></div>
        </div>
        <div class="camera-hud-bottom"><span id="cam-hud-status">SIGNAL // STABLE</span><span>BLACK HOUSE SECURITY // LIVE FEED</span></div>`;
    screen.appendChild(hud);

    const clock=setInterval(()=>{
        const el=document.getElementById('cam-hud-time');
        if(el&&window.isCameraOpen){const d=new Date();el.textContent=[d.getHours(),d.getMinutes(),d.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':')}
    },1000);
    window.addEventListener('beforeunload',()=>clearInterval(clock));
})();

function setupCameraButtons() {
    // Map path updated to StoryScenes
    cameraNav.innerHTML = '<img id="camera-map-img" src="../StoryScenes/Screenshot 2026-04-10 9.12.19 PM.png" alt="Office Map">';
    
    for (const roomName in rooms) {
        const btn = document.createElement('button');
        btn.className = 'cam-btn';
        btn.innerText = `CAM: ${roomName}`;
        
        btn.onclick = () => {
            if (window.isBlackout || window.currentCamera === roomName) return;
            document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchCamera(roomName);
        };
        
        cameraNav.appendChild(btn);
    }
    
    const firstBtn = cameraNav.querySelector('.cam-btn');
    if (firstBtn) firstBtn.classList.add('active');
    switchCamera(window.currentCamera, false);
}

function playCameraSound() {
    if (currentCamAudio) {
        currentCamAudio.pause();
        currentCamAudio.currentTime = 0;
    }
    currentCamAudio = camSounds[Math.floor(Math.random() * camSounds.length)];
    currentCamAudio.play().catch(e => console.log("[Camera] Audio block", e));
}

// Global short flicker (for clicking buttons)
window.triggerFlicker = function() {
    const flash = document.getElementById('static-flash');
    if (!flash) return;
    flash.classList.remove('is-switching', 'is-long-switching');
    void flash.offsetWidth; // Force CSS animation reflow
    flash.classList.add('is-switching');
};

// Global long flicker (for AI Movement)
window.triggerLongFlicker = function(oldRoom, newRoom) {
    if (!window.isCameraOpen) return;

    if (oldRoom && newRoom) {
        if (window.currentCamera !== oldRoom && window.currentCamera !== newRoom) {
            return; 
        }
    }

    playCameraSound();

    const flash = document.getElementById('static-flash');
    if (!flash) return;
    
    flash.classList.remove('is-switching', 'is-long-switching');
    void flash.offsetWidth; 
    flash.classList.add('is-long-switching');

    setTimeout(() => {
        flash.classList.remove('is-long-switching');
    }, 5000);
};

function switchCamera(roomName, playAudio = true) {
    if (window.isBlackout) return;
    if (playAudio) {
        playCameraSound();
        window.triggerFlicker(); 
    }
    
    window.currentCamera = roomName;

    const hudRoom=document.getElementById('cam-hud-room');
    const hudId=document.getElementById('cam-hud-id');
    const hudStatus=document.getElementById('cam-hud-status');
    const camIndex=Object.keys(rooms).indexOf(roomName)+1;
    if(hudRoom) hudRoom.textContent=roomName.toUpperCase();
    if(hudId) hudId.textContent=`NODE // CAM-${String(camIndex).padStart(2,'0')}`;
    if(hudStatus) hudStatus.textContent=window.isBlackout ? 'SIGNAL // OFFLINE' : 'SIGNAL // STABLE';

    // --- NIGHT 2 GUEST ROOM LOGIC (Stitched with Charrlie's AI) ---
    if (roomName === 'Guest Room') {
        // Reads Charrlie's stage directly from the window object. Defaults to 1 if the AI script hasn't loaded yet.
        const stage = (typeof window.charrlieStage !== 'undefined') ? Math.min(window.charrlieStage, 4) : 1;
        cameraFeed.style.backgroundImage = `url('../ScenesN2/guestroom-${stage}.jpg')`;
    } else {
        cameraFeed.style.backgroundImage = `url('${rooms[roomName]}')`;
    }

    // --- AI SPRITE LOGIC (Elong) ---
    if (window.aiPositions && window.aiPositions.elong === roomName) {
        elongSprite.style.display = 'block';
    } else {
        elongSprite.style.display = 'none';
    }
}

// Called by AI scripts when they move, so the camera feed updates live
window.refreshCameraUI = function() {
    if (window.isCameraOpen) {
        switchCamera(window.currentCamera, false); 
    }
};

window.toggleCamera = function() {
    if (window.isBlackout && !window.isCameraOpen) return;
    window.isCameraOpen = !window.isCameraOpen;
    
    if (window.isCameraOpen) {
        camUIMonitor.style.transform = 'translateY(0)'; 
        camUILeftPanel.classList.remove('is-visible');
        camUIRightPanel.classList.remove('is-visible');
        
        playCameraSound();
        window.triggerFlicker();
        switchCamera(window.currentCamera, false); 
    } else {
        camUIMonitor.style.transform = 'translateY(100%)'; 
        if (currentCamAudio) {
            currentCamAudio.pause();
            currentCamAudio.currentTime = 0;
        }
    }
};

setupCameraButtons();
