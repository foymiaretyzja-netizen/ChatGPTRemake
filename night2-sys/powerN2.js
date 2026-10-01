// --- night2-sys/powerN2.js ---

const powerDisplay = document.getElementById('power-display');
const panoramaBg = document.getElementById('office-panorama');
let btnLights = null;

(function upgradePowerConsole(){const panel=document.getElementById('right-panel');if(!panel)return;panel.innerHTML=`<div class="power-console"><div class="power-console-head"><div><div class="power-console-kicker">SYS-PWR / 02</div><div class="power-console-title">POWER & SENSOR ARRAY</div></div><div class="power-online"><i></i><span id="power-system-state">ONLINE</span></div></div><div class="power-main-readout"><div class="power-readout-label">RESERVE CAPACITY</div><div class="power-readout-row"><span id="power-console-percent">100%</span><span id="power-console-mode">STABLE</span></div><div class="power-bar"><div id="power-console-fill"></div><div class="power-bar-grid"></div></div><div class="power-readout-meta"><span id="power-console-drain">DRAW 0.33% / SEC</span><span id="power-console-runtime">ONLINE</span></div></div><div class="power-section-label">LIGHTING CONTROL</div><button id="btn-lights" class="power-light-btn" type="button"><span class="power-light-icon"></span><span class="power-light-copy"><b id="power-light-title">LIGHTING ON</b><small id="power-light-sub">NORMAL ILLUMINATION</small></span><span class="power-light-toggle"><i></i></span></button><div class="power-section-label">MOTION SENSOR</div><div class="sensor-console"><div class="sensor-topline"><span>DOOR ARRAY</span><span id="sensor-state">READY</span></div><div class="sensor-buttons"><button id="btn-sensor-left" class="sensor-btn" type="button"><span class="sensor-dot"></span>LEFT DOOR</button><button id="btn-sensor-right" class="sensor-btn" type="button"><span class="sensor-dot"></span>RIGHT DOOR</button></div><div class="sensor-result" id="sensor-display"><span class="sensor-pulse"></span><span>AWAITING SCAN</span></div></div><div class="power-footer"><span>BLACK HOUSE // POWER BUS</span><span id="power-load">LOAD: NORMAL</span></div></div>`;const style=document.createElement('style');style.textContent=`#power-display{display:none!important}#right-panel{width:390px!important;height:390px!important;max-height:min(390px,72vh)!important;padding:0!important;overflow:hidden!important;background:transparent!important;border:0!important;box-shadow:none!important}.power-console{width:100%;height:100%;padding:16px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#3d4942 #090b0a;background:linear-gradient(155deg,rgba(15,19,17,.985),rgba(5,8,7,.99));border:1px solid #47534c;border-radius:14px 14px 0 0;box-shadow:0 -15px 40px rgba(0,0,0,.45),inset 0 1px rgba(255,255,255,.045);color:#dfe8e2;font-family:"DM Mono","Courier New",monospace}.power-console::-webkit-scrollbar{width:7px}.power-console::-webkit-scrollbar-track{background:#090b0a}.power-console::-webkit-scrollbar-thumb{background:#3d4942}.power-console-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.power-console-kicker{font-size:8px;color:#65736b;letter-spacing:.18em;margin-bottom:4px}.power-console-title{font:700 13px "Courier New",monospace;letter-spacing:.035em;color:#e5ede8}.power-online{display:flex;align-items:center;gap:6px;padding:4px 7px;border:1px solid #365341;background:rgba(77,190,116,.045);color:#7dffbe;font-size:8px;letter-spacing:.09em}.power-online i{width:6px;height:6px;border-radius:50%;background:#7dffbe;box-shadow:0 0 8px #7dffbe}.power-main-readout{margin-top:12px;padding:11px;border:1px solid #2c3530;background:linear-gradient(180deg,rgba(16,22,19,.8),rgba(7,10,9,.8))}.power-readout-label,.power-section-label{font-size:8px;letter-spacing:.15em;color:#65736b}.power-readout-row{display:flex;align-items:baseline;justify-content:space-between;margin:2px 0 7px}#power-console-percent{font:700 31px/1 "Courier New",monospace;color:#eff8f2;letter-spacing:-.04em}#power-console-mode{font-size:8px;color:#7dffbe;letter-spacing:.12em}.power-bar{height:16px;position:relative;overflow:hidden;background:#070a09;border:1px solid #29322d}#power-console-fill{height:100%;width:100%;background:linear-gradient(90deg,#477e5a,#8ee6ad);box-shadow:0 0 15px rgba(90,220,130,.18);transition:width .25s ease,background .25s ease}.power-bar-grid{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 18px,rgba(255,255,255,.06) 18px 19px);pointer-events:none}.power-readout-meta{display:flex;justify-content:space-between;margin-top:6px;font-size:7px;color:#59645e;letter-spacing:.07em}.power-section-label{margin:11px 0 6px}.power-light-btn{width:100%;display:flex;align-items:center;gap:9px;padding:9px;background:linear-gradient(180deg,#161d19,#0c110f);border:1px solid #7d641d;color:#ffcf5a;cursor:pointer;text-align:left;transition:.18s}.power-light-btn:hover{background:#1b241f;border-color:#b28d2c}.power-light-icon{width:25px;height:25px;border:1px solid currentColor;border-radius:6px;position:relative}.power-light-icon:before{content:"";position:absolute;width:8px;height:8px;border-radius:50%;left:7px;top:6px;background:currentColor;box-shadow:0 0 9px currentColor}.power-light-copy{flex:1;display:flex;flex-direction:column;gap:2px}.power-light-copy b{font:700 9px "DM Mono",monospace;letter-spacing:.08em}.power-light-copy small{font:7px "DM Mono",monospace;color:#68736d;letter-spacing:.06em}.power-light-toggle{width:30px;height:15px;border:1px solid #57635b;border-radius:9px;padding:2px}.power-light-toggle i{display:block;width:9px;height:9px;border-radius:50%;background:#ffcf5a;box-shadow:0 0 6px rgba(255,207,90,.6);transform:translateX(14px);transition:.2s}.sensor-console{border:1px solid #2c3530;background:rgba(7,10,9,.62);padding:9px}.sensor-topline{display:flex;justify-content:space-between;font-size:7px;letter-spacing:.1em;color:#65736b;margin-bottom:7px}.sensor-buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sensor-btn{padding:9px 7px;border:1px solid #354039;background:#101512;color:#b9c5be;font:700 8px "DM Mono",monospace;letter-spacing:.07em;cursor:pointer}.sensor-btn:hover{border-color:#718078;color:#eef6f1;background:#17201b}.sensor-btn:disabled{opacity:.45;cursor:not-allowed}.sensor-dot{display:inline-block;width:5px;height:5px;border:1px solid #77847c;border-radius:50%;margin-right:5px}.sensor-result{min-height:30px;margin-top:7px;border:1px solid #252e29;background:#080b0a;display:flex;align-items:center;gap:7px;padding:7px;color:#77837c;font-size:7px;letter-spacing:.08em}.sensor-pulse{width:6px;height:6px;border-radius:50%;background:#6d7771;box-shadow:0 0 7px rgba(130,150,140,.35)}.power-footer{display:flex;justify-content:space-between;margin-top:10px;color:#4e5a53;font-size:6px;letter-spacing:.08em}#right-panel.power-critical .power-console{border-color:#74403d}#right-panel.power-critical #power-console-percent,#right-panel.power-critical #power-console-mode{color:#ff6e6e}#right-panel.power-critical #power-console-fill{background:linear-gradient(90deg,#9c3d3d,#ff6767)}#right-panel.power-warning #power-console-percent,#right-panel.power-warning #power-console-mode{color:#ffcf5a}#right-panel.power-warning #power-console-fill{background:linear-gradient(90deg,#82651e,#e1b13f)}#right-panel.power-offline .power-console{border-color:#733b3b}.power-offline .power-online{color:#ff6666;border-color:#5d3434}.power-offline .power-online i{background:#ff5555;box-shadow:0 0 8px #ff5555}.power-offline .power-light-btn{opacity:.5;pointer-events:none}`;document.head.appendChild(style)})();btnLights=document.getElementById('btn-lights');

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
            btnLights.querySelector("#power-light-title").textContent="LIGHTING ON";btnLights.querySelector("#power-light-sub").textContent="NORMAL ILLUMINATION";btnLights.querySelector(".power-light-toggle i").style.transform="translateX(14px)";
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
            btnLights.querySelector("#power-light-title").textContent="LIGHTING OFF";btnLights.querySelector("#power-light-sub").textContent="LOW-POWER MODE";btnLights.querySelector(".power-light-toggle i").style.transform="translateX(0)";
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
        sensorDisplay.innerHTML = `<span class="sensor-pulse"></span><span>${feedbackMsg}</span>`;
        sensorDisplay.style.color = isEntityPresent ? "#ff6b6b" : "#7dffbe";
        
        setTimeout(() => { 
            if (!isBlackout) {
                sensorDisplay.innerHTML = '<span class="sensor-pulse"></span><span>AWAITING SCAN</span>'; 
                sensorDisplay.style.color = "#fff";
            }
        }, 2000);
    }
}

