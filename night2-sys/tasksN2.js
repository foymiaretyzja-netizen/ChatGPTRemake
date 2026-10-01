// --- night2-sys/tasksN2.js ---
// Night 2 task computer. Same visual language as Night 1, but with Night 2's
// vaccine, PS7 procurement, and emergency-loan mechanics.

const btnCure = document.getElementById('btn-deport');
const btnPs7 = document.getElementById('btn-missile');
const btnLoan = document.getElementById('btn-loan');
const btnCamera = document.getElementById('camera-btn');

const cureProgress = document.getElementById('cure-progress');
const ps7Progress = document.getElementById('ps7-progress');
const cureCountLabel = document.getElementById('cure-count');
const ps7CountLabel = document.getElementById('ps7-count');
const cureStatus = document.getElementById('cure-status');
const ps7Status = document.getElementById('ps7-status');
const ps7Time = document.getElementById('ps7-time');
const loanCard = document.getElementById('loan-card');
const ps7Card = document.getElementById('ps7-card');
const loanStatus = document.getElementById('loan-status');
const loanSignature = document.getElementById('loan-signature');
const taskMessage = document.getElementById('n2-task-message');

const taskAudio = new Audio('../Sounds/alex_jauk-coffee-machine-noise-218424.mp3');

function startTaskAudio() {
    taskAudio.currentTime = 0;
    taskAudio.loop = true;
    taskAudio.play().catch(e => console.log("[Tasks] Audio block:", e));
}

function stopTaskAudio() {
    taskAudio.pause();
    taskAudio.currentTime = 0;
}

// ============================================================
// TASK STATE
// ============================================================

let cureCount = 0;
const MAX_CURE = 15;

let ps7Count = 0;
const MAX_PS7 = 1;

let loanRequired = false;
let loanSigned = false;
let ps7FundingInterrupted = false;

window.isTaskActive = false;
let activeTaskTimer = null;
let activeTaskType = null;
let nightCompleted = false;

// ============================================================
// TASK PANEL UI
// ============================================================

