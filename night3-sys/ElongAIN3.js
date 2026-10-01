// --- night3-sys/ElongAIN3.js ---

const elongAudioCues = [
    new Audio('../Sounds/soundreality-knocking-on-a-metal-door-226310.mp3'),
    new Audio('../Sounds/aglaxle-glass-shattering-461637.mp3'),
    new Audio('../Sounds/freesound_community-hitting-metal-31859.mp3'),
    new Audio('../Sounds/dragon-studio-knocking-door-1-397992.mp3'),
    new Audio('../Sounds/alesiadavina-horror-sound-monster-breath-189934.mp3')
];

const elongJumpscareSound = new Audio('../Sounds/sound_effects75-eyesaur-jumpscare-sound-482110.mp3');
const elongStaticSound = new Audio('../Sounds/yourugor-tv-static-noise-291374.mp3'); 
const elongOfficeSprite = document.getElementById('elong-sprite-office');

const elongMap = {
    'Storage': ['Kitchen', 'Conference Room'],
    'Kitchen': ['Storage', 'Diner', 'Conference Room'],
    'Conference Room': ['Presidential Right Door', 'Storage'],
    'Diner': ['Janitor Room', 'Presidential Left Door', 'Kitchen'],
    'Janitor Room': ['Diner', 'Presidential Left Door']
};

let elongCurrentRoom = 'Storage';
let elongAtDoor = false;
let elongGraceTimer = null;
let elongSoundLoop = null;

let elongMoveTimeout = null;
let elongLingerTimeout = null;
let elongTransitionTimeout = null;
let elongRunId = 0;

let elongActive = false; 

window.aiPositions = window.aiPositions || {};
window.aiPositions.elong = elongCurrentRoom;

function clearElongTimers() {
    clearTimeout(elongMoveTimeout);
    clearTimeout(elongLingerTimeout);
    clearTimeout(elongTransitionTimeout);
    clearInterval(elongSoundLoop);
    elongMoveTimeout = null;
    elongLingerTimeout = null;
    elongTransitionTimeout = null;
    elongSoundLoop = null;
}

function loopElong() {
    if (!elongActive || window.isBlackout) return;
    moveElong();
    elongMoveTimeout = setTimeout(loopElong, Math.random() * 2000 + 7000);
}

function moveElong() {
    if (!elongActive || elongAtDoor || window.isBlackout) return; 

    console.log(`[Elong AI] Assessing move... Current location: ${elongCurrentRoom}`);

    const roll = Math.floor(Math.random() * 3) + 1;
    let nextRoom = elongCurrentRoom;
    const connections = elongMap[elongCurrentRoom];

    if (roll === 1) {
        nextRoom = connections[Math.floor(Math.random() * connections.length)];
    } else {
        if (elongCurrentRoom === 'Storage') nextRoom = 'Conference Room';
        else if (elongCurrentRoom === 'Conference Room') nextRoom = 'Presidential Right Door';
        else if (elongCurrentRoom === 'Kitchen') nextRoom = 'Conference Room';
        else nextRoom = connections[0];
    }

    if (nextRoom !== elongCurrentRoom) {
        console.log(`[Elong AI] Moving from ${elongCurrentRoom} to ${nextRoom}`);
        
        elongStaticSound.currentTime = 0;
        elongStaticSound.play().catch((e) => console.warn("[Audio Blocked] Static sound:", e));

        if (window.isCameraOpen && typeof window.triggerLongFlicker === "function") {
            window.triggerLongFlicker(elongCurrentRoom, nextRoom);
        }

        const runId = elongRunId;
        clearTimeout(elongTransitionTimeout);
        elongTransitionTimeout = setTimeout(() => {
            if (runId !== elongRunId || window.isBlackout || !elongActive) return;
            elongCurrentRoom = nextRoom;
            window.aiPositions.elong = elongCurrentRoom;
            
            if (typeof window.refreshCameraUI === "function") {
                window.refreshCameraUI();
            }

            if (elongCurrentRoom === 'Presidential Right Door') {
                console.log(`[Elong AI] Arrived at Right Door!`);
                triggerElongAtDoor();
            }
        }, 200); 
    } else {
        console.log(`[Elong AI] Decided to stay in ${elongCurrentRoom}`);
    }
}

function triggerElongAtDoor() {
    elongAtDoor = true;
    playElongHorrorSound();

    // RESTORED: 10 seconds to react to balance the harder tasks
    elongGraceTimer = setTimeout(() => {
        if (window.isBlackout) return;
        if (!window.rightDoorClosed) {
            console.log(`[Elong AI] Door open. Triggering jumpscare!`);
            triggerElongJumpscare();
        } else {
            console.log(`[Elong AI] Door closed. Lingering...`);
            handleElongLinger();
        }
    }, 10000);

    // Faster sound cues at the door to keep the tension high
    elongSoundLoop = setInterval(() => {
        if (Math.random() < 0.4) playElongHorrorSound();
    }, 3500); 
}

function handleElongLinger() {
    // NIGHT 3: Lingers for a shorter duration so he can attack again sooner (3-6 seconds)
    const lingerTime = Math.random() * 3000 + 3000;
    elongLingerTimeout = setTimeout(() => {
        if (window.rightDoorClosed) {
            console.log(`[Elong AI] Gave up. Returning to Storage.`);
            resetElong();
        } else {
            console.log(`[Elong AI] Player opened the door while lingering! Jumpscare!`);
            triggerElongJumpscare(); 
        }
    }, lingerTime);
}

function resetElong() {
    elongAtDoor = false;
    elongRunId++;
    
    clearTimeout(elongGraceTimer);
    clearElongTimers();
    
    elongCurrentRoom = 'Storage';
    window.aiPositions.elong = elongCurrentRoom;
    
    if (typeof window.refreshCameraUI === "function") window.refreshCameraUI();
    
    clearTimeout(elongMoveTimeout);
    // NIGHT 3: Resumes roaming faster after being repelled
    elongMoveTimeout = setTimeout(loopElong, 3000); 
}

function playElongHorrorSound() {
    const sound = elongAudioCues[Math.floor(Math.random() * elongAudioCues.length)];
    sound.currentTime = 0;
    sound.play().catch((e) => console.warn("[Audio Blocked] Door horror sound:", e));
}

function triggerElongJumpscare() {
    if (window.isBlackout) return;
    elongActive = false;
    elongRunId++;
    clearTimeout(elongGraceTimer);
    clearElongTimers();
    const mon = document.getElementById('camera-monitor');
    if (mon) mon.style.display = 'none';

    elongOfficeSprite.style.display = 'block';
    elongOfficeSprite.style.left = '50%';
    elongOfficeSprite.style.transform = 'translateX(-50%) scale(1.5)';
    
    elongJumpscareSound.play().catch((e) => console.warn("[Audio Blocked] Jumpscare sound:", e));

    setTimeout(() => {
        elongOfficeSprite.style.transform = 'translateX(-50%) scale(8)';
        elongOfficeSprite.style.filter = 'brightness(2)';
    }, 50);

    setTimeout(() => {
        alert("ELONG TERMINATED YOUR CONTRACT.");
        location.reload();
    }, 1500);
}

// --- NIGHT 3 INITIAL GRACE PERIOD ---
setTimeout(() => {
    if (window.isBlackout) return;
    elongActive = true;
    console.log("[Elong AI] 35 SECONDS PASSED: Elong is now active.");
    
    loopElong(); 
}, 35000);
