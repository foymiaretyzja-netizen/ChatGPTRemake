// --- night3-sys/powerN3.js ---

const powerDisplay = document.getElementById('power-display');
const panoramaBg = document.getElementById('office-panorama');
const btnLights = document.getElementById('btn-lights');

// UI elements for the motion sensors
const btnSensorLeft = document.getElementById('btn-sensor-left');
const btnSensorRight = document.getElementById('btn-sensor-right');
const sensorDisplay = document.getElementById('sensor-display'); 

document.head.insertAdjacentHTML('beforeend', "<style id=\"n3-power-ui-style\">\n#power-display{position:absolute!important;top:18px!important;left:18px!important;width:min(360px,calc(100vw - 36px));z-index:100!important;font-family:\"Courier New\",monospace!important;color:#d8e3dc!important;text-shadow:none!important}\n.n3-power-shell{border:1px solid #344139;background:linear-gradient(145deg,rgba(8,12,10,.96),rgba(2,4,3,.94));box-shadow:inset 0 0 28px rgba(0,0,0,.7),0 10px 30px rgba(0,0,0,.35);padding:12px}\n.n3-power-head,.n3-power-meter-top,.n3-power-readouts{display:flex;justify-content:space-between;align-items:center;gap:10px}\n.n3-power-kicker{font-size:8px;color:#718078;letter-spacing:.18em}.n3-power-title{margin-top:4px;font-size:11px;font-weight:700;letter-spacing:.1em}.n3-power-status{font-size:9px;letter-spacing:.12em;color:#c47d6e}\n.n3-power-main{margin-top:12px;padding:10px;border:1px solid #29342e;background:#050807}.n3-power-meter-top{font-size:8px;color:#77867d;letter-spacing:.12em}.n3-power-value{font-size:24px;color:#d8e6dc;letter-spacing:0}\n.n3-power-bar{height:7px;margin-top:9px;background:#111814;border:1px solid #27332c;overflow:hidden}.n3-power-fill{display:block;height:100%;width:0;background:#91ad99;box-shadow:0 0 10px rgba(145,173,153,.3);transition:width .25s ease}\n.n3-power-readouts{margin-top:8px;color:#5e6c64;font-size:7px;letter-spacing:.1em}.n3-power-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:7px}.n3-power-grid>div{padding:7px;border:1px solid #27312c;background:#060908}.n3-power-grid span{display:block;color:#536159;font-size:7px;letter-spacing:.1em}.n3-power-grid strong{display:block;margin-top:4px;color:#87968e;font-size:8px;letter-spacing:.06em}\n#power-display[data-state=\"offline\"] .n3-power-status{color:#c47d6e}#power-display[data-state=\"critical\"] .n3-power-status{color:#d1a061}#power-display[data-state=\"low\"] .n3-power-status{color:#c7b36c}#power-display[data-state=\"online\"] .n3-power-status{color:#8fb89c}\n#power-display[data-state=\"offline\"] .n3-power-fill{background:#9b4f48}#power-display[data-state=\"critical\"] .n3-power-fill{background:#c97968;animation:n3PowerPulse .8s steps(2,end) infinite}#power-display[data-state=\"low\"] .n3-power-fill{background:#c5a96d}#power-display[data-state=\"online\"] .n3-power-fill{background:#91ad99}\n@keyframes n3PowerPulse{50%{opacity:.45}}@media(max-width:700px){#power-display{width:calc(100vw - 24px);top:12px!important;left:12px!important}.n3-power-grid{grid-template-columns:1fr}.n3-power-shell{padding:9px}}\n</style>");

// --- Audio Setup ---
const lightSwitchSound = new Audio('../Sounds/soundreality-switch-150130.mp3');
const lightHumSound = new Audio('../Sounds/freesound_community-fluoresent_light_hum_and_refrigerator-48831.mp3');
lightHumSound.loop = true; 
lightHumSound.volume = 0.5;

// Night 3 starts in a complete blackout. Task 1 restores the lighting system.
if (panoramaBg) panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room-blackout.jpg')"; 

