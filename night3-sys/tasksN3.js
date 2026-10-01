// --- night3-sys/tasksN3.js ---

// Re-using old IDs, updated variables to match our new Wires task
const btnRepairLights = document.getElementById('btn-deport'); 
const btnFixWires = document.getElementById('btn-missile'); 
const btnCamera = document.getElementById('camera-btn');

// --- Audio System ---
const taskAudio = new Audio('../Sounds/alex_jauk-coffee-machine-noise-218424.mp3');
taskAudio.loop = true;

const successSound = new Audio('../Sounds/musheran-beep-313342.mp3'); // Clear beep
const failSound = new Audio('../Sounds/freesound_community-beep-beep-43875.mp3'); // Warning beep

function startTaskAudio() {
    taskAudio.currentTime = 0;
    taskAudio.play().catch(e => console.log("[Tasks] Audio block:", e));
}

function stopTaskAudio() {
    taskAudio.pause();
    taskAudio.currentTime = 0;
}

// --- Task Variables ---
let lightsCount = 0;
const MAX_LIGHTS = 10; 

let wiresCount = 0;
const MAX_WIRES = 5; // Updated to 5 tasks total!

window.isTaskActive = false; 

// Storage for minigame loops
let minigameAnimationFrame = null;
let minigameInterval = null;
let activeTaskType = null; 

// --- Inject Minigame Container & Styles ---
const minigameOverlay = document.createElement('div');
minigameOverlay.id = 'minigame-overlay';
document.body.appendChild(minigameOverlay);

const styles = document.createElement('style');
styles.innerHTML = `
    #minigame-overlay {
        display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.85); z-index: 1000; justify-content: center; align-items: center;
        flex-direction: column; color: white; font-family: 'Courier New', monospace;
    }
    .minigame-box {
        background: #222; border: 4px solid #555; padding: 20px; border-radius: 10px;
        text-align: center; box-shadow: 0 0 20px rgba(0,0,0,1); max-width: 90vw;
    }
    /* Lights Task CSS */
    .track-container { display: flex; gap: 15px; margin-top: 20px; justify-content: center; flex-wrap: wrap; }
    .track { width: 40px; height: 200px; background: #111; border: 2px solid #444; position: relative; }
    .slider { width: 100%; height: 40px; background: #00ff00; position: absolute; left: 0; box-shadow: 0 0 10px #00ff00; }
    .slider.paused { background: #ffaa00; box-shadow: 0 0 10px #ffaa00; }
    .track-btn { margin-top: 10px; padding: 10px; width: 100%; cursor: pointer; font-weight: bold; background: #444; color: #fff; border: 2px solid #666; }
    
    /* Wires Task CSS */
    .wires-container { position: relative; display: flex; justify-content: space-between; width: 320px; height: 280px; margin: 20px auto; }
    .wire-col { display: flex; flex-direction: column; justify-content: space-around; z-index: 2; }
    .wire-node { width: 35px; height: 35px; border-radius: 50%; border: 4px solid #ccc; cursor: pointer; position: relative; transition: transform 0.1s; }
    .wire-node.left-node::after { content: ''; position: absolute; right: -15px; top: 12px; width: 15px; height: 5px; background: inherit; }
    .wire-node.right-node::before { content: ''; position: absolute; left: -15px; top: 12px; width: 15px; height: 5px; background: inherit; }
    .cancel-hint { margin-top: 20px; color: #aaa; font-size: 0.9rem; }
`;
document.head.appendChild(styles);

// Click off minigame to cancel
minigameOverlay.addEventListener('mousedown', (e) => {
    if (e.target === minigameOverlay) {
        window.cancelCurrentTask();
    }
});

function setTaskButtonsDisabled(disabled) {
    if (btnRepairLights) btnRepairLights.disabled = disabled || (lightsCount >= MAX_LIGHTS);
    if (btnFixWires) btnFixWires.disabled = disabled || (wiresCount >= MAX_WIRES);
}

