// --- night1-sys/tasks.js ---
// The Black House Task Computer
// Purposefully slow, dramatic, and unnecessarily over-engineered.

const btnDeport = document.getElementById('btn-deport');
const btnMissile = document.getElementById('btn-missile');
const btnCamera = document.getElementById('camera-btn');

// --- Audio System ---
const taskAudio = new Audio('../Sounds/alex_jauk-coffee-machine-noise-218424.mp3');

function startTaskAudio() {
    taskAudio.currentTime = 0;
    taskAudio.loop = true;
    taskAudio.play().catch(e => console.log("Audio block:", e));
}

function stopTaskAudio() {
    taskAudio.pause();
    taskAudio.currentTime = 0;
}

// --- Task Progress ---
let deportCount = 0;
const MAX_DEPORT = 10;

let missileCount = 0;
const MAX_MISSILES = 5;

// --- AI Data Relay & State ---
window.lastMissileTime = Date.now();
window.elongAngerMultiplier = 1.0;
window.isTaskActive = false;

let activeTaskTimer = null;
let activeTaskType = null;
let activeTaskAnimation = null;

// ============================================================
// TASK UI
// ============================================================

(function injectTaskUI() {
    const style = document.createElement('style');
    style.textContent = `
        .task-panel {
            position: absolute !important;
            overflow-x: hidden;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #555 #111;
            transform: translateY(150%);
        }

        /* Keep the task tabs anchored to the bottom instead of letting
           injected UI content change their position. */
        .task-panel.is-visible {
            transform: translateY(0) !important;
        }

        .task-panel.is-visible:hover {
            transform: translateY(0) !important;
        }

        .task-panel::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
                repeating-linear-gradient(
                    0deg,
                    rgba(255,255,255,.025) 0px,
                    rgba(255,255,255,.025) 1px,
                    transparent 1px,
                    transparent 4px
                );
            opacity: .55;
            animation: taskScan 5s linear infinite;
        }

        @keyframes taskScan {
            from { background-position: 0 0; }
            to { background-position: 0 40px; }
        }

        .task-computer-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }

        .task-computer-title h2 {
            margin: 0 !important;
            letter-spacing: .08em;
            text-shadow: 0 0 10px currentColor;
        }

        .task-badge {
            font: 700 9px/1 "DM Mono", monospace;
            padding: 5px 7px;
            border: 1px solid currentColor;
            opacity: .75;
            white-space: nowrap;
        }

        .task-status {
            min-height: 26px;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0 10px;
            padding: 6px 8px;
            background: rgba(0,0,0,.35);
            border: 1px solid rgba(255,255,255,.08);
            color: #888;
            font: 10px/1.2 "DM Mono", monospace;
            letter-spacing: .04em;
        }

        .task-status.live {
            color: #ffaa00;
            border-color: rgba(255,170,0,.35);
        }

        .task-status.done {
            color: #00ff77;
            border-color: rgba(0,255,119,.4);
        }

        .task-status .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 8px currentColor;
            flex: 0 0 auto;
        }

        .task-progress {
            height: 5px;
            margin-top: 7px;
            background: #111;
            border: 1px solid #333;
            overflow: hidden;
        }

        .task-progress-fill {
            height: 100%;
            width: 0%;
            background: currentColor;
            box-shadow: 0 0 10px currentColor;
            transition: width .08s steps(2, end);
        }

        .task-action {
            position: relative;
            overflow: hidden;
            min-height: 42px;
            text-align: left;
            transition:
                transform .12s ease,
                border-color .2s ease,
                color .2s ease,
                box-shadow .2s ease;
        }

        .task-action::after {
            content: "";
            position: absolute;
            top: 0;
            left: -80%;
            width: 45%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,.16),
                transparent
            );
            transform: skewX(-18deg);
            transition: left .45s ease;
            pointer-events: none;
        }

        .task-action:hover::after {
            left: 130%;
        }

        .task-action:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 0 14px rgba(255,255,255,.07);
        }

        .task-action:active:not(:disabled) {
            transform: translateY(1px) scale(.99);
        }

        .task-action.task-running {
            color: #ffaa00 !important;
            border-color: #ffaa00 !important;
            box-shadow: 0 0 16px rgba(255,170,0,.14);
            animation: taskButtonPulse .9s ease-in-out infinite;
        }

        @keyframes taskButtonPulse {
            0%, 100% { box-shadow: 0 0 8px rgba(255,170,0,.08); }
            50% { box-shadow: 0 0 18px rgba(255,170,0,.25); }
        }

        .task-action.task-complete {
            color: #00ff77 !important;
            border-color: #00ff77 !important;
            box-shadow: 0 0 18px rgba(0,255,119,.18);
            animation: taskCompletePop .35s ease-out;
        }

        @keyframes taskCompletePop {
            0% { transform: scale(.96); }
            65% { transform: scale(1.035); }
            100% { transform: scale(1); }
        }

        .task-button-inner {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            width: 100%;
        }

        .task-button-text {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .task-spinner {
            width: 13px;
            height: 13px;
            border: 2px solid rgba(255,170,0,.22);
            border-top-color: currentColor;
            border-right-color: currentColor;
            border-radius: 50%;
            display: none;
            flex: 0 0 auto;
            animation: taskSpin .72s linear infinite;
        }

        .task-running .task-spinner {
            display: block;
        }

        @keyframes taskSpin {
            to { transform: rotate(360deg); }
        }

        .task-mini-label {
            margin-top: 7px;
            color: #555;
            font: 8px/1.2 "DM Mono", monospace;
            letter-spacing: .06em;
            text-transform: uppercase;
        }

        #task-toast {
            position: fixed;
            left: 50%;
            bottom: 26px;
            transform: translate(-50%, 18px);
            z-index: 12000;
            pointer-events: none;
            opacity: 0;
            padding: 10px 15px;
            border: 1px solid rgba(255,170,0,.55);
            background: rgba(5,5,5,.92);
            color: #ffaa00;
            box-shadow: 0 0 24px rgba(255,170,0,.13);
            font: 11px/1.2 "DM Mono", monospace;
            letter-spacing: .04em;
            transition: opacity .18s ease, transform .18s ease;
            text-align: center;
        }

        #task-toast.visible {
            opacity: 1;
            transform: translate(-50%, 0);
        }

        #task-overlay {
            position: fixed;
            left: 50%;
            top: 14px;
            transform: translateX(-50%);
            z-index: 11000;
            width: min(460px, calc(100vw - 30px));
            padding: 8px 10px;
            box-sizing: border-box;
            pointer-events: none;
            opacity: 0;
            transition: opacity .2s ease;
            background: rgba(0,0,0,.78);
            border: 1px solid rgba(255,255,255,.12);
            box-shadow: 0 0 22px rgba(0,0,0,.45);
            font: 9px/1.2 "DM Mono", monospace;
            color: #888;
        }

        #task-overlay.visible {
            opacity: 1;
        }

        #task-overlay-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
        }

        #task-overlay-name {
            color: #ffaa00;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        #task-overlay-time {
            color: #fff;
            min-width: 42px;
            text-align: right;
        }

        #task-overlay-bar {
            height: 3px;
            margin-top: 6px;
            background: #171717;
            overflow: hidden;
        }

        #task-overlay-fill {
            width: 0%;
            height: 100%;
            background: #ffaa00;
            box-shadow: 0 0 10px #ffaa00;
            transition: width .08s steps(2, end);
        }

        body.task-screen-shake {
            animation: wholeScreenShake .11s steps(2, end) infinite;
        }

        @keyframes wholeScreenShake {
            0%   { transform: translate(0, 0) rotate(0deg); }
            20%  { transform: translate(-4px, 2px) rotate(-.12deg); }
            40%  { transform: translate(4px, -2px) rotate(.12deg); }
            60%  { transform: translate(-3px, -1px) rotate(.08deg); }
            80%  { transform: translate(3px, 2px) rotate(-.08deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
        }

        #missile-event {
            position: fixed;
            inset: 0;
            z-index: 11999;
            pointer-events: none;
            opacity: 0;
            background:
                radial-gradient(circle at center, transparent 0 28%, rgba(255,120,0,.08) 48%, rgba(0,0,0,.65) 100%);
            transition: opacity .35s ease;
        }

        #missile-event.visible {
            opacity: 1;
        }

        #missile-event-text {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(.94);
            color: #ffb000;
            text-shadow: 0 0 16px #ff5500;
            font: 700 clamp(22px, 5vw, 54px)/1 "DM Mono", monospace;
            letter-spacing: .08em;
            opacity: 0;
            transition: opacity .25s ease, transform .25s ease;
        }

        #missile-event.visible #missile-event-text {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        @media (prefers-reduced-motion: reduce) {
            .task-panel::before,
            .task-action.task-running,
            .task-spinner,
            body.task-screen-shake {
                animation: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    const toast = document.createElement('div');
    toast.id = 'task-toast';
    document.body.appendChild(toast);

    const overlay = document.createElement('div');
    overlay.id = 'task-overlay';
    overlay.innerHTML = `
        <div id="task-overlay-row">
            <span id="task-overlay-name">TASK COMPUTER IDLE</span>
            <span id="task-overlay-time">--</span>
        </div>
        <div id="task-overlay-bar"><div id="task-overlay-fill"></div></div>
    `;
    document.body.appendChild(overlay);

    const missileEvent = document.createElement('div');
    missileEvent.id = 'missile-event';
    missileEvent.innerHTML = '<div id="missile-event-text">MISSILE AWAY</div>';
    document.body.appendChild(missileEvent);

    enhanceButton(btnDeport, 'DEP-9000');
    enhanceButton(btnMissile, 'IRUN-LAUNCH');

    createStatusBox(btnDeport, 'deport');
    createStatusBox(btnMissile, 'missile');

    // A tiny bit of unnecessary government-computer labeling.
    const labels = document.querySelectorAll('.task-panel .tab-label');
    labels.forEach(label => {
        label.style.position = 'relative';
        label.style.zIndex = '3';
    });
})();

function enhanceButton(button, id) {
    if (!button) return;

    const original = button.innerText;
    button.classList.add('task-action');
    button.dataset.defaultText = original;
    button.dataset.systemId = id;

    button.innerHTML = `
        <span class="task-button-inner">
            <span class="task-button-text">${original}</span>
            <span class="task-spinner"></span>
        </span>
    `;
}

function createStatusBox(button, type) {
    if (!button || !button.parentElement) return;

    const box = document.createElement('div');
    box.className = 'task-status';
    box.id = `task-status-${type}`;
    box.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-message">${type === 'deport' ? 'READY // PAPERWORK QUEUE EMPTY' : 'READY // SILOS STANDING BY'}</span>
    `;

    const progress = document.createElement('div');
    progress.className = 'task-progress';
    progress.id = `task-progress-${type}`;
    progress.innerHTML = '<div class="task-progress-fill"></div>';

    const mini = document.createElement('div');
    mini.className = 'task-mini-label';
    mini.id = `task-mini-${type}`;
    mini.textContent = type === 'deport'
        ? 'PROCESSING SPEED: LEGALLY QUESTIONABLE'
        : 'LAUNCH SYSTEM: PLEASE WAIT FOR NO REASON';

    button.parentElement.insertBefore(box, button);
    button.parentElement.insertBefore(progress, button);
    button.parentElement.insertBefore(mini, button);
}

// ============================================================
// HELPERS
// ============================================================

function getButtonText(button) {
    return button?.querySelector('.task-button-text');
}

function setButtonText(button, text) {
    const target = getButtonText(button);
    if (target) target.textContent = text;
    else if (button) button.innerText = text;
}

function setTaskProgress(type, percent) {
    const fill = document.querySelector(`#task-progress-${type} .task-progress-fill`);
    const overlayFill = document.getElementById('task-overlay-fill');

    if (fill) fill.style.width = Math.max(0, Math.min(100, percent)) + '%';
    if (overlayFill) overlayFill.style.width = Math.max(0, Math.min(100, percent)) + '%';
}

function setTaskStatus(type, message, state = '') {
    const box = document.getElementById(`task-status-${type}`);
    if (!box) return;

    box.classList.remove('live', 'done');
    if (state) box.classList.add(state);

    const messageEl = box.querySelector('.status-message');
    if (messageEl) messageEl.textContent = message;
}

function showTaskToast(message, duration = 1300) {
    const toast = document.getElementById('task-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');

    clearTimeout(showTaskToast.timer);
    showTaskToast.timer = setTimeout(() => {
        toast.classList.remove('visible');
    }, duration);
}

function setTaskOverlay(visible, name = '', seconds = 0) {
    const overlay = document.getElementById('task-overlay');
    const nameEl = document.getElementById('task-overlay-name');
    const timeEl = document.getElementById('task-overlay-time');

    if (!overlay) return;

    if (nameEl) nameEl.textContent = name || 'TASK COMPUTER';
    if (timeEl) timeEl.textContent = seconds > 0 ? seconds.toFixed(1) + 's' : '--';

    overlay.classList.toggle('visible', visible);
}

function randomStutterDelay() {
    const roll = Math.random();

    // Deliberate fake lag.
    if (roll < 0.16) return 420 + Math.random() * 520;
    if (roll < 0.32) return 220 + Math.random() * 280;
    return 55 + Math.random() * 105;
}

function setTaskButtonsDisabled(disabled) {
    btnDeport.disabled = disabled || deportCount >= MAX_DEPORT;
    btnMissile.disabled = disabled || missileCount >= MAX_MISSILES;
}

function resetButton(button, type) {
    if (!button) return;

    button.classList.remove('task-running');
    button.classList.remove('task-complete');
    button.style.color = '#ccc';

    if (type === 'deport') {
        setButtonText(button, `Deport liberals (${deportCount}/${MAX_DEPORT})`);
    } else {
        setButtonText(button, `Send missiles to Irun (${missileCount}/${MAX_MISSILES})`);
    }
}

function cleanupTaskAnimation() {
    if (activeTaskAnimation) {
        clearTimeout(activeTaskAnimation);
        activeTaskAnimation = null;
    }
}

// ============================================================
// CANCELLATION
// ============================================================

window.cancelCurrentTask = function() {
    if (!window.isTaskActive) return;

    if (activeTaskTimer) {
        clearTimeout(activeTaskTimer);
        activeTaskTimer = null;
    }

    cleanupTaskAnimation();
    stopTaskAudio();

    if (activeTaskType === 'deport') {
        resetButton(btnDeport, 'deport');
        setTaskProgress('deport', 0);
        setTaskStatus('deport', 'CANCELED // PAPERWORK HAS ESCAPED', '');
    } else if (activeTaskType === 'missile') {
        resetButton(btnMissile, 'missile');
        setTaskProgress('missile', 0);
        setTaskStatus('missile', 'CANCELED // SILO OPERATOR GOT DISTRACTED', '');
    }

    setTaskOverlay(false);
    setTaskButtonsDisabled(false);

    window.isTaskActive = false;
    activeTaskType = null;

    showTaskToast('TASK ABORTED. COMPUTER PRETENDS NOTHING HAPPENED.', 1500);
};

if (btnCamera) {
    btnCamera.addEventListener('click', () => {
        window.cancelCurrentTask();
    });
}

// ============================================================
// FAKE-SLOW TASK ENGINE
// ============================================================

function runSlowTask(type, durationMs, onFinish) {
    const button = type === 'deport' ? btnDeport : btnMissile;
    const systemName = type === 'deport' ? 'DEP-9000 // PROCESSING' : 'IRUN-LAUNCH // ARMING';

    if (!button) return;

    window.isTaskActive = true;
    activeTaskType = type;

    setTaskButtonsDisabled(true);
    button.classList.add('task-running');
    button.style.color = '#ffaa00';

    setTaskStatus(
        type,
        type === 'deport'
            ? 'PROCESSING // PLEASE WATCH THE BAR MOVE'
            : 'ARMING // CHECKING THE SAME THING 47 TIMES',
        'live'
    );

    setTaskOverlay(true, systemName, durationMs / 1000);
    setTaskProgress(type, 0);

    startTaskAudio();

    const started = performance.now();
    let displayedProgress = 0;
    let nextUpdate = 0;

    function tick(now) {
        if (!window.isTaskActive || activeTaskType !== type) return;

        const elapsed = now - started;
        const realProgress = Math.min(1, elapsed / durationMs);

        // The bar intentionally lags behind reality and occasionally freezes.
        if (now >= nextUpdate) {
            const target = realProgress * 100;

            if (Math.random() < 0.20) {
                // Fake computer stall.
                displayedProgress = Math.max(displayedProgress, target - (Math.random() * 7 + 2));
            } else {
                const catchup = Math.random() * 9 + 2;
                displayedProgress = Math.min(target, displayedProgress + catchup);
            }

            // Never visually finish until the actual timer finishes.
            if (realProgress < 1) {
                displayedProgress = Math.min(displayedProgress, 96 + Math.random() * 2);
            }

            setTaskProgress(type, displayedProgress);

            const secondsLeft = Math.max(0, (durationMs - elapsed) / 1000);
            setTaskOverlay(true, systemName, secondsLeft);

            const percent = Math.floor(displayedProgress);
            setButtonText(
                button,
                type === 'deport'
                    ? `PROCESSING... ${percent}%`
                    : `ARMING... ${percent}%`
            );

            nextUpdate = now + randomStutterDelay();
        }

        if (elapsed >= durationMs) {
            setTaskProgress(type, 100);
            setTaskOverlay(true, systemName, 0);
            activeTaskTimer = setTimeout(() => onFinish(), 180);
            return;
        }

        activeTaskTimer = requestAnimationFrame(tick);
    }

    activeTaskTimer = requestAnimationFrame(tick);
}

// ============================================================
// TASK 1: DEPORTATION
// 10 total, 5 seconds each
// ============================================================

btnDeport.addEventListener('click', () => {
    if (typeof isBlackout !== 'undefined' && isBlackout) return;
    if (window.isTaskActive || deportCount >= MAX_DEPORT) return;

    showTaskToast('DEP-9000 ONLINE. PREPARING AN ABSURD AMOUNT OF PAPERWORK.', 1500);

    runSlowTask('deport', 5000, finishDeportation);
});

function finishDeportation() {
    stopTaskAudio();
    if (activeTaskTimer) {
        clearTimeout(activeTaskTimer);
        activeTaskTimer = null;
    }

    deportCount++;
    window.isTaskActive = false;
    activeTaskType = null;

    btnDeport.classList.remove('task-running');
    btnDeport.classList.add('task-complete');

    setTaskProgress('deport', 100);

    if (deportCount >= MAX_DEPORT) {
        btnDeport.style.color = '#00ff77';
        btnDeport.style.borderColor = '#00ff77';
        setButtonText(btnDeport, 'DEPORTATION QUEUE EMPTY');
        btnDeport.disabled = true;
        setTaskStatus('deport', 'COMPLETE // ABSOLUTELY NO MORE PAPERWORK', 'done');
    } else {
        setButtonText(btnDeport, `Deport liberals (${deportCount}/${MAX_DEPORT})`);
        setTaskStatus('deport', `COMPLETE // QUEUE: ${deportCount}/${MAX_DEPORT}`, 'done');
    }

    setTaskOverlay(false);
    setTaskButtonsDisabled(false);

    showTaskToast(
        deportCount >= MAX_DEPORT
            ? 'DEP-9000 HAS FINISHED ITS ENTIRELY SERIOUS MISSION.'
            : `PROCESS COMPLETE. ONLY ${MAX_DEPORT - deportCount} MORE FORMS TO GO.`,
        1500
    );

    setTimeout(() => btnDeport.classList.remove('task-complete'), 500);

    checkWinCondition();
}

// ============================================================
// TASK 2: MISSILES
// 5 total, 2 seconds each
// ============================================================

btnMissile.addEventListener('click', () => {
    if (typeof isBlackout !== 'undefined' && isBlackout) return;
    if (window.isTaskActive || missileCount >= MAX_MISSILES) return;

    window.lastMissileTime = Date.now();
    window.elongAngerMultiplier = 1.0;

    showTaskToast('LAUNCH COMPUTER IS BOOTING UP THE SAME BUTTON AGAIN.', 1200);

    runSlowTask('missile', 2000, finishMissile);
});

function finishMissile() {
    stopTaskAudio();
    if (activeTaskTimer) {
        clearTimeout(activeTaskTimer);
        activeTaskTimer = null;
    }

    missileCount++;

    window.isTaskActive = false;
    activeTaskType = null;

    btnMissile.classList.remove('task-running');
    btnMissile.classList.add('task-complete');

    setTaskProgress('missile', 100);

    if (missileCount >= MAX_MISSILES) {
        btnMissile.style.color = '#00ff77';
        btnMissile.style.borderColor = '#00ff77';
        setButtonText(btnMissile, 'MISSILE INVENTORY: EMPTY');
        btnMissile.disabled = true;
        setTaskStatus('missile', 'COMPLETE // SILOS ARE NOW VERY QUIET', 'done');
    } else {
        setButtonText(btnMissile, `Send missiles to Irun (${missileCount}/${MAX_MISSILES})`);
        setTaskStatus('missile', `LAUNCH CONFIRMED // COUNT: ${missileCount}/${MAX_MISSILES}`, 'done');
    }

    setTaskOverlay(false);
    setTaskButtonsDisabled(false);

    // The entire game gets a gloriously unnecessary 3-second shake.
    playMissileImpact();

    setTimeout(() => btnMissile.classList.remove('task-complete'), 500);
}

// ============================================================
// MISSILE EVENT: 3 SECOND SHAKE + FADE
// ============================================================

function playMissileImpact() {
    const event = document.getElementById('missile-event');

    document.body.classList.add('task-screen-shake');
    if (event) event.classList.add('visible');

    showTaskToast('MISSILE AWAY. PLEASE HOLD ONTO YOUR DESK.', 1800);

    // Shake for exactly 3 seconds.
    setTimeout(() => {
        document.body.classList.remove('task-screen-shake');

        // Fade the event away instead of snapping it off.
        if (event) {
            event.style.opacity = '0';

            setTimeout(() => {
                event.classList.remove('visible');
                event.style.opacity = '';
            }, 450);
        }

        // Only check the win after the launch sequence has calmed down.
        checkWinCondition();
    }, 3000);
}

// ============================================================
// ELONG ANGER MONITOR
// ============================================================

setInterval(() => {
    if (typeof isBlackout !== 'undefined' && isBlackout) return;
    if (missileCount >= MAX_MISSILES) return;

    const secondsSinceLastMissile =
        Math.floor((Date.now() - window.lastMissileTime) / 1000);

    if (secondsSinceLastMissile > 20) {
        window.elongAngerMultiplier += 0.2;
    }
}, 5000);

// ============================================================
// WIN CONDITION
// ============================================================

function checkWinCondition() {
    if (
        deportCount >= MAX_DEPORT &&
        missileCount >= MAX_MISSILES &&
        !window.winSequenceStarted
    ) {
        window.winSequenceStarted = true;

        // Give the final missile's 3-second cinematic effect time to finish.
        setTimeout(triggerWin, 3200);
    }
}

// ============================================================
// CONFETTI
// ============================================================

function launchConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];

    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');

        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-20px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 20 + 10 + 'px';
        confetti.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];
        confetti.style.zIndex = '10001';
        confetti.style.opacity = Math.random() + 0.5;
        confetti.style.pointerEvents = 'none';

        document.body.appendChild(confetti);

        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 1.5;

        confetti.animate(
            [
                {
                    transform: 'translate3d(0, 0, 0) rotate(0deg)',
                    opacity: 1
                },
                {
                    transform:
                        `translate3d(${Math.random() * 200 - 100}px, 100vh, 0) rotate(${Math.random() * 720}deg)`,
                    opacity: 0
                }
            ],
            {
                duration: duration * 1000,
                delay: delay * 1000,
                easing: 'cubic-bezier(.37, 0, .63, 1)',
                fill: 'forwards'
            }
        );

        setTimeout(
            () => confetti.remove(),
            (duration + delay) * 1000 + 100
        );
    }
}

