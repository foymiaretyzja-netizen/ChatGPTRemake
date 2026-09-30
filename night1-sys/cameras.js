// --- night1-sys/cameras.js ---
// Night 1 camera terminal system.
// Handles camera selection, CRT effects, horizontal camera panning,
// terminal UI, and AI sprite positioning.

const cameraNav = document.getElementById('camera-nav');
const cameraFeed = document.getElementById('camera-feed');
const elongSprite = document.getElementById('elong-sprite');
const charrlieSprite = document.getElementById('charrlie-sprite');

const camUIMonitor = document.getElementById('camera-monitor');
const camUILeftPanel = document.getElementById('left-panel');
const camUIRightPanel = document.getElementById('right-panel');

const camSounds = [
    new Audio('../Sounds/freesound_community-aiwa-cx-930-vhs-vcr-video-cassette-recorderwav-14430.mp3'),
    new Audio('../Sounds/designerschoice-comav_vcr-rewinding-vhs-tape_nicholas-judy_tdc-493294.mp3')
];

let currentCamAudio = null;
let currentCamera = 'Guest Room';
let cameraPan = 0;
let cameraPanTarget = 0;
let cameraPanAnimation = null;

const rooms = {
    'Conference Room': '../Scenes/Conference room.jpg',
    'Diner': '../Scenes/Diner.jpg',
    'Guest Room': '../Scenes/Guest-room.jpg',
    'Janitor Room': '../Scenes/Janitor-room.jpg',
    'Kitchen': '../Scenes/Kitchen.jpg',
    'Storage': '../Scenes/Storage.jpg'
};

// -----------------------------------------------------------------------------
// CAMERA TERMINAL STYLING
// -----------------------------------------------------------------------------

