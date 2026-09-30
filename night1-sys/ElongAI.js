// --- night1-sys/ElongAI.js ---
// Night 1 tuning: slower, more predictable movement with a longer grace period.

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
let elongMoveInterval = null;

// Hardware lock for the Night 1 activation timer
let elongActive = false;

window.aiPositions.elong = elongCurrentRoom;

// Night 1 should feel slower and more learnable.
// Movement is weighted toward the intended route instead of constantly
// picking a completely random connected room.
function moveElong() {
    if (!elongActive || elongAtDoor || window.rightDoorClosed) return;

    const connections = elongMap[elongCurrentRoom];
    if (!connections || connections.length === 0) return;

    let nextRoom = elongCurrentRoom;

    // Mostly follow the normal route. Occasionally take another connected
    // room so the AI still has some unpredictability without feeling twitchy.
    const routeRoll = Math.random();

    if (routeRoll < 0.75) {
        if (elongCurrentRoom === 'Storage') {
            nextRoom = 'Conference Room';
        } else if (elongCurrentRoom === 'Conference Room') {
            nextRoom = 'Presidential Right Door';
        } else if (elongCurrentRoom === 'Kitchen') {
            nextRoom = 'Conference Room';
        } else if (elongCurrentRoom === 'Diner') {
            nextRoom = 'Kitchen';
        } else if (elongCurrentRoom === 'Janitor Room') {
            nextRoom = 'Diner';
        } else {
            nextRoom = connections[0];
        }
    } else {
        nextRoom = connections[Math.floor(Math.random() * connections.length)];
    }

    if (nextRoom === elongCurrentRoom) return;

    elongStaticSound.currentTime = 0;
    elongStaticSound.play().catch(() => {});

    if (window.isCameraOpen && typeof window.triggerLongFlicker === "function") {
        window.triggerLongFlicker();
    }

    // Give the visual static a moment to cover the transition.
    setTimeout(() => {
        elongCurrentRoom = nextRoom;
        window.aiPositions.elong = elongCurrentRoom;

        if (typeof window.refreshCameraUI === "function") {
            window.refreshCameraUI();
        }

        if (elongCurrentRoom === 'Presidential Right Door') {
            triggerElongAtDoor();
        }
    }, 200);
}

function triggerElongAtDoor() {
    if (elongAtDoor) return;

    elongAtDoor = true;
    playElongHorrorSound();

    // Night 1 gets a longer reaction window before Elong becomes aggressive.
    // Original: 10 seconds. Night 1: 15 seconds.
    elongGraceTimer = setTimeout(() => {
        if (!window.rightDoorClosed) {
            triggerElongJumpscare();
        } else {
            handleElongLinger();
        }
    }, 15000);

    // Less frequent audio pressure so the first night does not feel rushed.
    elongSoundLoop = setInterval(() => {
        if (Math.random() < 0.25) playElongHorrorSound();
    }, 12000);
}

function handleElongLinger() {
    // Give the player another small window after successfully closing the door.
    const lingerTime = Math.random() * 5000 + 7000;

    setTimeout(() => {
        if (window.rightDoorClosed) {
            resetElong();
        } else {
            triggerElongJumpscare();
        }
    }, lingerTime);
}

function resetElong() {
    elongAtDoor = false;
    clearTimeout(elongGraceTimer);
    clearInterval(elongSoundLoop);

    elongCurrentRoom = 'Storage';
    window.aiPositions.elong = elongCurrentRoom;
}

function playElongHorrorSound() {
    const sound = elongAudioCues[Math.floor(Math.random() * elongAudioCues.length)];
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function triggerElongJumpscare() {
    const mon = document.getElementById('camera-monitor');
    if (mon) mon.style.display = 'none';

    elongOfficeSprite.style.display = 'block';
    elongOfficeSprite.style.left = '50%';
    elongOfficeSprite.style.transform = 'translateX(-50%) scale(1.5)';

    elongJumpscareSound.play();

    setTimeout(() => {
        elongOfficeSprite.style.transform = 'translateX(-50%) scale(8)';
        elongOfficeSprite.style.filter = 'brightness(2)';
    }, 50);

    setTimeout(() => {
        alert("ELONG TERMINATED YOUR CONTRACT.");
        location.reload();
    }, 1500);
}

// --- NIGHT 1 INITIAL GRACE PERIOD ---
// Original activation: 60 seconds.
// Night 1 activation: 65 seconds, giving the player 5 extra seconds
// before Elong can begin moving at all.
setTimeout(() => {
    elongActive = true;
    console.log("65 SECONDS PASSED: Elong is now active.");

    // Wait one normal movement cycle instead of instantly appearing
    // somewhere else the moment the AI activates.
    setTimeout(() => {
        moveElong();

        // Original: every 20 seconds.
        // Night 1: every 30 seconds for a much slower pace.
        elongMoveInterval = setInterval(moveElong, 30000);
    }, 5000);

}, 65000);
