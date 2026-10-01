// --- night3-sys/camerasN3.js ---
// Night 3 surveillance terminal: camera UI, feed rendering, AI tracking and CRT effects.

const cameraNav = document.getElementById('camera-nav');
const cameraFeed = document.getElementById('camera-feed');
const cameraScreen = document.getElementById('camera-screen');
const elongSprite = document.getElementById('elong-sprite');
const zuckSprite = document.getElementById('zuck-sprite');
const camUIMonitor = document.getElementById('camera-monitor');
const camUILeftPanel = document.getElementById('left-panel');
const camUIRightPanel = document.getElementById('right-panel');

const camSounds = [
    new Audio('../Sounds/freesound_community-aiwa-cx-930-vhs-vcr-video-cassette-recorderwav-14430.mp3'),
    new Audio('../Sounds/designerschoice-comav_vcr-rewinding-vhs-tape_nicholas-judy_tdc-493294.mp3')
];

let currentCamAudio = null;
let cameraClockTimer = null;
let cameraRefreshTimer = null;
let cameraUiReady = false;

const rooms = {
    'Conference Room': '../Scenes/Conference room.jpg',
    'Diner': '../Scenes/Diner.jpg',
    'Guest Room': 'DYNAMIC',
    'Janitor Room': '../Scenes/Janitor-room.jpg',
    'Kitchen': '../Scenes/Kitchen.jpg',
    'Storage': '../Scenes/Storage.jpg'
};

window.currentCamera = 'Guest Room';

// Keep all camera images warm in the browser cache.
function preloadCameraAssets() {
    const assets = [
        '../StoryScenes/Screenshot 2026-04-10 9.12.19 PM.png',
        '../Scenes/Conference room.jpg',
        '../Scenes/Diner.jpg',
        '../Scenes/Janitor-room.jpg',
        '../Scenes/Kitchen.jpg',
        '../Scenes/Storage.jpg',
        '../ScenesN2/guestroom-1.jpg',
        '../ScenesN2/guestroom-2.jpg',
        '../ScenesN2/guestroom-3.jpg',
        '../ScenesN2/guestroom-4.jpg'
    ];

    window.night3CameraPreload = assets.map(src => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        return img;
    });
}