const cameraTerminalStyle = document.createElement('style');
cameraTerminalStyle.textContent = `
    #camera-monitor {
        background: #030504 !important;
        color: #d9e5df;
        font-family: "Courier New", monospace;
    }

    #camera-layout {
        position: relative;
        display: grid !important;
        grid-template-columns: 245px minmax(0, 1fr);
        grid-template-rows: 1fr;
        width: min(1500px, 96vw) !important;
        height: min(900px, 92vh) !important;
        padding: 18px !important;
        gap: 14px !important;
        background:
            linear-gradient(rgba(90, 110, 100, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(90, 110, 100, 0.025) 1px, transparent 1px),
            #070a09 !important;
        background-size: 32px 32px;
        border: 1px solid #28322e;
        box-shadow:
            0 0 0 2px #020302,
            0 0 45px rgba(0, 0, 0, 0.9),
            inset 0 0 45px rgba(0, 0, 0, 0.7);
    }

    #camera-layout::before {
        content: "BLACK HOUSE SECURITY NETWORK  //  NIGHT 01";
        position: absolute;
        left: 18px;
        top: 8px;
        color: #6f8178;
        font: 10px/1 "Courier New", monospace;
        letter-spacing: 2px;
        pointer-events: none;
    }

    #camera-nav {
        position: relative;
        grid-column: 1;
        grid-row: 1;
        flex: none !important;
        width: auto !important;
        min-width: 0;
        padding: 25px 10px 10px;
        display: flex;
        flex-direction: column;
        gap: 7px;
        overflow-y: auto;
        border: 1px solid #29342f;
        background: #080c0a;
        box-shadow: inset 0 0 20px rgba(0,0,0,.75);
    }

    #camera-nav::before {
        content: "CAMERA SELECT";
        display: block;
        padding: 5px 7px 8px;
        color: #8ea299;
        font-size: 10px;
        letter-spacing: 2px;
        border-bottom: 1px solid #29342f;
    }

    #camera-map-img {
        width: 100% !important;
        height: 108px !important;
        object-fit: contain;
        margin: 0 0 3px !important;
        padding: 5px;
        border: 1px solid #33413a !important;
        background: #020403;
        filter: grayscale(1) brightness(.65) contrast(1.25) !important;
    }

    .cam-btn {
        position: relative;
        min-height: 42px;
        padding: 8px 10px !important;
        background: #0b100e !important;
        color: #7d9087 !important;
        border: 1px solid #2c3933 !important;
        border-radius: 2px;
        font-family: "Courier New", monospace !important;
        font-size: 11px !important;
        font-weight: bold;
        letter-spacing: 1px;
        text-align: left;
        cursor: pointer;
        transition: background .15s, color .15s, border-color .15s, transform .15s;
    }

    .cam-btn::before {
        content: "■";
        margin-right: 8px;
        color: #405148;
        font-size: 8px;
    }

    .cam-btn:hover {
        background: #111a16 !important;
        color: #b9c8c1 !important;
        border-color: #52645b !important;
        transform: translateX(2px);
    }

    .cam-btn.active {
        background: #16201b !important;
        color: #dce9e2 !important;
        border-color: #71877b !important;
        box-shadow: inset 3px 0 #b7c9bf;
    }

    .cam-btn.active::before {
        color: #d5e4dc;
        animation: camBlink .9s steps(1) infinite;
    }

    @keyframes camBlink {
        50% { opacity: .25; }
    }

    #camera-screen {
        position: relative;
        grid-column: 2;
        grid-row: 1;
        min-width: 0;
        min-height: 0;
        border: 2px solid #3b4842 !important;
        border-radius: 3px !important;
        background: #000 !important;
        overflow: hidden;
        box-shadow:
            0 0 0 5px #080b09,
            inset 0 0 55px rgba(0,0,0,.95);
        cursor: ew-resize;
    }

    #camera-screen::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 30;
        pointer-events: none;
        border: 18px solid rgba(0,0,0,.20);
        border-radius: 5% / 3%;
        box-shadow:
            inset 0 0 80px rgba(0,0,0,.85),
            inset 0 0 150px rgba(0,0,0,.45);
    }

    #camera-feed {
        position: absolute !important;
        left: -17.5% !important;
        top: -8% !important;
        width: 135% !important;
        height: 116% !important;
        background-size: cover !important;
        background-repeat: no-repeat;
        background-position: center center;
        transform: translate3d(var(--camera-pan, 0px), 0, 0) scale(1.035);
        transform-origin: center center;
        transition: background-image .08s linear;
        filter: saturate(.72) contrast(1.08) brightness(.72);
        will-change: transform;
    }

    #camera-screen .ai-sprite {
        bottom: 0 !important;
        top: auto !important;
        height: 78% !important;
        max-height: none !important;
        width: auto !important;
        object-fit: contain;
        object-position: center bottom;
        transform: translate3d(var(--camera-pan, 0px), 0, 0);
        transform-origin: center bottom;
        filter: saturate(.8) contrast(1.08) drop-shadow(0 8px 12px rgba(0,0,0,.8));
        will-change: transform;
        pointer-events: none;
    }

    #elong-sprite {
        right: 17%;
    }

    #charrlie-sprite {
        left: 17%;
    }

    #camera-screen::after {
        content: "CAM 04   //   LIVE";
        position: absolute;
        left: 18px;
        top: 15px;
        z-index: 35;
        padding: 5px 8px;
        color: #d5ddd9;
        background: rgba(0,0,0,.48);
        border: 1px solid rgba(190,210,200,.25);
        font: bold 11px/1 "Courier New", monospace;
        letter-spacing: 2px;
        pointer-events: none;
    }

    #camera-screen .camera-hud {
        position: absolute;
        z-index: 35;
        pointer-events: none;
        color: rgba(215,228,221,.82);
        font: 10px/1.5 "Courier New", monospace;
        letter-spacing: 1px;
        text-shadow: 0 1px 2px #000;
    }

    #camera-screen .camera-hud.top-right {
        top: 15px;
        right: 18px;
    }

    #camera-screen .camera-hud.bottom-left {
        left: 18px;
        bottom: 15px;
    }

    #camera-screen .camera-hud.bottom-right {
        right: 18px;
        bottom: 15px;
        text-align: right;
    }

    #camera-screen .camera-crosshair {
        position: absolute;
        z-index: 34;
        left: 50%;
        top: 50%;
        width: 70px;
        height: 70px;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(210,225,217,.12);
        border-radius: 50%;
        pointer-events: none;
    }

    #camera-screen .camera-crosshair::before,
    #camera-screen .camera-crosshair::after {
        content: "";
        position: absolute;
        background: rgba(210,225,217,.13);
    }

    #camera-screen .camera-crosshair::before {
        width: 90px;
        height: 1px;
        left: -11px;
        top: 34px;
    }

    #camera-screen .camera-crosshair::after {
        width: 1px;
        height: 90px;
        left: 34px;
        top: -11px;
    }

    #crt-overlay {
        z-index: 40 !important;
        opacity: .72;
        mix-blend-mode: screen;
    }

    #static-flash {
        z-index: 50 !important;
    }

    .camera-footer {
        position: absolute;
        z-index: 35;
        left: 18px;
        right: 18px;
        bottom: 0;
        height: 1px;
        background: rgba(190,210,200,.15);
        pointer-events: none;
    }

    .camera-terminal-label {
        position: absolute;
        right: 18px;
        bottom: 8px;
        z-index: 36;
        color: #718079;
        font: 9px "Courier New", monospace;
        letter-spacing: 1px;
        pointer-events: none;
    }

    @media (max-width: 800px) {
        #camera-layout {
            grid-template-columns: 155px minmax(0,1fr);
            padding: 10px !important;
            gap: 8px !important;
        }

        .cam-btn {
            font-size: 9px !important;
            min-height: 36px;
            padding: 6px !important;
        }

        #camera-map-img {
            height: 80px !important;
        }
    }
`;
document.head.appendChild(cameraTerminalStyle);