// --- Cancellation Logic ---
window.cancelCurrentTask = function() {
    if (window.isTaskActive) {
        window.isTaskActive = false;
        stopTaskAudio();
        
        cancelAnimationFrame(minigameAnimationFrame);
        clearInterval(minigameInterval);
        
        // Unbind Wire Drag Listeners globally so they don't leak
        if (window._wireMouseMove) {
            document.removeEventListener('mousemove', window._wireMouseMove);
            document.removeEventListener('touchmove', window._wireMouseMove);
            document.removeEventListener('mouseup', window._wireMouseUp);
            document.removeEventListener('touchend', window._wireMouseUp);
        }
        
        minigameOverlay.style.display = 'none';
        minigameOverlay.innerHTML = ''; // Clear contents

        if (activeTaskType === 'lights') {
            btnRepairLights.style.color = "#ccc";
            btnRepairLights.innerText = `Repair Lights (${lightsCount}/${MAX_LIGHTS})`;
        } else if (activeTaskType === 'wires') {
            btnFixWires.style.color = "#ccc";
            btnFixWires.innerText = `Connect Wires (${wiresCount}/${MAX_WIRES})`;
        }
        
        setTaskButtonsDisabled(false);
        activeTaskType = null;
        console.log("Task canceled by player!");
    }
};

// Cancel tasks if camera opens
if (btnCamera) {
    btnCamera.addEventListener('click', () => {
        window.cancelCurrentTask();
    });
}

// ==========================================
// TASK 1: REPAIR LIGHTS (ALIGNMENT MINIGAME)
// ==========================================
if (btnRepairLights) {
    btnRepairLights.innerText = `Repair Lights (${lightsCount}/${MAX_LIGHTS})`;
    btnRepairLights.addEventListener('click', () => {
        if (window.isTaskActive || lightsCount >= MAX_LIGHTS) return;

        window.isTaskActive = true;
        activeTaskType = 'lights';
        setTaskButtonsDisabled(true);
        btnRepairLights.style.color = "#ffaa00"; 
        
        startTaskAudio();
        startLightsMinigame();
    });
}

function startLightsMinigame() {
    minigameOverlay.style.display = 'flex';
    
    // Calculate difficulty: Base 3 tracks, +1 for every 3 completions
    const numTracks = 3 + Math.floor(lightsCount / 3);
    const baseSpeeds = [1.5, 2.0, 2.5]; 
    
    const sliders = [];
    for (let i = 0; i < numTracks; i++) {
        let spd = i < 3 ? baseSpeeds[i] : (3.5 + (i - 3)); 
        sliders.push({ 
            y: Math.random() * 150, 
            speed: spd, 
            dir: Math.random() > 0.5 ? 1 : -1, 
            paused: false 
        });
    }

    minigameOverlay.innerHTML = `
        <div class="minigame-box">
            <h2>ALIGN THE FREQUENCIES</h2>
            <div class="track-container" id="track-container"></div>
            <div class="cancel-hint">Click outside the box to cancel</div>
        </div>
    `;

    const container = document.getElementById('track-container');
    const sliderEls = [];

    for (let i = 0; i < numTracks; i++) {
        const trackWrap = document.createElement('div');
        const track = document.createElement('div');
        track.className = 'track';
        
        const sliderEl = document.createElement('div');
        sliderEl.className = 'slider';
        track.appendChild(sliderEl);
        sliderEls.push(sliderEl);

        const btn = document.createElement('button');
        btn.className = 'track-btn';
        btn.innerText = 'PAUSE';
        
        btn.onclick = () => {
            sliders[i].paused = !sliders[i].paused;
            sliderEl.classList.toggle('paused');
            btn.innerText = sliders[i].paused ? 'RESUME' : 'PAUSE';
            checkLightsWin(sliders);
        };

        trackWrap.appendChild(track);
        trackWrap.appendChild(btn);
        container.appendChild(trackWrap);
    }

    function animateLights() {
        for (let i = 0; i < numTracks; i++) {
            if (!sliders[i].paused) {
                sliders[i].y += sliders[i].speed * sliders[i].dir;
                if (sliders[i].y <= 0 || sliders[i].y >= 160) sliders[i].dir *= -1;
                sliderEls[i].style.top = `${sliders[i].y}px`;
            }
        }
        minigameAnimationFrame = requestAnimationFrame(animateLights);
    }
    animateLights();
}