// Hook up motion sensor buttons
if (btnSensorLeft) btnSensorLeft.addEventListener('click', () => scanDoor('left'));
if (btnSensorRight) btnSensorRight.addEventListener('click', () => scanDoor('right'));

function updatePowerUI(){const percent=Math.max(0,Math.floor(power)),fill=document.getElementById('power-console-fill'),label=document.getElementById('power-console-percent'),mode=document.getElementById('power-console-mode'),drain=document.getElementById('power-console-drain'),runtime=document.getElementById('power-console-runtime'),load=document.getElementById('power-load'),panel=document.getElementById('right-panel');if(powerDisplay)powerDisplay.innerText=`Power: ${percent}%`;if(label)label.textContent=`${percent}%`;if(fill)fill.style.width=percent+'%';let state='STABLE',loadState='NORMAL';if(percent<=10){state='CRITICAL';loadState='CRITICAL';panel?.classList.add('power-critical');panel?.classList.remove('power-warning')}else if(percent<=25){state='LOW RESERVE';loadState='ELEVATED';panel?.classList.add('power-warning');panel?.classList.remove('power-critical')}else panel?.classList.remove('power-warning','power-critical');if(mode)mode.textContent=state;if(load)load.textContent=`LOAD: ${loadState}`;if(drain){let d=BASE_DRAIN;if(!lightsOn)d*=.5;if(window.leftDoorClosed)d+=.15;if(window.rightDoorClosed)d+=.15;if(window.isCameraOpen)d+=.10;drain.textContent=`DRAW ${d.toFixed(2)}% / SEC`}if(runtime)runtime.textContent=isBlackout?'OFFLINE':'ONLINE'}

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
    if (typeof window.applyCharrlieDashStatic === 'function') window.applyCharrlieDashStatic(false);
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
        sensorDisplay.innerHTML = '<span class="sensor-pulse"></span><span>SYSTEM OFFLINE</span>';
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