// -----------------------------------------------------------------------------
// TERMINAL HUD
// -----------------------------------------------------------------------------

function setupCameraHUD() {
    const screen = document.getElementById('camera-screen');
    if (!screen || screen.querySelector('.camera-hud')) return;

    const topRight = document.createElement('div');
    topRight.className = 'camera-hud top-right';
    topRight.id = 'camera-time';
    topRight.textContent = 'REC  --:--:--';

    const bottomLeft = document.createElement('div');
    bottomLeft.className = 'camera-hud bottom-left';
    bottomLeft.id = 'camera-location';
    bottomLeft.textContent = 'LOCATION: UNKNOWN';

    const bottomRight = document.createElement('div');
    bottomRight.className = 'camera-hud bottom-right';
    bottomRight.id = 'camera-signal';
    bottomRight.textContent = 'SIGNAL  ████████ 100%';

    const crosshair = document.createElement('div');
    crosshair.className = 'camera-crosshair';

    const footer = document.createElement('div');
    footer.className = 'camera-footer';

    const label = document.createElement('div');
    label.className = 'camera-terminal-label';
    label.textContent = 'HORIZONTAL PAN // MOUSE LEFT / RIGHT';

    screen.append(topRight, bottomLeft, bottomRight, crosshair, footer, label);
}

function updateCameraHUD() {
    const location = document.getElementById('camera-location');
    const time = document.getElementById('camera-time');
    const signal = document.getElementById('camera-signal');

    if (location) location.textContent = `LOCATION: ${currentCamera.toUpperCase()}`;

    if (time) {
        const now = new Date();
        time.textContent = `REC  ${now.toLocaleTimeString([], { hour12: false })}`;
    }

    if (signal) {
        const bars = Math.max(4, Math.round(8 - Math.abs(cameraPan) / 30));
        signal.textContent = `SIGNAL  ${'█'.repeat(bars)}${'░'.repeat(8 - bars)}  ${Math.round((bars / 8) * 100)}%`;
    }

    const screen = document.getElementById('camera-screen');
    if (screen) {
        const labels = {
            'Conference Room': 'CAM 01',
            'Diner': 'CAM 02',
            'Guest Room': 'CAM 03',
            'Janitor Room': 'CAM 04',
            'Kitchen': 'CAM 05',
            'Storage': 'CAM 06'
        };
        const old = screen.querySelector('.camera-cam-id');
        if (old) old.remove();

        const id = document.createElement('div');
        id.className = 'camera-cam-id';
        id.style.cssText = 'position:absolute;right:18px;top:15px;z-index:36;color:rgba(215,228,221,.82);font:10px monospace;letter-spacing:2px;pointer-events:none;';
        id.textContent = `${labels[currentCamera] || 'CAM --'} // LIVE`;
        screen.appendChild(id);
    }
}

// -----------------------------------------------------------------------------
// CAMERA PAN
// -----------------------------------------------------------------------------

function applyCameraPan(value, instant = false) {
    cameraPanTarget = Math.max(-85, Math.min(85, value));

    if (instant) {
        cameraPan = cameraPanTarget;
        cameraFeed.style.setProperty('--camera-pan', `${cameraPan}px`);
        if (elongSprite) elongSprite.style.setProperty('--camera-pan', `${cameraPan}px`);
        if (charrlieSprite) charrlieSprite.style.setProperty('--camera-pan', `${cameraPan}px`);
        updateCameraHUD();
        return;
    }

    cancelAnimationFrame(cameraPanAnimation);

    const animate = () => {
        cameraPan += (cameraPanTarget - cameraPan) * 0.16;

        if (Math.abs(cameraPanTarget - cameraPan) < 0.05) {
            cameraPan = cameraPanTarget;
        }

        cameraFeed.style.setProperty('--camera-pan', `${cameraPan}px`);
        if (elongSprite) elongSprite.style.setProperty('--camera-pan', `${cameraPan}px`);
        if (charrlieSprite) charrlieSprite.style.setProperty('--camera-pan', `${cameraPan}px`);

        updateCameraHUD();

        if (Math.abs(cameraPanTarget - cameraPan) > 0.05) {
            cameraPanAnimation = requestAnimationFrame(animate);
        }
    };

    cameraPanAnimation = requestAnimationFrame(animate);
}

