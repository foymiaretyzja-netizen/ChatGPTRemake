// --- night2-sys/CharrlieAIN2.js ---

const charrlieCreakSound = new Audio('../Sounds/dragon-studio-heavy-creaking-515252 (1).mp3');
const charrlieRunSound = new Audio('../Sounds/freesound_community-foley_footsteps_metal_001-77032.mp3');

let charrlieState = 'waiting';
let charrlieTimer = null;
let charrlieTargetDoor = null;
let charrlieRunId = 0;

window.charrlieStage = 1;
window.aiPositions = window.aiPositions || {};
window.aiPositions.charrlie = 'Guest Room';

function clearCharrlieTimer() {
    if (charrlieTimer) {
        clearTimeout(charrlieTimer);
        charrlieTimer = null;
    }
}

function scheduleNextCharrlieMove(delay) {
    if (window.isBlackout) return;

    clearCharrlieTimer();
    const wait = typeof delay === 'number'
        ? delay
        : Math.floor(Math.random() * 10000) + 10000;

    const runId = charrlieRunId;
    charrlieTimer = setTimeout(() => {
        if (runId !== charrlieRunId || window.isBlackout) return;
        advanceCharrlieStage();
    }, wait);
}

function initCharrlie() {
    console.log('[Charrlie AI] Initialized. Waiting 45 seconds...');
    clearCharrlieTimer();

    const runId = charrlieRunId;
    charrlieTimer = setTimeout(() => {
        if (runId !== charrlieRunId || window.isBlackout) return;
        charrlieState = 'progressing';
        scheduleNextCharrlieMove();
    }, 45000);
}

function refreshCharrlieCamera() {
    if (typeof window.refreshCameraUI === 'function') {
        window.refreshCameraUI();
    }
}

function advanceCharrlieStage() {
    if (window.isBlackout || charrlieState === 'dashing' || charrlieState === 'bounced') return;

    window.charrlieStage = Math.min(4, window.charrlieStage + 1);
    console.log(`[Charrlie AI] Advanced to Stage ${window.charrlieStage}`);
    refreshCharrlieCamera();

    if (window.charrlieStage === 3) {
        charrlieCreakSound.currentTime = 0;
        charrlieCreakSound.play().catch(e =>
            console.warn('[Audio] Charrlie creak blocked:', e)
        );
        scheduleNextCharrlieMove();
    } else if (window.charrlieStage >= 4) {
        startCharrlieDash();
    } else {
        scheduleNextCharrlieMove();
    }
}

function startCharrlieDash() {
    if (window.isBlackout) return;

    charrlieState = 'dashing';
    charrlieTargetDoor = Math.random() < 0.5 ? 'left' : 'right';

    setCharrlieDoorPosition();
    console.log(`[Charrlie AI] DASHING to ${charrlieTargetDoor.toUpperCase()} door!`);

    charrlieRunSound.currentTime = 0;
    charrlieRunSound.play().catch(e =>
        console.warn('[Audio] Charrlie run blocked:', e)
    );

    window.applyCharrlieDashStatic(true);
    clearCharrlieTimer();

    const runId = charrlieRunId;
    charrlieTimer = setTimeout(() => {
        if (runId !== charrlieRunId || window.isBlackout) return;
        checkCharrlieAttack();
    }, 7000);
}

function setCharrlieDoorPosition() {
    window.aiPositions.charrlie =
        charrlieTargetDoor === 'left'
            ? 'Presidential Left Door'
            : 'Presidential Right Door';
    refreshCharrlieCamera();
}

function checkCharrlieAttack() {
    if (window.isBlackout || !charrlieTargetDoor) return;

    const isDoorBlocked =
        (charrlieTargetDoor === 'left' && window.leftDoorClosed) ||
        (charrlieTargetDoor === 'right' && window.rightDoorClosed);

    if (!isDoorBlocked) {
        triggerCharrlieJumpscare();
        return;
    }

    if (charrlieState === 'dashing') {
        charrlieState = 'bounced';
        charrlieTargetDoor =
            charrlieTargetDoor === 'left' ? 'right' : 'left';

        setCharrlieDoorPosition();

        charrlieRunSound.currentTime = 0;
        charrlieRunSound.play().catch(() => {});

        console.log(
            `[Charrlie AI] BLOCKED! Bouncing to the ${charrlieTargetDoor.toUpperCase()} door.`
        );

        const runId = charrlieRunId;
        charrlieTimer = setTimeout(() => {
            if (runId !== charrlieRunId || window.isBlackout) return;
            checkCharrlieAttack();
        }, 7000);
    } else if (charrlieState === 'bounced') {
        resetCharrlie();
    }
}

function resetCharrlie() {
    clearCharrlieTimer();
    charrlieRunId++;

    charrlieState = 'progressing';
    charrlieTargetDoor = null;
    window.charrlieStage = 1;
    window.aiPositions.charrlie = 'Guest Room';

    window.applyCharrlieDashStatic(false);
    refreshCharrlieCamera();

    console.log('[Charrlie AI] Both doors blocked. Returning to Guest Room.');
    scheduleNextCharrlieMove(9000);
}

function triggerCharrlieJumpscare() {
    if (window.isBlackout) return;

    charrlieRunId++;
    clearCharrlieTimer();
    charrlieState = 'jumpscare';
    applyDashStatic(false);

    if (window.isCameraOpen && typeof window.toggleCamera === 'function') {
        window.toggleCamera();
    }

    const jumpscareSprite = document.getElementById('charrlie-sprite-office');
    if (!jumpscareSprite) {
        setTimeout(() => location.reload(), 1500);
        return;
    }

    jumpscareSprite.style.display = 'block';
    jumpscareSprite.style.left = '50%';
    jumpscareSprite.style.bottom = '5%';
    jumpscareSprite.style.transition =
        'transform 0.12s cubic-bezier(.2,.8,.2,1), filter 0.12s ease';
    jumpscareSprite.style.transform = 'translateX(-50%) scale(1.15)';
    jumpscareSprite.style.filter = 'brightness(1.3)';

    requestAnimationFrame(() => {
        jumpscareSprite.style.transform = 'translateX(-50%) scale(2.8)';
        jumpscareSprite.style.filter = 'brightness(2)';
    });

    setTimeout(() => {
        jumpscareSprite.style.transform = 'translateX(-50%) scale(8)';
        jumpscareSprite.style.filter = 'brightness(2.5)';
    }, 120);

    setTimeout(() => location.reload(), 2000);
}

window.applyCharrlieDashStatic = function(isActive) {
    const staticFlash = document.getElementById('static-flash');
    if (!staticFlash) return;

    if (isActive) {
        staticFlash.style.opacity = '0.4';
        staticFlash.style.background =
            "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMCKcCBXY/C6MAAAAASUVORK5CYII=') repeat";
    } else {
        staticFlash.style.opacity = '0';
    }
}

initCharrlie();