function injectCameraTerminalStyles() {
    if (document.getElementById('n3-camera-terminal-styles')) return;

    const style = document.createElement('style');
    style.id = 'n3-camera-terminal-styles';
    style.textContent = `
        #camera-monitor {
            background:
                radial-gradient(circle at 50% 50%, rgba(45, 55, 50, .16), transparent 55%),
                #020303;
        }

        #camera-layout {
            padding: clamp(14px, 2.5vw, 32px);
            gap: clamp(12px, 2vw, 24px);
            position: relative;
            overflow: hidden;
            background:
                linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px),
                #030505;
            background-size: 32px 32px;
        }

        #camera-nav {
            flex: 0 0 clamp(220px, 24vw, 300px);
            padding: 12px;
            gap: 8px;
            border: 1px solid #28322f;
            background: linear-gradient(180deg, rgba(11,15,14,.98), rgba(3,6,5,.98));
            box-shadow: inset 0 0 24px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.015);
            scrollbar-width: thin;
        }

        .n3-cam-brand {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 4px 10px;
            color: #b9c5bf;
            font: 700 12px/1 "Courier New", monospace;
            letter-spacing: .16em;
        }

        .n3-cam-brand span:last-child {
            color: #71907e;
            font-size: 9px;
        }

        .n3-map-frame {
            position: relative;
            border: 1px solid #34413b;
            background: #050807;
            padding: 5px;
            margin-bottom: 4px;
            overflow: hidden;
        }

        .n3-map-frame::after {
            content: "HOUSE GRID // 01";
            position: absolute;
            left: 7px;
            bottom: 5px;
            color: rgba(205,220,211,.65);
            background: rgba(0,0,0,.7);
            padding: 3px 5px;
            font: 8px/1 "Courier New", monospace;
            letter-spacing: .1em;
        }

        #camera-map-img {
            display: block;
            width: 100%;
            margin: 0;
            border: 0;
            filter: brightness(.58) contrast(1.3) grayscale(.35);
        }

        .n3-nav-label {
            color: #62726a;
            font: 700 8px/1 "Courier New", monospace;
            letter-spacing: .18em;
            padding: 7px 3px 3px;
        }

        .cam-btn {
            position: relative;
            min-height: 42px;
            padding: 9px 10px 9px 29px;
            background: linear-gradient(90deg, rgba(18,24,21,.95), rgba(7,10,9,.95));
            color: #8f9d96;
            border: 1px solid #29342f;
            font: 700 11px/1.2 "Courier New", monospace;
            letter-spacing: .06em;
            text-align: left;
            transition: background .16s, border-color .16s, color .16s, transform .12s;
        }

        .cam-btn::before {
            content: "";
            position: absolute;
            left: 11px;
            top: 50%;
            width: 7px;
            height: 7px;
            border: 1px solid #53645b;
            border-radius: 50%;
            transform: translateY(-50%);
            background: #17201b;
            box-shadow: 0 0 0 transparent;
        }

        .cam-btn::after {
            content: attr(data-node);
            position: absolute;
            right: 9px;
            top: 50%;
            transform: translateY(-50%);
            color: #4e5d56;
            font: 8px "Courier New", monospace;
        }

        .cam-btn:hover {
            background: #121a16;
            border-color: #52655b;
            color: #d3ddd8;
            transform: translateX(2px);
        }

        .cam-btn.active {
            background: linear-gradient(90deg, #17231d, #0b110e);
            border-color: #7c9788;
            color: #e2ebe6;
            box-shadow: inset 3px 0 0 #8aa996, 0 0 18px rgba(91,128,108,.08);
        }

        .cam-btn.active::before {
            background: #a8c8b2;
            border-color: #c4e1cb;
            box-shadow: 0 0 8px rgba(145,210,163,.7);
        }

        #camera-screen {
            border: 1px solid #4a5650;
            border-radius: 3px;
            box-shadow: 0 0 0 5px #070908, 0 0 35px rgba(0,0,0,.85);
        }

        #camera-feed {
            transform: scale(1.015);
            filter: saturate(.72) contrast(1.12) brightness(.78);
            transition: background-image .12s ease, filter .2s ease;
        }

        #camera-screen::before,
        #camera-screen::after {
            content: "";
            position: absolute;
            pointer-events: none;
            z-index: 12;
        }

        #camera-screen::before {
            inset: 0;
            border: 1px solid rgba(203,218,208,.18);
            box-shadow: inset 0 0 80px rgba(0,0,0,.72);
        }

        #camera-screen::after {
            left: 0;
            right: 0;
            top: 50%;
            height: 1px;
            background: rgba(180,220,194,.09);
            box-shadow: 0 -95px rgba(180,220,194,.035), 0 95px rgba(180,220,194,.035);
        }

        #n3-camera-hud {
            position: absolute;
            inset: 0;
            z-index: 13;
            pointer-events: none;
            color: #d6e1da;
            font-family: "Courier New", monospace;
        }

        .n3-hud-top {
            position: absolute;
            left: 14px;
            right: 14px;
            top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            text-shadow: 0 1px 3px #000;
        }

        .n3-hud-room {
            font-size: clamp(13px, 1.5vw, 18px);
            font-weight: 700;
            letter-spacing: .13em;
        }

        .n3-hud-node {
            margin-top: 5px;
            color: #82958a;
            font-size: 9px;
            letter-spacing: .15em;
        }

        .n3-hud-rec {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #d3d8d4;
            font-size: 10px;
            letter-spacing: .12em;
        }

        .n3-rec-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #d05b5b;
            box-shadow: 0 0 8px rgba(220,70,70,.8);
            animation: n3RecPulse 1.1s steps(2,end) infinite;
        }

        @keyframes n3RecPulse {
            50% { opacity: .35; }
        }

        .n3-hud-bottom {
            position: absolute;
            left: 14px;
            right: 14px;
            bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 12px;
            font-size: 9px;
            letter-spacing: .11em;
            text-shadow: 0 1px 3px #000;
        }

        .n3-hud-signal {
            color: #86a794;
        }

        .n3-hud-signal.offline {
            color: #c77c67;
        }

        .n3-hud-tracks {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .n3-track {
            padding: 4px 6px;
            border: 1px solid #39453f;
            background: rgba(3,7,5,.68);
            color: #66766d;
            font-size: 8px;
        }

        .n3-track.detected {
            border-color: #8d6d54;
            color: #d4ad83;
        }

        .n3-crosshair {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 34px;
            height: 34px;
            transform: translate(-50%, -50%);
            opacity: .18;
        }

        .n3-crosshair::before,
        .n3-crosshair::after {
            content: "";
            position: absolute;
            background: #d9e6dc;
        }

        .n3-crosshair::before {
            left: 16px;
            top: 0;
            width: 1px;
            height: 34px;
        }

        .n3-crosshair::after {
            left: 0;
            top: 16px;
            width: 34px;
            height: 1px;
        }

        .n3-corner {
            position: absolute;
            width: 24px;
            height: 24px;
            border-color: rgba(210,225,215,.42);
            border-style: solid;
        }

        .n3-corner.tl { top: 14px; left: 14px; border-width: 1px 0 0 1px; }
        .n3-corner.tr { top: 14px; right: 14px; border-width: 1px 1px 0 0; }
        .n3-corner.bl { bottom: 14px; left: 14px; border-width: 0 0 1px 1px; }
        .n3-corner.br { bottom: 14px; right: 14px; border-width: 0 1px 1px 0; }

        #snow-overlay {
            opacity: .11;
            z-index: 11;
        }

        @media (max-width: 800px) {
            #camera-layout { padding: 10px; gap: 8px; }
            #camera-nav { flex: 0 0 150px; padding: 7px; }
            #camera-map-img { display: none; }
            .n3-cam-brand span:last-child, .n3-nav-label { display: none; }
            .cam-btn { min-height: 38px; padding-left: 24px; font-size: 9px; }
            .n3-hud-bottom { font-size: 7px; }
        }
    `;
    document.head.appendChild(style);
}

