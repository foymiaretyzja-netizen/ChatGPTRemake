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