const warningBeepSound = new Audio('../Sounds/freesound_community-beep-beep-43875.mp3');
const clearBeepSound = new Audio('../Sounds/musheran-beep-313342.mp3');

const powerDownSound = new Audio('../Sounds/freesound_community-machine-powering-down-84722.mp3');

if (powerDisplay) {
    powerDisplay.innerHTML = '<div class="n3-power-shell">
        <div class="n3-power-head"><div><div class="n3-power-kicker">SYS-PWR / 03</div><div class="n3-power-title">BLACK HOUSE POWER BUS</div></div><div class="n3-power-status">OFFLINE</div></div>
        <div class="n3-power-main"><div class="n3-power-meter-top"><span>RESERVE CAPACITY</span><strong class="n3-power-value">0%</strong></div><div class="n3-power-bar"><span class="n3-power-fill"></span></div><div class="n3-power-readouts"><span class="n3-power-draw">DRAW // 0.00% / SEC</span><span>BUS // NIGHT 03</span></div></div>
        <div class="n3-power-grid"><div><span>LIGHTING</span><strong class="n3-light-state">OFFLINE</strong></div><div><span>DOOR ARRAY</span><strong>READY</strong></div><div><span>MOTION GRID</span><strong class="n3-motion-state">OFFLINE</strong></div></div>
    </div>';
}

let power = 100.0;
let isBlackout = true;
let lightsOn = false;
let hasInteracted = false; 

// --- NEW: Global State for ZuckenBurger ---
window.isOfficeDark = true;
window.isBlackout = true; 

// --- UPDATED: Reduced Power Drain for Longer Night 3 ---
const BASE_DRAIN = 0.07; // Reduced from 0.33 so ambient power lasts significantly longer
const SENSOR_POWER_COST = 1.0; // Reduced from 1.5 to allow for more door checks between tasks

// Global click listener to bypass Autoplay restrictions
document.addEventListener('click', () => {
    if (!hasInteracted) {
        hasInteracted = true;
        if (lightsOn && !isBlackout) {
            lightHumSound.play().catch(e => console.warn("[Audio] Hum blocked:", e));
        }
    }
});

// Toggle Lights Button Logic
if (btnLights) {
    btnLights.disabled = true;
    btnLights.innerText = 'LIGHTS OFFLINE // REPAIR REQUIRED';
    btnLights.addEventListener('click', () => {
        if (isBlackout) return;

        lightsOn = !lightsOn;
        window.isOfficeDark = !lightsOn; // Update global state for ZuckenBurger
        
        lightSwitchSound.currentTime = 0;
        lightSwitchSound.play().catch(e => console.warn("[Audio] Switch sound error:", e));

        if (lightsOn) {
            panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room.jpg')";
            btnLights.innerText = "Turn Off Lights";
            btnLights.style.borderColor = "#ffbb00";
            btnLights.style.color = "#ffbb00";
            
            lightHumSound.play().catch(e => console.warn("[Audio] Hum resume error:", e));
        } else {
            panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room-blackout.jpg')";
            btnLights.innerText = "Turn On Lights";
            btnLights.style.borderColor = "#555";
            btnLights.style.color = "#aaa";
            
            lightHumSound.pause();
        }
    });
}

// Task 1 calls this after all light repairs are completed.
window.restoreLights = function() {
    if (!isBlackout) return;
    isBlackout = false;
    window.isBlackout = false;
    lightsOn = true;
    window.isOfficeDark = false;
    if (panoramaBg) panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room.jpg')";
    if (btnLights) {
        btnLights.disabled = false;
        btnLights.innerText = 'Turn Off Lights';
        btnLights.style.borderColor = '#8fb89c';
        btnLights.style.color = '#b9d7c2';
    }
    if (sensorDisplay) {
        sensorDisplay.innerText = 'SYSTEM ONLINE // LIGHTING RESTORED';
        sensorDisplay.style.color = '#8fb89c';
        setTimeout(() => { if (!isBlackout) sensorDisplay.innerText = 'Scanner Ready'; }, 2500);
    }
    lightSwitchSound.currentTime = 0;
    lightSwitchSound.play().catch(e => console.warn('[Audio] Restore switch error:', e));
    lightHumSound.currentTime = 0;
    lightHumSound.play().catch(e => console.warn('[Audio] Restore hum error:', e));
    updatePowerUI();
};