(function injectNight2TaskUI() {
    const style = document.createElement('style');
    style.textContent = `
        .n2-task-panel {
            width: 390px !important;
            height: 390px !important;
            max-height: min(390px, 72vh) !important;
            padding: 15px !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-gutter: stable;
            background:
                linear-gradient(180deg, rgba(12,15,14,.98), rgba(6,8,8,.98)),
                #080a09 !important;
            border: 1px solid #4a544e !important;
            border-bottom: none !important;
            border-radius: 14px 14px 0 0 !important;
            box-shadow: 0 -12px 34px rgba(0,0,0,.38), inset 0 1px rgba(255,255,255,.035);
            color: #dce5df;
        }


        .n2-task-panel.is-visible {
            transform: translateY(0) !important;
        }

        .n2-task-panel.is-visible:hover {
            transform: translateY(0) !important;
        }

        .n2-task-panel {
            touch-action: pan-y;
            overscroll-behavior-y: contain;
        }

        .n2-task-panel::-webkit-scrollbar { width: 8px; }
        .n2-task-panel::-webkit-scrollbar-track { background: #090b0a; }
        .n2-task-panel::-webkit-scrollbar-thumb { background: #3a443f; }

        .n2-task-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
        }

        .n2-task-panel .tab-label {
            margin: 0 0 4px !important;
            text-align: left !important;
            color: #c9d3cd !important;
            font-size: 10px !important;
            letter-spacing: .16em !important;
        }

        .n2-task-subtitle,
        .n2-card-code,
        .n2-task-footer,
        .n2-progress-meta,
        .n2-task-statusline {
            font-family: "DM Mono", "Courier New", monospace;
        }

        .n2-task-subtitle {
            color: #68736d;
            font-size: 8px;
            letter-spacing: .08em;
        }

        .n2-task-status {
            color: #7dffbe;
            border: 1px solid rgba(125,255,190,.38);
            padding: 4px 7px;
            font: 700 8px "DM Mono", monospace;
            letter-spacing: .08em;
            background: rgba(125,255,190,.04);
        }

        .n2-task-divider {
            height: 1px;
            margin: 10px 0;
            background: linear-gradient(90deg, transparent, #38413c 12%, #38413c 88%, transparent);
        }

        .n2-task-card {
            position: relative;
            margin-bottom: 9px;
            padding: 10px;
            border: 1px solid #29312d;
            background: rgba(0,0,0,.25);
            box-shadow: inset 0 1px rgba(255,255,255,.018);
        }

        .n2-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
        }

        .n2-card-code {
            color: #65726b;
            font-size: 8px;
            letter-spacing: .12em;
        }

        .n2-task-card h2 {
            margin: 2px 0 0;
            color: #dfe8e2;
            font: 700 14px/1.1 "Courier New", monospace;
            letter-spacing: .03em;
        }

        .n2-count {
            color: #8d9992;
            font: 700 10px "DM Mono", monospace;
            white-space: nowrap;
        }

        .n2-card-body {
            display: flex;
            gap: 10px;
        }

        .n2-card-info {
            min-width: 0;
            flex: 1;
        }

        .n2-card-info.full { width: 100%; }

        .n2-card-description {
            color: #737e78;
            font: 8px/1.45 "DM Mono", monospace;
            letter-spacing: .025em;
            margin-bottom: 7px;
        }

        .n2-task-statusline {
            min-height: 13px;
            color: #68736d;
            font-size: 8px;
            letter-spacing: .05em;
            margin-bottom: 7px;
        }

        .n2-action {
            position: relative;
            overflow: hidden;
            min-height: 32px !important;
            padding: 8px !important;
            color: #b8c2bc !important;
            border-color: #3c4741 !important;
            background: linear-gradient(180deg, #171d1a, #0d1110) !important;
            font-size: 9px !important;
            letter-spacing: .07em;
        }

        .n2-action:hover:not(:disabled) {
            color: #eef6f1 !important;
            border-color: #748078 !important;
            background: #18201c !important;
        }

        .n2-action:disabled {
            opacity: .48;
            cursor: wait;
        }

        .cure-layout { align-items: stretch; }

        .vaccine-meter {
            position: relative;
            flex: 0 0 38px;
            height: 112px;
            overflow: hidden;
            border: 1px solid #263d50;
            background: #071019;
        }

        .vaccine-meter-fill {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 0%;
            background: linear-gradient(180deg, #43bfff, #0879c9);
            box-shadow: 0 0 16px rgba(45,165,240,.28);
            transition: height .12s linear;
        }

        .vaccine-meter-lines {
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(
                0deg,
                transparent 0 10px,
                rgba(190,225,245,.09) 10px 11px
            );
            pointer-events: none;
        }

        .vaccine-meter span {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%,-50%) rotate(-90deg);
            color: rgba(220,240,255,.72);
            font: 700 8px "DM Mono", monospace;
            letter-spacing: .12em;
            pointer-events: none;
        }

        .n2-progress-track {
            position: relative;
            height: 14px;
            overflow: hidden;
            border: 1px solid #242b27;
            background: #080b09;
            margin: 7px 0 5px;
        }

        .n2-progress-fill {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #56635b, #9aa8a0);
            box-shadow: 0 0 12px rgba(150,170,160,.14);
            transition: width .08s linear;
        }

        .n2-progress-fill.warning {
            background: linear-gradient(90deg, #775b22, #d69d35);
            box-shadow: 0 0 13px rgba(214,157,53,.22);
        }

        .n2-progress-meta {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            color: #68736d;
            font-size: 8px;
            margin-bottom: 7px;
        }

        .n2-insufficient {
            color: #ffbd55;
            font: 700 10px "DM Mono", monospace;
            letter-spacing: .12em;
            margin-bottom: 6px;
            animation: n2WarningBlink .8s steps(2,end) infinite;
        }

        /* Completed loan paperwork must never look like an unfinished alert. */
        .loan-card.is-complete,
        .loan-card.is-complete .n2-insufficient,
        .loan-card.is-complete .n2-loan-warning {
            animation: none !important;
        }

        .loan-card[hidden] {
            display: none !important;
        }

        .n2-loan-warning {
            color: #ffbd55;
            font: 700 8px "DM Mono", monospace;
            border: 1px solid rgba(255,189,85,.35);
            padding: 4px 6px;
        }

        @keyframes n2WarningBlink {
            50% { opacity: .45; }
        }

        .loan-card {
            border-color: #55452c;
            background: rgba(34,25,12,.25);
        }

        .loan-paper {
            position: relative;
            flex: 0 0 auto;
            user-select: none;
            height: 46px;
            margin: 7px 0;
            overflow: hidden;
            border: 1px solid #57524a;
            background: linear-gradient(135deg, #d8d2c5, #a9a396);
            color: #25231f;
            cursor: pointer;
        }

        .loan-paper-lines {
            position: absolute;
            inset: 8px 10px;
            background: repeating-linear-gradient(
                0deg,
                transparent 0 9px,
                rgba(50,45,38,.2) 9px 10px
            );
        }

        .loan-signature {
            position: absolute;
            right: 12px;
            bottom: 7px;
            color: #1b4f76;
            font: italic 15px "Comic Sans MS", cursive;
            opacity: .75;
            transform: rotate(-4deg);
        }

        .loan-paper.signed {
            border-color: #79b8e2;
            box-shadow: 0 0 14px rgba(70,170,230,.15);
        }

        .loan-paper.signed .loan-signature {
            color: #155b91;
            opacity: 1;
        }

        .n2-task-footer {
            display: flex;
            flex: 0 0 auto;
            justify-content: space-between;
            gap: 8px;
            color: #505a54;
            font-size: 7px;
            letter-spacing: .08em;
        }

        @media (max-width: 720px) {
            .n2-task-panel {
                width: min(390px, 94vw) !important;
                left: 3vw !important;
                right: auto !important;
            }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================================
// HELPERS
// ============================================================

function setDisabledState() {
    if (btnCure) btnCure.disabled = window.isBlackout || window.isTaskActive || cureCount >= MAX_CURE;
    if (btnPs7) btnPs7.disabled = window.isBlackout || window.isTaskActive || ps7Count >= MAX_PS7 || loanRequired;
    if (btnLoan) btnLoan.disabled = window.isBlackout || window.isTaskActive || loanSigned;
}

function updateCounts() {
    if (cureCountLabel) cureCountLabel.textContent = `${cureCount} / ${MAX_CURE}`;
    if (ps7CountLabel) ps7CountLabel.textContent = `${ps7Count} / ${MAX_PS7}`;
}

function setTaskMessage(message) {
    if (taskMessage) taskMessage.textContent = message;
}

function setCureProgress(percent) {
    if (cureProgress) cureProgress.style.height = Math.max(0, Math.min(100, percent)) + '%';
}

function setPs7Progress(percent) {
    if (ps7Progress) ps7Progress.style.width = Math.max(0, Math.min(100, percent)) + '%';
}

function resetTaskProgress() {
    setCureProgress(0);
    setPs7Progress(0);
    if (ps7Progress) ps7Progress.classList.remove('warning');
    if (ps7Time) ps7Time.textContent = '15.0s';
}

function clearActiveTimer() {
    if (activeTaskTimer) {
        clearInterval(activeTaskTimer);
        cancelAnimationFrame(activeTaskTimer);
        activeTaskTimer = null;
    }
}

function finishActiveState() {
    clearActiveTimer();
    stopTaskAudio();
    window.isTaskActive = false;
    activeTaskType = null;
    setDisabledState();
}

function showLoanTask() {
    loanRequired = true;
    ps7FundingInterrupted = true;

    if (ps7Card) ps7Card.hidden = true;

    if (loanCard) {
        loanCard.hidden = false;
        loanCard.style.removeProperty('display');
        loanCard.classList.remove('is-complete');
    }

    setTaskMessage('FUNDING INTERRUPTED // LOAN REQUIRED');
    if (loanStatus) loanStatus.textContent = 'ACTION REQUIRED // SIGN AUTHORIZATION';
    resetTaskProgress();
}

function hideLoanTask() {
    loanRequired = false;

    // Fully remove the completed loan card from the active task UI.
    // This prevents the warning blink from making it look actionable again.
    if (loanCard) {
        loanCard.classList.add('is-complete');
        loanCard.hidden = true;
        loanCard.style.display = 'none';
    }

    if (ps7Card) ps7Card.hidden = false;
    setTaskMessage('LOAN APPROVED // PS7 PURCHASE RESTORED');
}

function cancelTaskUI() {
    clearActiveTimer();
    stopTaskAudio();

    if (activeTaskType === 'cure') {
        setCureProgress(0);
        if (cureStatus) cureStatus.textContent = 'CANCELED // FUNDING CYCLE RESET';
    } else if (activeTaskType === 'ps7') {
        setPs7Progress(0);
        if (ps7Status) ps7Status.textContent = 'CANCELED // PURCHASE RESET';
        if (ps7Time) ps7Time.textContent = '15.0s';
    } else if (activeTaskType === 'loan') {
        if (loanStatus) loanStatus.textContent = 'CANCELED // SIGNATURE REQUIRED';
    }

    window.isTaskActive = false;
    activeTaskType = null;
    setTaskMessage('TASK CANCELED');
    setDisabledState();
}

window.cancelCurrentTask = function() {
    if (!window.isTaskActive) return;
    cancelTaskUI();
};

// The paper itself is clickable, not just the button below it.
const loanPaper = document.querySelector('.loan-paper');
if (loanPaper) {
    loanPaper.setAttribute('role', 'button');
    loanPaper.setAttribute('tabindex', '0');
    loanPaper.addEventListener('click', () => {
        if (btnLoan && !btnLoan.disabled) btnLoan.click();
    });
    loanPaper.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && btnLoan && !btnLoan.disabled) {
            event.preventDefault();
            btnLoan.click();
        }
    });
}

// Camera opening cancels active task, matching Night 1's behavior.
if (btnCamera) {
    btnCamera.addEventListener('click', () => window.cancelCurrentTask());
}

// ============================================================
// CURE TASK: 3 SECONDS EACH
// ============================================================

if (btnCure) {
    btnCure.addEventListener('click', () => {
        if (window.isBlackout || window.isTaskActive || cureCount >= MAX_CURE) return;

        window.isTaskActive = true;
        activeTaskType = 'cure';
        setDisabledState();
        setTaskMessage('VACCINE FUNDING IN PROGRESS');
        if (cureStatus) cureStatus.textContent = 'FUNDING... // 3.0 SEC';
        setCureProgress(0);
        startTaskAudio();

        const duration = 3000;
        const started = performance.now();

        function tick(now) {
            if (!window.isTaskActive || activeTaskType !== 'cure') return;
            if (window.isBlackout) {
                window.cancelCurrentTask();
                return;
            }

            const elapsed = now - started;
            const percent = Math.min(100, (elapsed / duration) * 100);
            setCureProgress(percent);

            if (cureStatus) {
                const seconds = Math.max(0, (duration - elapsed) / 1000);
                cureStatus.textContent = `FUNDING... // ${seconds.toFixed(1)} SEC`;
            }

            if (elapsed >= duration) {
                finishCure();
                return;
            }

            activeTaskTimer = requestAnimationFrame(tick);
        }

        activeTaskTimer = requestAnimationFrame(tick);
    });
}

