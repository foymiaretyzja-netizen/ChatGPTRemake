// --- night3-sys/CharrlieAIN3.js ---

// --- Audio Setup ---
const charrlieCreakSound = new Audio('../Sounds/dragon-studio-heavy-creaking-515252 (1).mp3');
const charrlieRunSound = new Audio('../Sounds/freesound_community-foley_footsteps_metal_001-77032.mp3');

// --- AI State Variables ---
window.charrlieStage = 1; 
let charrlieState = 'waiting'; // 'waiting', 'progressing', 'dashing', 'bounced'
let charrlieTimer = null;
let charrlieRunId = 0;
let charrlieTargetDoor = null;

// Initialize global position so the motion scanners can see him
window.aiPositions = window.aiPositions || {};
window.aiPositions.charrlie = 'Guest Room';

// Starts the AI after the initial 35-second delay
function clearCharrlieTimer() {
    if (charrlieTimer) {
        clearTimeout(charrlieTimer);
        charrlieTimer = null;
    }
}

function initCharrlie() {
    console.log("[Charrlie AI] Initialized. Waiting 35 seconds...");
    clearCharrlieTimer();
    const runId = ++charrlieRunId;
    charrlieTimer = setTimeout(() => {
        if (runId !== charrlieRunId || window.isBlackout) return;
        charrlieState = 'progressing';
        scheduleNextCharrlieMove();
    }, 35000);
}

// Randomizes the next stage movement between 7 and 15 seconds (Faster for Night 3)
function scheduleNextCharrlieMove() {
    if (window.isBlackout) return; // Stop if power is out

    const nextMoveTime = Math.floor(Math.random() * 8000) + 12000; // 12s - 20s
    
    clearCharrlieTimer();
    const runId = charrlieRunId;
    charrlieTimer = setTimeout(() => {
        if (runId !== charrlieRunId || window.isBlackout) return;
        advanceCharrlieStage();
    }, nextMoveTime);
}

// Moves Charrlie to the next visual stage
function advanceCharrlieStage() {
    if (window.isBlackout || charrlieState === 'dashing' || charrlieState === 'bounced') return;

    window.charrlieStage++; 
    console.log(`[Charrlie AI] Advanced to Stage ${window.charrlieStage}`);
    
    // Force the camera script to refresh the image if the player is watching
    if (typeof window.refreshCameraUI === 'function') {
        window.refreshCameraUI();
    }

    if (window.charrlieStage === 3) {
        // Play the heavy creaking sound
        charrlieCreakSound.currentTime = 0;
        charrlieCreakSound.play().catch(e => console.warn("[Audio] Charrlie creak blocked:", e));
        scheduleNextCharrlieMove();
    } else if (window.charrlieStage >= 4) {
        // Stage 4: He breaks into a sprint!
        startCharrlieDash();
    } else {
        scheduleNextCharrlieMove();
    }
}

// Charrlie runs down the hall
function startCharrlieDash() {
    charrlieState = 'dashing';
    
    // Randomly pick left or right door
    charrlieTargetDoor = Math.random() < 0.5 ? 'left' : 'right';
    
    // Update his global position so the player can ping him on the motion scanner!
    window.aiPositions.charrlie = charrlieTargetDoor === 'left' ? 'Presidential Left Door' : 'Presidential Right Door';
    console.log(`[Charrlie AI] DASHING to ${charrlieTargetDoor.toUpperCase()} door!`);
    
    // Play the metal footsteps running sound
    charrlieRunSound.currentTime = 0;
    charrlieRunSound.play().catch(e => console.warn("[Audio] Charrlie run blocked:", e));

    // Turn on the global camera static to induce panic
    applyDashStatic(true);

    // Player has exactly 7 seconds to react (Maintained for task-balancing)
    clearCharrlieTimer();
    const runId = charrlieRunId;
    charrlieTimer = setTimeout(() => {
        if (runId !== charrlieRunId || window.isBlackout) return;
        checkCharrlieAttack();
    }, 7000);
}

// Evaluate if the player survived the dash
function checkCharrlieAttack() {
    if (window.isBlackout) return;

    // Check if the door he ran to is currently closed
    const isDoorBlocked = (charrlieTargetDoor === 'left' && window.leftDoorClosed) || 
                          (charrlieTargetDoor === 'right' && window.rightDoorClosed);

    if (!isDoorBlocked) {
        // Door was open. Player dies.
        triggerCharrlieJumpscare();
    } else {
        // Door was closed!
        if (charrlieState === 'dashing') {
            // THE BOUNCE MECHANIC: He runs to the OTHER door!
            charrlieState = 'bounced';
            charrlieTargetDoor = charrlieTargetDoor === 'left' ? 'right' : 'left';
            
            // Update global position for scanners again
            window.aiPositions.charrlie = charrlieTargetDoor === 'left' ? 'Presidential Left Door' : 'Presidential Right Door';
            console.log(`[Charrlie AI] BLOCKED! Bouncing to the ${charrlieTargetDoor.toUpperCase()} door!`);
            
            // Play footsteps again to warn the player he is still moving
            charrlieRunSound.currentTime = 0;
            charrlieRunSound.play().catch(() => {});
            
            // Give them another 7 seconds for the new door
            clearCharrlieTimer();
            const runId = charrlieRunId;
            charrlieTimer = setTimeout(() => {
                if (runId !== charrlieRunId || window.isBlackout) return;
                checkCharrlieAttack();
            }, 7000);
            
        } else if (charrlieState === 'bounced') {
            // He tried both doors and was blocked both times. He gives up.
            resetCharrlie();
        }
    }
}

// Charrlie returns to his starting position
function resetCharrlie() {
    console.log("[Charrlie AI] Attack failed. Resetting to Guest Room.");
    clearCharrlieTimer();
    charrlieRunId++;
    window.charrlieStage = 1; 
    charrlieState = 'progressing';
    window.aiPositions.charrlie = 'Guest Room';
    
    // Turn off camera static and update the room image
    applyDashStatic(false);
    
    if (typeof window.refreshCameraUI === 'function') {
        window.refreshCameraUI();
    }
    
    // Start the cycle over
    scheduleNextCharrlieMove();
}

// The game over sequence
function triggerCharrlieJumpscare() {
    if (window.isBlackout) return;
    clearCharrlieTimer();
    charrlieRunId++;
    charrlieState = 'jumpscare';
    console.log("[Charrlie AI] JUMPSCARE!");
    applyDashStatic(false);
    
    // Force the monitor down if they are hiding in the cameras
    if (window.isCameraOpen && typeof window.toggleCamera === 'function') {
        window.toggleCamera();
    }

    // Grab his 2D sprite element from the office HTML
    const jumpscareSprite = document.getElementById('charrlie-sprite-office');
    if (jumpscareSprite) {
        jumpscareSprite.style.display = 'block';
        
        // Quick CSS animation to make him pop out
        jumpscareSprite.style.transition = 'transform 0.1s ease-in';
        jumpscareSprite.style.transform = 'scale(2.5) translateY(-10%)';
        
        // Reload the game after 2 seconds
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
}

// Controls the static overlay across all cameras while he runs
function applyDashStatic(isActive) {
    const staticFlash = document.getElementById('static-flash');
    if (staticFlash) {
        if (isActive) {
            staticFlash.style.opacity = '0.4';
            staticFlash.style.background = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMCKcCBXY/C6MAAAAASUVORK5CYII=') repeat";
        } else {
            staticFlash.style.opacity = '0';
        }
    }
}

// Kick off the AI!
initCharrlie();
