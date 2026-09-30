// --- night1-sys/power.js ---
// Power system for Night 1.
// The normal setup now lasts at least 3:15 with both doors closed,
// lights on, and the camera closed.

const powerDisplay = document.getElementById('power-display');
const panoramaBg = document.getElementById('office-panorama');
const btnLights = document.getElementById('btn-lights');

// The office image crossfades when the player toggles the lights.
// Blackout remains an immediate hard cut so a total power failure feels abrupt.
let lightTransitionTimer = null;

let power = 100.0;
let isBlackout = false;
let lightsOn = true;

// 100% / 300 seconds = 0.33%/sec base.
// Tuned so BOTH doors closed + lights on = 0.50%/sec,
// giving exactly 200 seconds (3:20) from 100% to 0%.
const BASE_DRAIN = 0.26;
const DOOR_DRAIN = 0.12;
const CAMERA_DRAIN = 0.10;

// Build the battery-style HUD once.
powerDisplay.innerHTML = `
    <div class="power-hud" aria-label="Power: 100%">
        <svg class="power-battery" viewBox="0 0 52 28" aria-hidden="true">
            <rect class="battery-shell" x="1.5" y="2" width="43" height="24" rx="5"></rect>
            <rect class="battery-terminal" x="46" y="9" width="4.5" height="10" rx="2"></rect>
            <rect class="battery-fill" x="5" y="5.5" width="35" height="17" rx="2.5"></rect>
        </svg>
        <span class="power-percent">100%</span>
    </div>
`;

const powerHud = powerDisplay.querySelector('.power-hud');
const batteryFill = powerDisplay.querySelector('.battery-fill');
const powerPercent = powerDisplay.querySelector('.power-percent');

const style = document.createElement('style');
style.textContent = `
    #power-display {
        position: absolute !important;
        top: 18px !important;
        left: 18px !important;
        z-index: 1000 !important;
        margin: 0 !important;
        padding: 0 !important;
        color: #fff !important;
        font-family: "DM Mono", "Courier New", monospace !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
        text-shadow: none !important;
        pointer-events: none;
    }

    .power-hud {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 106px;
        padding: 7px 10px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 10px;
        background: rgba(5, 7, 9, 0.78);
        box-shadow:
            0 5px 18px rgba(0,0,0,0.45),
            inset 0 0 0 1px rgba(255,255,255,0.035);
        backdrop-filter: blur(7px);
        -webkit-backdrop-filter: blur(7px);
    }

    .power-battery {
        width: 38px;
        height: auto;
        display: block;
        flex: 0 0 auto;
        filter: drop-shadow(0 0 5px rgba(125,255,190,0.18));
    }

    .battery-shell {
        fill: rgba(0,0,0,0.35);
        stroke: rgba(255,255,255,0.72);
        stroke-width: 2;
    }

    .battery-terminal {
        fill: rgba(255,255,255,0.72);
    }

    .battery-fill {
        fill: #7dffbe;
        transition: width 0.25s ease, fill 0.25s ease;
    }

    .power-percent {
        min-width: 42px;
        color: #f3f7f5;
        letter-spacing: 0.02em;
        text-align: right;
    }

    .power-hud.low {
        border-color: rgba(255,187,0,0.55);
    }

    .power-hud.low .battery-fill {
        fill: #ffbb00;
    }

    .power-hud.critical {
        border-color: rgba(255,55,55,0.7);
        animation: powerPulse 1s infinite;
    }

    .power-hud.critical .battery-fill {
        fill: #ff3838;
    }

    @keyframes powerPulse {
        0%, 100% { box-shadow: 0 5px 18px rgba(0,0,0,0.45), 0 0 0 rgba(255,55,55,0); }
        50% { box-shadow: 0 5px 18px rgba(0,0,0,0.45), 0 0 16px rgba(255,55,55,0.22); }
    }
`;
document.head.appendChild(style);

function updatePowerUI() {
    const value = Math.max(0, Math.min(100, power));
    const rounded = Math.floor(value);

    // Keep the exact battery proportions while changing the fill width.
    const fillWidth = Math.max(0, 35 * (value / 100));
    batteryFill.setAttribute('width', fillWidth.toFixed(2));
    powerPercent.textContent = `${rounded}%`;
    powerHud.setAttribute('aria-label', `Power: ${rounded}%`);

    powerHud.classList.toggle('low', value <= 25 && value > 10);
    powerHud.classList.toggle('critical', value <= 10);

    if (isBlackout) {
        powerPercent.textContent = '0%';
        powerHud.classList.remove('low');
        powerHud.classList.add('critical');
    }
}

// Toggle Lights Button Logic
btnLights.addEventListener('click', () => {
    if (isBlackout) return;

    lightsOn = !lightsOn;

    // Fade the normal office image out, swap the sprite, then fade it back in.
    // This is deliberately separate from blackout, which is always an instant cut.
    clearTimeout(lightTransitionTimer);
    panoramaBg.style.transition = 'opacity 0.5s ease';
    panoramaBg.style.opacity = '0';

    lightTransitionTimer = setTimeout(() => {
        panoramaBg.style.backgroundImage = lightsOn
            ? "url('../Scenes/Presidential-room.jpg')"
            : "url('../Scenes/Presidential-room-blackout.jpg')";

        requestAnimationFrame(() => {
            if (!isBlackout) panoramaBg.style.opacity = '1';
        });
    }, 500);

    if (lightsOn) {
        btnLights.innerText = "Turn Off Lights";
        btnLights.style.borderColor = "#ffbb00";
        btnLights.style.color = "#ffbb00";
    } else {
        btnLights.innerText = "Turn On Lights";
        btnLights.style.borderColor = "#555";
        btnLights.style.color = "#aaa";
    }
});

// Main Power Drain Loop
setInterval(() => {
    if (isBlackout) return;

    let currentDrain = BASE_DRAIN;

    // Turning off the lights cuts the base drain in half.
    if (!lightsOn) {
        currentDrain *= 0.5;
    }

    // Heavy power drainers.
    if (window.leftDoorClosed) currentDrain += DOOR_DRAIN;
    if (window.rightDoorClosed) currentDrain += DOOR_DRAIN;
    if (window.isCameraOpen) currentDrain += CAMERA_DRAIN;

    power -= currentDrain;

    if (power <= 0) {
        power = 0;
        updatePowerUI();
        triggerBlackout();
        return;
    }

    updatePowerUI();
}, 1000);

// Blackout State
function triggerBlackout() {
    isBlackout = true;
    lightsOn = false;

    // Hard cut on true blackout. No 0.5s fade here.
    clearTimeout(lightTransitionTimer);
    panoramaBg.style.transition = 'none';
    panoramaBg.style.opacity = '1';
    panoramaBg.style.backgroundImage = "url('../Scenes/Presidential-room-blackout.jpg')";

    power = 0;
    updatePowerUI();

    // Open doors if they were closed.
    window.leftDoorClosed = false;
    window.rightDoorClosed = false;
    document.getElementById('left-shadow').style.opacity = 0;
    document.getElementById('right-shadow').style.opacity = 0;

    // Kick the player out of the cameras if they are using them.
    if (window.isCameraOpen) {
        window.toggleCamera();
    }

    console.log("SYSTEM FAILURE: OUT OF POWER");
}

updatePowerUI();