function finishCure() {
    cureCount++;
    finishActiveState();
    setCureProgress(100);
    updateCounts();

    if (cureStatus) cureStatus.textContent = cureCount >= MAX_CURE
        ? 'COMPLETE // VACCINE FUNDING SECURED'
        : 'COMPLETE // NEXT FUNDING CYCLE READY';

    if (cureCount >= MAX_CURE && btnCure) {
        btnCure.textContent = 'VACCINE FUNDING COMPLETE';
        btnCure.style.color = '#7dffbe';
        btnCure.style.borderColor = '#7dffbe';
    }

    setTaskMessage(`VACCINE FUNDING ${cureCount}/${MAX_CURE}`);
    checkWinCondition();
}

// ============================================================
// PS7 TASK: 15 SECONDS, FUNDING FAILS AT 7.5 SECONDS
// ============================================================

if (btnPs7) {
    btnPs7.addEventListener('click', () => {
        if (window.isBlackout || window.isTaskActive || ps7Count >= MAX_PS7 || loanRequired) return;

        window.isTaskActive = true;
        activeTaskType = 'ps7';
        setDisabledState();
        setTaskMessage('PS7 PROCUREMENT IN PROGRESS');
        if (ps7Status) ps7Status.textContent = 'AUTHORIZING PURCHASE...';
        if (ps7Time) ps7Time.textContent = '15.0s';
        setPs7Progress(0);
        startTaskAudio();

        const duration = 15000;
        const fundingFailureAt = 7500;
        const started = performance.now();

        function tick(now) {
            if (!window.isTaskActive || activeTaskType !== 'ps7') return;
            if (window.isBlackout) {
                window.cancelCurrentTask();
                return;
            }

            const elapsed = now - started;
            const percent = Math.min(100, (elapsed / duration) * 100);
            const secondsLeft = Math.max(0, (duration - elapsed) / 1000);

            setPs7Progress(percent);
            if (ps7Time) ps7Time.textContent = secondsLeft.toFixed(1) + 's';

            // The emergency loan is a one-time interruption. Once signed,
            // PS7 must be allowed to finish its full 15-second purchase.
            if (elapsed >= fundingFailureAt && !loanSigned) {
                interruptPs7ForFunds();
                return;
            }

            if (ps7Status) ps7Status.textContent = 'AUTHORIZING PURCHASE...';

            activeTaskTimer = requestAnimationFrame(tick);
        }

        activeTaskTimer = requestAnimationFrame(tick);
    });
}