function checkLightsWin(sliders) {
    if (sliders.every(s => s.paused)) {
        const ys = sliders.map(s => s.y);
        const diff = Math.max(...ys) - Math.min(...ys);

        if (diff < 25) { 
            successSound.play();
            lightsCount++;
            window.cancelCurrentTask(); 
            
            if (lightsCount >= MAX_LIGHTS) {
                if (typeof window.restoreLights === 'function') window.restoreLights();
                btnRepairLights.style.color = "#00ff00";
                btnRepairLights.style.borderColor = "#00ff00";
                btnRepairLights.innerText = "Lights Repaired";
                btnRepairLights.disabled = true;
            }
            checkWinCondition();
        } else {
            failSound.currentTime = 0;
            failSound.play();
            document.querySelectorAll('.track-btn').forEach(btn => btn.click());
        }
    }
}

// ==========================================
// TASK 2: CONNECT WIRES (DRAG & DROP MINIGAME)
// ==========================================
if (btnFixWires) {
    btnFixWires.innerText = `Connect Wires (${wiresCount}/${MAX_WIRES})`;
    btnFixWires.addEventListener('click', () => {
        if (typeof isBlackout !== 'undefined' && isBlackout) return;
        if (window.isTaskActive || wiresCount >= MAX_WIRES) return;

        window.isTaskActive = true;
        activeTaskType = 'wires';
        setTaskButtonsDisabled(true);
        btnFixWires.style.color = "#ffaa00"; 
        
        startTaskAudio();
        startWiresMinigame();
    });
}

