// --- night3-sys/ZuckenBurgerN3.js ---

// --- Audio Setup ---
const zuckArrivalSound = new Audio('../Sounds/dragon-studio-door-opening-454242.mp3');
const zuckJumpscareSound = new Audio('../Sounds/sound_effects75-eyesaur-jumpscare-sound-482110.mp3');

// --- Sprite Setup ---
let zuckOfficeSprite = document.getElementById('zuck-sprite-office');

if (!zuckOfficeSprite) {
    zuckOfficeSprite = document.createElement('img');
    zuckOfficeSprite.id = 'zuck-sprite-office';
    zuckOfficeSprite.src = '../night3-sys/sprites/ZuckenBurger.png';
    zuckOfficeSprite.style.display = 'none';
    zuckOfficeSprite.style.position = 'absolute';
    zuckOfficeSprite.style.left = '50%';
    zuckOfficeSprite.style.top = '50%';
    zuckOfficeSprite.style.transform = 'translate(-50%, -50%)';
    zuckOfficeSprite.style.zIndex = '100'; 
    zuckOfficeSprite.style.pointerEvents = 'none';
    document.body.appendChild(zuckOfficeSprite);
}

// --- AI State Variables ---
let zuckTimer = null;
let zuckActive = false;
let zuckAttackId = 0;
let zuckInOffice = false;

window.aiPositions = window.aiPositions || {};
window.aiPositions.zuckenburger = 'Janitor Room';
window.aiPositions.zuck = 'Janitor Room';

// 1. Starts the AI. Waits exactly 35 seconds, then attacks immediately.
function clearZuckTimer() {
    if (zuckTimer) {
        clearTimeout(zuckTimer);
        zuckTimer = null;
    }
}

function initZuckenBurger() {
    console.log("[ZuckenBurger AI] Initialized. Grace period active. First attack in 35 seconds...");
    clearZuckTimer();
    const attackId = ++zuckAttackId;
    zuckTimer = setTimeout(() => {
        if (attackId !== zuckAttackId || window.isBlackout) return;
        zuckActive = true;
        enterOffice();
    }, 35000);
}

// 2. Randomizes the next attack between 15s and 24s (for subsequent loops)
function scheduleZuckAttack() {
    if (window.isBlackout) return;

    // Math.random() * 10000 gives 0-9.9k. Adding 15000 gives exactly 15s to 24.9s
    const nextAttackTime = Math.floor(Math.random() * 10000) + 15000; 
    console.log(`[ZuckenBurger AI] Next attack in ${nextAttackTime / 1000} seconds.`);

    clearZuckTimer();
    const attackId = ++zuckAttackId;
    zuckTimer = setTimeout(() => {
        if (attackId !== zuckAttackId || window.isBlackout || !zuckActive) return;
        enterOffice();
    }, nextAttackTime);
}

// 3. ZuckenBurger bypasses doors and enters the office
function enterOffice() {
    if (window.isBlackout || !zuckActive || zuckInOffice) return;
    zuckInOffice = true;

    console.log("[ZuckenBurger AI] ZuckenBurger has entered the office! TURN OFF THE LIGHTS!");
    window.aiPositions.zuckenburger = 'Office';
    window.aiPositions.zuck = 'Office';
    
    // Update Cameras if looking at Janitor Room
    if (typeof window.refreshCameraUI === 'function') window.refreshCameraUI();
    
    // Play an eerie arrival sound
    zuckArrivalSound.currentTime = 0;
    zuckArrivalSound.play().catch(e => console.warn("[Audio] Zuck arrival blocked:", e));

    // Force the camera down if the player is looking at the monitor
    if (window.isCameraOpen && typeof window.toggleCamera === 'function') {
        window.toggleCamera();
    }

    // Display the office sprite
    zuckOfficeSprite.style.display = 'block';

    // Player has exactly 6 seconds to react
    clearZuckTimer();
    const attackId = zuckAttackId;
    zuckTimer = setTimeout(() => {
        if (attackId !== zuckAttackId || window.isBlackout || !zuckInOffice) return;
        checkZuckSurvival();
    }, 6000);
}

// 4. Evaluate if the player turned off the lights in time
function checkZuckSurvival() {
    if (window.isBlackout || !zuckInOffice) {
        if (window.isBlackout) leaveOffice();
        return;
    }
    // If the power went out, the lights are technically off, which saves the player
    if (window.isOfficeDark || window.isBlackout) {
        console.log("[ZuckenBurger AI] The room is dark. ZuckenBurger leaves.");
        leaveOffice();
    } else {
        console.log("[ZuckenBurger AI] The lights were on. Jumpscare triggered!");
        triggerZuckJumpscare();
    }
}

// 5. ZuckenBurger resets to the Janitor Room
function leaveOffice() {
    clearZuckTimer();
    zuckInOffice = false;
    zuckOfficeSprite.style.display = 'none';
    window.aiPositions.zuckenburger = 'Janitor Room';
    
    // Ensure cameras update if open
    if (typeof window.refreshCameraUI === 'function') {
        window.refreshCameraUI();
    }
    
    // Start the attack cycle over (now using the 15-24 second randomizer)
    scheduleZuckAttack();
}

// 6. The game over sequence
function triggerZuckJumpscare() {
    if (!zuckInOffice || window.isBlackout) return;
    clearZuckTimer();
    zuckActive = false;
    zuckAttackId++;
    // Hide UI elements to focus on the scare
    const mon = document.getElementById('camera-monitor');
    if (mon) mon.style.display = 'none';
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel) leftPanel.style.display = 'none';
    const rightPanel = document.getElementById('right-panel');
    if (rightPanel) rightPanel.style.display = 'none';

    // Force his visibility back to normal in case the jumpscare triggers the split-second lights toggle
    zuckOfficeSprite.style.opacity = '1';
    zuckOfficeSprite.style.filter = 'brightness(1.5) contrast(1.2)';

    // Play Jumpscare Audio
    zuckJumpscareSound.currentTime = 0;
    zuckJumpscareSound.play().catch(e => console.warn("[Audio] Zuck jumpscare blocked:", e));

    // Scale the sprite from the bottom center so it engulfs the screen
    zuckOfficeSprite.style.transition = 'transform 0.15s ease-in, filter 0.15s ease-in';
    zuckOfficeSprite.style.transformOrigin = 'bottom center';
    zuckOfficeSprite.style.transform = 'scale(8)';

    setTimeout(() => {
        alert("ZUCKENBURGER HAS HARVESTED YOUR DATA.");
        location.reload();
    }, 1500);
}

// 7. REAL-TIME LIGHTING SYNC (Makes him dark with the room)
setInterval(() => {
    // Only apply the visual change if he is actively in the office
    if (zuckActive && zuckOfficeSprite.style.display === 'block') {
        
        // Prevent him from dimming if he is currently in the middle of his jumpscare zoom
        if (zuckOfficeSprite.style.transform.includes('scale(8)')) return;

        if (window.isOfficeDark || window.isBlackout) {
            // Drop opacity and brightness to make him a spooky silhouette
            zuckOfficeSprite.style.opacity = '0.2';
            zuckOfficeSprite.style.filter = 'brightness(0)';
            zuckOfficeSprite.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
        } else {
            // Lights are on, fully visible
            zuckOfficeSprite.style.opacity = '1';
            zuckOfficeSprite.style.filter = 'brightness(1)';
        }
    }
}, 100); // Checks every 100 milliseconds for seamless syncing

// Kick off the AI!
initZuckenBurger();