function interruptPs7ForFunds() {
    clearActiveTimer();
    stopTaskAudio();

    window.isTaskActive = false;
    activeTaskType = null;

    setPs7Progress(50);
    if (ps7Progress) ps7Progress.classList.add('warning');
    if (ps7Status) ps7Status.textContent = 'INSUFFICIENT FUNDS';
    if (ps7Time) ps7Time.textContent = 'FUNDING HALTED';

    showLoanTask();
    setDisabledState();
}

// ============================================================
// LOAN TASK: SIGN THE PAPER
// ============================================================

if (btnLoan) {
    btnLoan.addEventListener('click', () => {
        if (window.isBlackout || window.isTaskActive || loanSigned || !loanRequired) return;

        window.isTaskActive = true;
        activeTaskType = 'loan';
        setDisabledState();
        setTaskMessage('EMERGENCY LOAN // SIGNATURE REQUIRED');
        if (loanStatus) loanStatus.textContent = 'SIGNING... // VERIFYING AUTHORIZATION';
        if (loanSignature) loanSignature.textContent = 'SIGNING...';
        if (loanSignature) loanSignature.parentElement.classList.add('signed');
        startTaskAudio();

        // Signing is intentionally quick. The paperwork is the task, not another 15-second wait.
        activeTaskTimer = setTimeout(() => {
            if (window.isBlackout) {
                window.cancelCurrentTask();
                return;
            }

            loanSigned = true;
            finishActiveState();

            if (loanStatus) loanStatus.textContent = 'SIGNED // EMERGENCY CREDIT APPROVED';
            if (loanSignature) loanSignature.textContent = 'AUTHORIZED';
            if (loanPaper) loanPaper.classList.add('signed');
            setTaskMessage('LOAN APPROVED // RESTART PS7 PURCHASE');
            hideLoanTask();

            // Loan approval permanently clears the funding interruption.
            // Do not use this flag to decide whether PS7 should fail again.
            ps7FundingInterrupted = false;

            if (btnPs7) {
                btnPs7.textContent = 'PURCHASE PS7';
                btnPs7.style.color = '#b8c2bc';
                btnPs7.style.borderColor = '#3c4741';
            }

            setDisabledState();
        }, 900);
    });
}