function initSnowEffect() {
    if (!cameraScreen || document.getElementById('snow-overlay')) return;

    const style = document.createElement('style');
    style.id = 'n3-snow-style';
    style.textContent = `
        @keyframes snowDriftN3 {
            0% { background-position: 0 0; }
            100% { background-position: 80px 80px; }
        }
        #snow-overlay {
            position: absolute;
            inset: 0;
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMCKcCBXY/C6MAAAAASUVORK5CYII=') repeat;
            pointer-events: none;
            mix-blend-mode: screen;
            animation: snowDriftN3 .2s linear infinite;
        }
    `;
    document.head.appendChild(style);

    const snowOverlay = document.createElement('div');
    snowOverlay.id = 'snow-overlay';
    cameraScreen.appendChild(snowOverlay);
}

function buildCameraHUD() {
    if (!cameraScreen || document.getElementById('n3-camera-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'n3-camera-hud';
    hud.innerHTML = `
        <div class="n3-hud-top">
            <div>
                <div id="n3-hud-room" class="n3-hud-room">GUEST ROOM</div>
                <div id="n3-hud-node" class="n3-hud-node">NODE // CAM-03</div>
            </div>
            <div class="n3-hud-rec"><span class="n3-rec-dot"></span>REC <span id="n3-hud-time">00:00:00</span></div>
        </div>

        <div class="n3-crosshair"></div>
        <div class="n3-corner tl"></div>
        <div class="n3-corner tr"></div>
        <div class="n3-corner bl"></div>
        <div class="n3-corner br"></div>

        <div class="n3-hud-bottom">
            <div>
                <div id="n3-hud-signal" class="n3-hud-signal">SIGNAL // STABLE</div>
                <div>BLACK HOUSE SECURITY // LIVE FEED</div>
            </div>
            <div id="n3-hud-tracks" class="n3-hud-tracks"></div>
        </div>
    `;
    cameraScreen.appendChild(hud);
}

function updateCameraClock() {
    const clock = document.getElementById('n3-hud-time');
    if (!clock) return;
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour12: false });
}

function updateCameraHUD(roomName) {
    const room = document.getElementById('n3-hud-room');
    const node = document.getElementById('n3-hud-node');
    const signal = document.getElementById('n3-hud-signal');
    const tracks = document.getElementById('n3-hud-tracks');

    const names = Object.keys(rooms);
    const index = Math.max(1, names.indexOf(roomName) + 1);

    if (room) room.textContent = roomName.toUpperCase();
    if (node) node.textContent = `NODE // CAM-${String(index).padStart(2, '0')}`;

    const offline = !!window.isBlackout;
    if (signal) {
        signal.textContent = offline ? 'SIGNAL // OFFLINE' : 'SIGNAL // STABLE';
        signal.classList.toggle('offline', offline);
    }

    if (tracks) {
        const positions = window.aiPositions || {};
        const detections = [];

        if (positions.charrlie === roomName) detections.push('CHARRLIE');
        if (positions.elong === roomName) detections.push('ELONG');
        if (positions.zuckenburger === roomName) detections.push('ZUCKENBURGER');

        tracks.innerHTML = detections.length
            ? detections.map(name => `<span class="n3-track detected">CONTACT // ${name}</span>`).join('')
            : '<span class="n3-track">NO MOTION DETECTED</span>';
    }
}

function updateActiveCameraButton() {
    document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.room === window.currentCamera);
    });
}

