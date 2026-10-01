// --- night2-sys/powerN2.js ---

const powerDisplay = document.getElementById('power-display');
const panoramaBg = document.getElementById('office-panorama');
const btnLights = document.getElementById('btn-lights');

// UI elements for the motion sensors
const btnSensorLeft = document.getElementById('btn-sensor-left');
const btnSensorRight = document.getElementById('btn-sensor-right');
const sensorDisplay = document.getElementById('sensor-display'); 

// --- Audio Setup ---
const lightSwitchSound = new Audio('../Sounds/soundreality-switch-150130.mp3');
const lightHumSound = new Audio('../Sounds/freesound_community-fluoresent_light_hum_and_refrigerator-48831.mp3');
lightHumSound.loop = true; 
lightHumSound.volume = 0.5; 

const warningBeepSound = new Audio('../Sounds/freesound_community-beep-beep-43875.mp3');
const clearBeepSound = new Audio('../Sounds/musheran-beep-313342.mp3');

// --- NEW: Power Outage Sound ---
const powerDownSound = new Audio('../Sounds/freesound_community-machine-powering-down-84722.mp3');

let power = 100.0;
let isBlackout = false;
let lightsOn = true;
window.isBlackout = false;
let hasInteracted = false;
let lightTransitionTimer = null;

const BASE_DRAIN = 0.33; 
const SENSOR_POWER_COST = 1.5; 

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
    btnLights.addEventListener('click', () => {
        if (isBlackout) return;

        lightsOn = !lightsOn;
        
        lightSwitchSound.currentTime = 0;
        lightSwitchSound.play().catch(e => console.warn("[Audio] Switch sound error:", e));

        if (lightsOn) {
            clearTimeout(lightTransitionTimer);
            panoramaBg.style.transition = 'opacity 0.5s ease';
            panoramaBg.style.opacity = '0';
            lightTransitionTimer = setTimeout(() => {
                if (!isBlackout) {
                    panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room.jpg')";
                    panoramaBg.style.opacity = '1';
                }
            }, 500);
            btnLights.innerText = "Turn Off Lights";
            btnLights.style.borderColor = "#ffbb00";
            btnLights.style.color = "#ffbb00";
            
            lightHumSound.play().catch(e => console.warn("[Audio] Hum resume error:", e));
        } else {
            clearTimeout(lightTransitionTimer);
            panoramaBg.style.transition = 'opacity 0.5s ease';
            panoramaBg.style.opacity = '0';
            lightTransitionTimer = setTimeout(() => {
                if (isBlackout) return;
                panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room-blackout.jpg')";
                panoramaBg.style.opacity = '1';
            }, 500);
            btnLights.innerText = "Turn On Lights";
            btnLights.style.borderColor = "#555";
            btnLights.style.color = "#aaa";
            
            lightHumSound.pause();
        }
    });
}

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
        currentDrain *= 0.5; 
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
    window.isBlackout = true;
    clearTimeout(lightTransitionTimer);
    if (typeof window.cancelCurrentTask === 'function') window.cancelCurrentTask();
    lightsOn = false;
    
    lightHumSound.pause();
    
    // --- NEW: Play the dramatic power outage sound! ---
    powerDownSound.currentTime = 0;
    powerDownSound.play().catch(e => console.warn("[Audio] Power down sound error:", e));
    
    if (panoramaBg) {
        panoramaBg.style.transition = 'none';
        panoramaBg.style.opacity = '1';
        panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room-blackout.jpg')";
    }
    
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