// ============================================================
// INITIALIZE
// ============================================================

updateCounts();
setCureProgress(0);
setPs7Progress(0);
setDisabledState();
// --- End of Night Win Condition ---
function checkWinCondition() {
    if (nightCompleted || window.isBlackout) return;
    if (cureCount >= MAX_CURE && ps7Count >= MAX_PS7) {
        nightCompleted = true;
        triggerWin();
    }
}

function launchConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-20px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 20 + 10 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.zIndex = '10001';
        confetti.style.opacity = Math.random() + 0.5;
        confetti.style.pointerEvents = 'none';
        document.body.appendChild(confetti);

        const duration = Math.random() * 3 + 2; 
        const delay = Math.random() * 1.5; 

        confetti.animate([
            { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
            { transform: `translate3d(${Math.random() * 200 - 100}px, 100vh, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            delay: delay * 1000,
            easing: 'cubic-bezier(.37, 0, .63, 1)',
            fill: 'forwards'
        });

        setTimeout(() => confetti.remove(), (duration + delay) * 1000 + 100);
    }
}

function triggerWin() {
    if (window.night2WinStarted) return;
    window.night2WinStarted = true;

    document.body.style.cursor = 'none';

    const endScreen = document.createElement('div');
    endScreen.id = 'night-end-screen';
    endScreen.innerHTML = `
        <div class="night-end-vignette"></div>
        <div class="night-end-dawn"></div>
        <div class="night-end-scanlines"></div>
        <div class="night-end-time">6:00 AM</div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        #night-end-screen {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: #000;
            opacity: 0;
            pointer-events: all;
            transition: opacity 2.8s ease;
            overflow: hidden;
        }

        .night-end-dawn {
            position: absolute;
            inset: -20%;
            background: radial-gradient(
                circle at 50% 50%,
                rgba(255,255,255,.055),
                transparent 48%
            );
            opacity: .9;
        }

        .night-end-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                ellipse at center,
                transparent 30%,
                rgba(0,0,0,.92) 100%
            );
        }

        .night-end-scanlines {
            position: absolute;
            inset: 0;
            opacity: .13;
            background: repeating-linear-gradient(
                0deg,
                transparent 0,
                transparent 3px,
                rgba(255,255,255,.035) 4px
            );
        }

        .night-end-time {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -46%) scale(.97);
            color: #fff;
            font-family: 'Courier New', Courier, monospace;
            font-size: clamp(3rem, 7vw, 5.5rem);
            font-weight: 700;
            letter-spacing: .06em;
            opacity: 0;
            filter: blur(7px);
            text-shadow: 0 0 18px rgba(255,255,255,.28);
            transition:
                opacity 2.2s ease 1.1s,
                transform 2.4s cubic-bezier(.22,.61,.36,1) 1.1s,
                filter 2.2s ease 1.1s;
        }

        #night-end-screen.is-visible .night-end-time {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            filter: blur(0);
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(endScreen);

    requestAnimationFrame(() => endScreen.classList.add('is-visible'));

    const clockChime = new Audio('../Sounds/li-bing-tower-clock-chimewestminster-187254.mp3');
    const confettiCheer = new Audio('../Sounds/u_jspnqv1glx-1gift-confetti-447240.mp3');

    if (typeof window.completeNight === 'function') {
        window.completeNight(2);
    } else {
        console.warn('Save system not found. Make sure saveSystem.js is linked in your HTML.');
    }

    setTimeout(() => {
        clockChime.play().catch(e => console.log('[Tasks] Audio block:', e));
    }, 450);

    setTimeout(() => {
        confettiCheer.play().catch(e => console.log('[Tasks] Audio block:', e));
        launchConfetti();
    }, 3600);

    setTimeout(() => {
        window.location.href = '../title.html';
    }, 15000);
}