function setupCameraPan() {
    const screen = document.getElementById('camera-screen');
    if (!screen) return;

    screen.addEventListener('pointermove', (event) => {
        if (!window.isCameraOpen) return;

        const rect = screen.getBoundingClientRect();
        const normalized = (event.clientX - rect.left) / rect.width;
        const centered = (normalized - 0.5) * 2;

        // Deliberately ignore Y. Night 1 only allows left/right camera turning.
        applyCameraPan(centered * 85);
    });

    screen.addEventListener('pointerleave', () => {
        applyCameraPan(0);
    });

    window.addEventListener('keydown', (event) => {
        if (!window.isCameraOpen) return;

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            applyCameraPan(cameraPanTarget - 18);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            applyCameraPan(cameraPanTarget + 18);
        }
    });
}

// -----------------------------------------------------------------------------
// CAMERA BUTTONS
// -----------------------------------------------------------------------------

function setupCameraButtons() {
    cameraNav.innerHTML = '<img id="camera-map-img" src="../night1-sys/sprites/Screenshot 2026-04-10 11.54.10 PM.png" alt="Facility camera map">';

    for (const roomName in rooms) {
        const btn = document.createElement('button');
        btn.className = 'cam-btn';
        btn.innerText = `CAM: ${roomName}`;

        btn.onclick = () => {
            if (currentCamera === roomName) return;

            document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchCamera(roomName);
        };

        cameraNav.appendChild(btn);
    }

    const firstBtn = cameraNav.querySelector('.cam-btn');
    if (firstBtn) firstBtn.classList.add('active');

    switchCamera(currentCamera, false);
}

// -----------------------------------------------------------------------------
// AUDIO + STATIC
// -----------------------------------------------------------------------------

function playCameraSound() {
    if (currentCamAudio) {
        currentCamAudio.pause();
        currentCamAudio.currentTime = 0;
    }

    currentCamAudio = camSounds[Math.floor(Math.random() * camSounds.length)];
    currentCamAudio.play().catch(e => console.log("Audio block", e));
}

window.triggerFlicker = function() {
    const flash = document.getElementById('static-flash');
    if (!flash) return;

    flash.classList.remove('is-switching', 'is-long-switching');
    void flash.offsetWidth;
    flash.classList.add('is-switching');
};

window.triggerLongFlicker = function(oldRoom, newRoom) {
    if (!window.isCameraOpen) return;

    if (oldRoom && newRoom) {
        if (currentCamera !== oldRoom && currentCamera !== newRoom) return;
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

// -----------------------------------------------------------------------------
// CAMERA SWITCHING
// -----------------------------------------------------------------------------

function switchCamera(roomName, playAudio = true) {
    if (!rooms[roomName]) return;

    if (playAudio) {
        playCameraSound();
        window.triggerFlicker();
    }

    currentCamera = roomName;
    cameraPan = 0;
    cameraPanTarget = 0;

    cameraFeed.style.backgroundImage = `url('${rooms[roomName]}')`;
    cameraFeed.style.setProperty('--camera-pan', '0px');

    if (elongSprite) {
        elongSprite.style.setProperty('--camera-pan', '0px');
        elongSprite.style.display =
            window.aiPositions && window.aiPositions.elong === roomName ? 'block' : 'none';
    }

    if (charrlieSprite) {
        charrlieSprite.style.setProperty('--camera-pan', '0px');
        charrlieSprite.style.display =
            window.aiPositions && window.aiPositions.charrlie === roomName ? 'block' : 'none';
    }

    updateCameraHUD();
}

// Global UI refresher so AI can change what you see mid-static.
window.refreshCameraUI = function() {
    if (window.isCameraOpen) {
        switchCamera(currentCamera, false);
    }
};

// -----------------------------------------------------------------------------
// CAMERA OPEN/CLOSE
// -----------------------------------------------------------------------------

window.toggleCamera = function() {
    window.isCameraOpen = !window.isCameraOpen;

    if (window.isCameraOpen) {
        camUIMonitor.style.transform = 'translateY(0)';
        camUILeftPanel.classList.remove('is-visible');
        camUIRightPanel.classList.remove('is-visible');

        playCameraSound();
        window.triggerFlicker();
        switchCamera(currentCamera, false);
        applyCameraPan(0, true);
    } else {
        camUIMonitor.style.transform = 'translateY(100%)';

        if (currentCamAudio) {
            currentCamAudio.pause();
            currentCamAudio.currentTime = 0;
        }
    }
};

setupCameraHUD();
setupCameraPan();
setupCameraButtons();