// ============================================================
// END OF NIGHT
// ============================================================

function triggerWin() {
    if (window.finalFadeStarted) return;
    window.finalFadeStarted = true;

    const fadeOutDiv = document.createElement('div');

    fadeOutDiv.style.position = 'fixed';
    fadeOutDiv.style.top = '0';
    fadeOutDiv.style.left = '0';
    fadeOutDiv.style.width = '100vw';
    fadeOutDiv.style.height = '100vh';
    fadeOutDiv.style.backgroundColor = '#000';
    fadeOutDiv.style.opacity = '0';
    fadeOutDiv.style.zIndex = '9999';
    fadeOutDiv.style.transition = 'opacity 3s ease-in-out';
    fadeOutDiv.style.pointerEvents = 'all';

    document.body.appendChild(fadeOutDiv);

    const winText = document.createElement('div');

    winText.innerText = '6:00 AM';
    winText.style.position = 'fixed';
    winText.style.top = '50%';
    winText.style.left = '50%';
    winText.style.transform = 'translate(-50%, -50%)';
    winText.style.color = '#fff';
    winText.style.fontFamily = "'Courier New', Courier, monospace";
    winText.style.fontSize = '4rem';
    winText.style.fontWeight = 'bold';
    winText.style.zIndex = '10000';
    winText.style.opacity = '0';
    winText.style.transition = 'opacity 3s ease-in-out 1.5s';

    document.body.appendChild(winText);

    const clockChime =
        new Audio('../Sounds/li-bing-tower-clock-chimewestminster-187254.mp3');
    const confettiCheer =
        new Audio('../Sounds/u_jspnqv1glx-1gift-confetti-447240.mp3');

    if (typeof window.completeNight === 'function') {
        window.completeNight(1);
    } else {
        console.warn(
            'Save system not found. Make sure saveSystem.js is linked in your HTML.'
        );
    }

    setTimeout(() => {
        fadeOutDiv.style.opacity = '1';
        clockChime.play().catch(e => console.log('Audio block:', e));
    }, 100);

    setTimeout(() => {
        winText.style.opacity = '1';
        confettiCheer.play().catch(e => console.log('Audio block:', e));
        launchConfetti();

        setTimeout(() => {
            window.location.href = '../title.html';
        }, 15000);
    }, 2000);
}