function setupCameraButtons() {
    cameraNav.innerHTML = `
        <div class="n3-cam-brand">
            <span>BLACK HOUSE SECURITY</span>
            <span>SYS-N3</span>
        </div>
        <div class="n3-map-frame">
            <img id="camera-map-img" src="../StoryScenes/Screenshot 2026-04-10 9.12.19 PM.png" alt="Black House camera map">
        </div>
        <div class="n3-nav-label">CAMERA NETWORK // 06 NODES</div>
    `;

    let node = 1;

    for (const roomName in rooms) {
        const btn = document.createElement('button');
        btn.className = 'cam-btn';
        btn.type = 'button';
        btn.dataset.room = roomName;
        btn.dataset.node = `CAM-${String(node).padStart(2, '0')}`;
        btn.textContent = roomName.toUpperCase();

        btn.onclick = () => {
            if (window.currentCamera === roomName || window.isBlackout) return;
            switchCamera(roomName, true);
        };

        cameraNav.appendChild(btn);
        node++;
    }

    updateActiveCameraButton();
}

function playCameraSound() {
    if (currentCamAudio) {
        currentCamAudio.pause();
        currentCamAudio.currentTime = 0;
    }

    currentCamAudio = camSounds[Math.floor(Math.random() * camSounds.length)];
    currentCamAudio.play().catch(e => console.log('[Camera] Audio block', e));
}

window.triggerFlicker = function() {
    const flash = document.getElementById('static-flash');
    if (!flash) return;

    flash.classList.remove('is-switching', 'is-long-switching');
    void flash.offsetWidth;
    flash.classList.add('is-switching');
};

window.triggerLongFlicker = function(oldRoom, newRoom) {
    if (!window.isCameraOpen || window.isBlackout) return;

    if (oldRoom && newRoom &&
        window.currentCamera !== oldRoom &&
        window.currentCamera !== newRoom) {
        return;
    }

    playCameraSound();

    const flash = document.getElementById('static-flash');
    if (!flash) return;

    flash.classList.remove('is-switching', 'is-long-switching');
    void flash.offsetWidth;
    flash.classList.add('is-long-switching');

    window.setTimeout(() => {
        flash.classList.remove('is-long-switching');
    }, 5000);
};

function setFeed(roomName) {
    if (!cameraFeed) return;

    if (roomName === 'Guest Room') {
        const stage = typeof window.charrlieStage !== 'undefined'
            ? Math.min(Math.max(window.charrlieStage, 1), 4)
            : 1;

        cameraFeed.style.backgroundImage =
            `url('../ScenesN2/guestroom-${stage}.jpg')`;
    } else if (rooms[roomName]) {
        cameraFeed.style.backgroundImage = `url('\${rooms[roomName]}')`;
    }
}

function updateAISprites(roomName) {
    const positions = window.aiPositions || {};

    if (elongSprite) {
        elongSprite.style.display = positions.elong === roomName ? 'block' : 'none';
    }

    if (zuckSprite) {
        zuckSprite.style.display = positions.zuckenburger === roomName ? 'block' : 'none';
    }
}

function switchCamera(roomName, playAudio = true) {
    if (!rooms[roomName] || !cameraFeed) return;
    if (window.isBlackout && roomName !== window.currentCamera) return;

    if (playAudio) {
        playCameraSound();
        window.triggerFlicker();
    }

    window.currentCamera = roomName;
    setFeed(roomName);
    updateAISprites(roomName);
    updateActiveCameraButton();
    updateCameraHUD(roomName);
}

window.refreshCameraUI = function() {
    if (!window.isCameraOpen || window.isBlackout) return;
    switchCamera(window.currentCamera, false);
};

window.toggleCamera = function() {
    if (window.isBlackout) return;

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

function initCameraSystem() {
    if (!cameraNav || !cameraFeed || !cameraScreen) return;

    injectCameraTerminalStyles();
    preloadCameraAssets();
    setupCameraButtons();
    buildCameraHUD();
    initSnowEffect();

    switchCamera(window.currentCamera, false);

    updateCameraClock();
    clearInterval(cameraClockTimer);
    cameraClockTimer = setInterval(updateCameraClock, 1000);

    // Keep the terminal's contact readout fresh without forcing a feed reload.
    clearInterval(cameraRefreshTimer);
    cameraRefreshTimer = setInterval(() => {
        if (window.isCameraOpen && !window.isBlackout) {
            updateCameraHUD(window.currentCamera);
            updateAISprites(window.currentCamera);
        }
    }, 250);

    cameraUiReady = true;
}

initCameraSystem();