function startWiresMinigame() {
    minigameOverlay.style.display = 'flex';
    
    // Scale Difficulty: First 3 completions = 3 wires. Last 2 completions = 5 wires.
    const numWires = wiresCount < 3 ? 3 : 5;
    const allColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'];
    const activeColors = allColors.slice(0, numWires);
    
    // Shuffle Left and Right independently
    const leftColors = [...activeColors].sort(() => Math.random() - 0.5);
    const rightColors = [...activeColors].sort(() => Math.random() - 0.5);

    minigameOverlay.innerHTML = `
        <div class="minigame-box" style="width: 400px; touch-action: none;">
            <h2>RE-ROUTE POWER</h2>
            <p style="margin-bottom: 10px;">Drag wires to match colors!</p>
            <div class="wires-container" id="wires-container">
                <svg id="wire-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1; overflow:visible;"></svg>
                <div class="wire-col" id="left-wires"></div>
                <div class="wire-col" id="right-wires"></div>
            </div>
            <div class="cancel-hint">Click outside the box to cancel</div>
        </div>
    `;

    const leftCol = document.getElementById('left-wires');
    const rightCol = document.getElementById('right-wires');

    // Build the nodes
    leftColors.forEach(color => {
        const node = document.createElement('div');
        node.className = 'wire-node left-node';
        node.style.backgroundColor = color;
        node.dataset.color = color;
        leftCol.appendChild(node);
    });

    rightColors.forEach(color => {
        const node = document.createElement('div');
        node.className = 'wire-node right-node';
        node.style.backgroundColor = color;
        node.dataset.color = color;
        rightCol.appendChild(node);
    });

    // --- Drag Logic ---
    let selectedColor = null;
    let selectedNode = null;
    const connections = {};
    const svg = document.getElementById('wire-svg');

    // Create the active tracking line
    const activeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    activeLine.setAttribute('stroke-width', '10');
    activeLine.setAttribute('stroke-linecap', 'round');
    activeLine.style.display = 'none';
    svg.appendChild(activeLine);

    // Get exact center of a node to anchor the lines
    function getCoords(element) {
        const containerRect = document.getElementById('wires-container').getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left - containerRect.left + (rect.width / 2),
            y: rect.top - containerRect.top + (rect.height / 2)
        };
    }

    // Redraws the lines that have been successfully matched
    function renderConnections() {
        svg.querySelectorAll('.perm-line').forEach(el => el.remove());
        Object.keys(connections).forEach(color => {
            const lNode = document.querySelector(`.left-node[data-color="${color}"]`);
            const rNode = document.querySelector(`.right-node[data-color="${color}"]`);
            if (lNode && rNode) {
                const p1 = getCoords(lNode);
                const p2 = getCoords(rNode);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', p1.x);
                line.setAttribute('y1', p1.y);
                line.setAttribute('x2', p2.x);
                line.setAttribute('y2', p2.y);
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', '10');
                line.setAttribute('stroke-linecap', 'round');
                line.classList.add('perm-line');
                svg.appendChild(line);
            }
        });
    }

    // Handles Tracing
    window._wireMouseMove = (e) => {
        if (!selectedColor) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const containerRect = document.getElementById('wires-container').getBoundingClientRect();
        
        activeLine.setAttribute('x2', clientX - containerRect.left);
        activeLine.setAttribute('y2', clientY - containerRect.top);
    };

    // Handles Dropping
    window._wireMouseUp = (e) => {
        if (!selectedColor) return;
        
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        
        // Find what we dropped the wire on top of
        const droppedElement = document.elementFromPoint(clientX, clientY);
        
        if (droppedElement && droppedElement.classList.contains('right-node')) {
            if (droppedElement.dataset.color === selectedColor) {
                // Correct Match!
                connections[selectedColor] = true;
                successSound.play();
                renderConnections();
            } else {
                // Wrong Match!
                failSound.currentTime = 0;
                failSound.play();
            }
        }
        
        // Reset state
        if (selectedNode) selectedNode.style.transform = 'scale(1)';
        selectedColor = null;
        selectedNode = null;
        activeLine.style.display = 'none';
        
        // Check if all wires are connected
        if (Object.keys(connections).length === numWires) {
            wiresCount++;
            setTimeout(() => {
                window.cancelCurrentTask(); 
                if (wiresCount >= MAX_WIRES) {
                    btnFixWires.style.color = "#00ff00";
                    btnFixWires.style.borderColor = "#00ff00";
                    btnFixWires.innerText = "Wires Connected";
                    btnFixWires.disabled = true;
                }
                checkWinCondition();
            }, 600); // Slight delay so player sees the final connected line
        }
    };

    // Attach dragging events to the document so it tracks smoothly
    document.addEventListener('mousemove', window._wireMouseMove);
    document.addEventListener('mouseup', window._wireMouseUp);
    document.addEventListener('touchmove', window._wireMouseMove, {passive: false});
    document.addEventListener('touchend', window._wireMouseUp);

    // Initial click setup for the left nodes
    document.querySelectorAll('.left-node').forEach(node => {
        const startDrag = (e) => {
            const color = node.dataset.color;
            if (connections[color]) return; // Block dragging if already connected
            
            selectedColor = color;
            selectedNode = node;
            node.style.transform = 'scale(1.2)';
            
            const coords = getCoords(node);
            activeLine.setAttribute('x1', coords.x);
            activeLine.setAttribute('y1', coords.y);
            activeLine.setAttribute('x2', coords.x);
            activeLine.setAttribute('y2', coords.y);
            activeLine.setAttribute('stroke', color);
            activeLine.style.display = 'block';
        };

        // Supports both mouse and touchscreens
        node.addEventListener('mousedown', startDrag);
        node.addEventListener('touchstart', (e) => { 
            e.preventDefault(); // Prevents screen scrolling while dragging
            startDrag(e); 
        }, {passive: false});
    });
}

// --- End of Night Win Condition ---
function checkWinCondition() {
    if (lightsCount >= MAX_LIGHTS && wiresCount >= MAX_WIRES) {
        triggerWin();
    }
}

// --- Confetti & Win Sequence ---
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
    winText.innerText = "6:00 AM";
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

    const clockChime = new Audio('../Sounds/li-bing-tower-clock-chimewestminster-187254.mp3');
    const confettiCheer = new Audio('../Sounds/u_jspnqv1glx-1gift-confetti-447240.mp3');

    if (typeof window.completeNight === 'function') {
        window.completeNight(3); 
    } else {
        console.warn("Save system not found.");
    }

    setTimeout(() => { 
        fadeOutDiv.style.opacity = '1'; 
        clockChime.play().catch(e => console.log("[Tasks] Audio block:", e));
    }, 100);

    setTimeout(() => { 
        winText.style.opacity = '1'; 
        confettiCheer.play().catch(e => console.log("[Tasks] Audio block:", e));
        launchConfetti(); 
        
        setTimeout(() => { 
            window.location.href = '../title.html'; 
        }, 15000);
        
    }, 2000); 
}