// Motion Sensor Logic
function scanDoor(side) {
    if (isBlackout) return;

    power -= SENSOR_POWER_COST;
    updatePowerUI();

    if (power <= 0) {
        triggerBlackout();
        return;
    }

    let isEntityPresent = false;

    if (window.aiPositions) {
        if (side === 'left' && window.aiPositions.charrlie === 'Presidential Left Door') {
            isEntityPresent = true;
        } else if (side === 'right' && window.aiPositions.elong === 'Presidential Right Door') {
            isEntityPresent = true;
        }
    }

    const feedbackMsg = isEntityPresent ? `WARNING: MOTION AT ${side.toUpperCase()} DOOR` : `CLEAR: NO MOTION`;
    console.log(`[Motion Sensor] ${feedbackMsg}`);
    
    if (isEntityPresent) {
        warningBeepSound.currentTime = 0;
        warningBeepSound.play().catch((e) => console.warn("[Audio] Warning beep error:", e));
    } else {
        clearBeepSound.currentTime = 0;
        clearBeepSound.play().catch((e) => console.warn("[Audio] Clear beep error:", e));
    }
    
    if (sensorDisplay) {
        sensorDisplay.innerText = feedbackMsg;
        sensorDisplay.style.color = isEntityPresent ? "#ff0000" : "#00ff00";
        
        setTimeout(() => { 
            if (!isBlackout) {
                sensorDisplay.innerText = "Scanner Ready"; 
                sensorDisplay.style.color = "#fff";
            }
        }, 2000);
    }
}

// Hook up motion sensor buttons
if (btnSensorLeft) btnSensorLeft.addEventListener('click', () => scanDoor('left'));
if (btnSensorRight) btnSensorRight.addEventListener('click', () => scanDoor('right'));

function updatePowerUI() {
    if (powerDisplay) {
        powerDisplay.innerText = `Power: ${Math.max(0, Math.floor(power))}%`;
    }
}

// Main Power Drain Loop
setInterval(() => {
    if (isBlackout) return;

    let currentDrain = BASE_DRAIN;

    if (!lightsOn) {
        currentDrain *= 0.5; // Saving power by turning off lights
    }

    if (window.leftDoorClosed) currentDrain += 0.15;
    if (window.rightDoorClosed) currentDrain += 0.15;
    if (window.isCameraOpen) currentDrain += 0.10;

    power -= currentDrain;

    if (power <= 0) {
        power = 0;
        triggerBlackout();
    } else {
        updatePowerUI();
    }

}, 1000);

// Blackout State
function triggerBlackout() {
    if (isBlackout) return; 
    isBlackout = true;
    lightsOn = false;
    window.isOfficeDark = true; // Technically dark, but the player is probably doomed anyway!
    
    lightHumSound.pause();
    
    powerDownSound.currentTime = 0;
    powerDownSound.play().catch(e => console.warn("[Audio] Power down sound error:", e));
    
    if (panoramaBg) panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room-blackout.jpg')";
    
    if (powerDisplay) {
        powerDisplay.innerText = "Power: 0%";
        powerDisplay.style.color = "#ff0000";
    }

    if (sensorDisplay) {
        sensorDisplay.innerText = "SYSTEM OFFLINE";
        sensorDisplay.style.color = "#ff0000";
    }

    window.leftDoorClosed = false;
    window.rightDoorClosed = false;
    
    const leftShadow = document.getElementById('left-shadow');
    const rightShadow = document.getElementById('right-shadow');
    if (leftShadow) leftShadow.style.opacity = 0;
    if (rightShadow) rightShadow.style.opacity = 0;

    if (window.isCameraOpen && typeof window.toggleCamera === 'function') {
        window.toggleCamera();
    }

    console.log("SYSTEM FAILURE: OUT OF POWER");
}
