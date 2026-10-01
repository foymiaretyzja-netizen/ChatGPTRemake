// --- night2-sys/tasksN2.js ---

// NOTE: If you changed the IDs in your HTML, update 'btn-deport' and 'btn-missile' here!
const btnCure = document.getElementById('btn-deport'); 
const btnPs7 = document.getElementById('btn-missile'); 
const btnCamera = document.getElementById('camera-btn');

// --- Audio System ---
// Using ../ to ensure it routes out of night2-sys correctly
const taskAudio = new Audio('../Sounds/alex_jauk-coffee-machine-noise-218424.mp3');

function startTaskAudio() {
    taskAudio.currentTime = 0;
    taskAudio.play().catch(e => console.log("[Tasks] Audio block:", e));
}

function stopTaskAudio() {
    taskAudio.pause();
    taskAudio.currentTime = 0;
}

// Task 1: Cure Variables
let cureCount = 0;
const MAX_CURE = 15;

// Task 2: PS7 Variables
let ps7Count = 0;
const MAX_PS7 = 1;

// AI Data Relay & State Variables
window.isTaskActive = false; 

// Timer Storage
let activeTaskTimer = null;
let activeTaskType = null; // 'cure' or 'ps7'
let nightCompleted = false;

// Helper: Disables/Enables buttons while respecting max limits
function setTaskButtonsDisabled(disabled) {
    btnCure.disabled = disabled || (cureCount >= MAX_CURE);
    btnPs7.disabled = disabled || (ps7Count >= MAX_PS7);
}

// --- Cancellation Logic ---
window.cancelCurrentTask = function() {
    if (activeTaskTimer || window.isTaskActive) {
        clearInterval(activeTaskTimer);
        activeTaskTimer = null;
        window.isTaskActive = false;
        
        stopTaskAudio(); // Stop the sound if canceled by opening cameras or a jumpscare
        
        // Reset Button UI
        if (activeTaskType === 'cure' && btnCure) {
            btnCure.style.color = "#ccc";
            btnCure.innerText = `Fund cure for Liberal virius (${cureCount}/${MAX_CURE})`;
        } else if (activeTaskType === 'ps7' && btnPs7) {
            btnPs7.style.color = "#ccc";
            btnPs7.innerText = `Buy the new PS7 (${ps7Count}/${MAX_PS7})`;
        }
        
        setTaskButtonsDisabled(false);
        activeTaskType = null;
        console.log("Task canceled by player movement!");
    }
};

// Cancel tasks if the player opens the camera monitor
if (btnCamera) {
    btnCamera.addEventListener('click', () => {
        window.cancelCurrentTask();
    });
}

// --- Task 1: Fund Cure (5 Seconds) ---
btnCure.addEventListener('click', () => {
    if (window.isBlackout) return; 
    if (window.isTaskActive || cureCount >= MAX_CURE) return;

    window.isTaskActive = true;
    activeTaskType = 'cure';
    setTaskButtonsDisabled(true);
    btnCure.style.color = "#ffaa00"; 
    
    startTaskAudio();

    let timeLeft = 5;
    btnCure.innerText = `Funding... (${timeLeft}s)`;

    activeTaskTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            btnCure.innerText = `Funding... (${timeLeft}s)`;
        } else {
            clearInterval(activeTaskTimer);
            activeTaskTimer = null;
            finishCure(); // Finishes task and stops audio
        }
    }, 1000);
});

function finishCure() {
    cureCount++;
    window.isTaskActive = false;
    activeTaskType = null;
    
    stopTaskAudio(); // Cuts off the 20s audio loop early
    setTaskButtonsDisabled(false);
    
    btnCure.style.color = "#ccc"; 
    btnCure.innerText = `Fund cure for Liberal virius (${cureCount}/${MAX_CURE})`;
    
    if (cureCount >= MAX_CURE) {
        btnCure.style.color = "#00ff00";
        btnCure.style.borderColor = "#00ff00";
        btnCure.innerText = "Cure Funded";
        btnCure.disabled = true;
    }
    
    checkWinCondition();
}

// --- Task 2: Buy PS7 (15 Seconds) ---
btnPs7.addEventListener('click', () => {
    if (window.isBlackout) return;
    if (window.isTaskActive || ps7Count >= MAX_PS7) return;

    window.isTaskActive = true;
    activeTaskType = 'ps7';
    setTaskButtonsDisabled(true);
    btnPs7.style.color = "#ffaa00"; 
    
    startTaskAudio();

    let timeLeft = 15;
    btnPs7.innerText = `Purchasing... (${timeLeft}s)`;

    activeTaskTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            btnPs7.innerText = `Purchasing... (${timeLeft}s)`;
        } else {
            clearInterval(activeTaskTimer);
            activeTaskTimer = null;
            finishPs7(); // Finishes task and stops audio
        }
    }, 1000);
});

function finishPs7() {
    ps7Count++;
    window.isTaskActive = false;
    activeTaskType = null;
    
    stopTaskAudio(); // Cuts off the 20s audio loop early
    setTaskButtonsDisabled(false);
    
    btnPs7.style.color = "#ccc";
    btnPs7.innerText = `Buy the new PS7 (${ps7Count}/${MAX_PS7})`;
    
    if (ps7Count >= MAX_PS7) {
        btnPs7.style.color = "#00ff00";
        btnPs7.style.borderColor = "#00ff00";
        btnPs7.innerText = "PS7 Purchased";
        btnPs7.disabled = true;
    }
    
    checkWinCondition();
}

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
