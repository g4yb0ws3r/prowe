const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const root = document.documentElement;
const easterEgg = document.getElementById('easterEgg');
const subtitle = document.getElementById('subtitle');
const sessionLog = document.getElementById('sessionLog');
const pomodoroCountDisplay = document.getElementById('pomodoroCount');

// Timer configurations in seconds
const MODES = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

// Colors for transitions
const COLORS = {
    pomodoro: 'var(--accent-pomodoro)',
    shortBreak: 'var(--accent-short)',
    longBreak: 'var(--accent-long)'
};

let currentMode = 'pomodoro';
let timeLeft = MODES[currentMode];
let isRunning = false;
let timerInterval = null;
let pomodorosCompleted = 0;

// Audio context for the "eee" Sans sound effect (generated procedurally)
let audioCtx = null;
function playSansSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3ish, rough and raspy

    // Quick, choppy envelope characteristic of "text blips"
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.06);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.06);
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    timeDisplay.textContent = formattedTime;
    document.title = `${formattedTime} - Focus`;

    // Trigger Undertale easter egg subtly
    if (currentMode === 'pomodoro' && (timeLeft === 666 || timeLeft === 404)) {
        triggerEasterEgg();
    } else if (timeLeft % 60 === 0 && isRunning) {
        // Just hide it usually
        hideEasterEgg();
    }
}

function setMode(mode) {
    if (isRunning) pauseTimer();

    currentMode = mode;
    timeLeft = MODES[mode];

    // Update UI active states
    modeBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Update CSS variables for fluid color transitions
    root.style.setProperty('--current-accent', COLORS[mode]);

    // Subtitle changes contextually
    if (mode === 'pomodoro') subtitle.textContent = "Stay calm and productive.";
    if (mode === 'shortBreak') subtitle.textContent = "Take a breather.";
    if (mode === 'longBreak') subtitle.textContent = "Time to recharge.";

    hideEasterEgg();
    updateDisplay();
}

function startTimer() {
    if (isRunning) return;

    isRunning = true;
    startBtn.textContent = 'Pause';

    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            pauseTimer();
            logSession();
            // Optional: play an alarm sound here
            alert("Session complete!");
            resetTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    startBtn.textContent = 'Start';
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timeLeft = MODES[currentMode];
    hideEasterEgg();
    updateDisplay();
}

// Easter Egg Logic
let easterEggTimeout = null;
const sansDialogue = document.querySelector('.sans-dialogue');
const taskInput = document.getElementById('taskInput');

function triggerEasterEgg() {
    easterEgg.classList.remove('hidden');
    easterEgg.classList.add('visible');

    let taskName = taskInput && taskInput.value.trim() !== "" ? taskInput.value.trim() : "";
    if (taskName) {
        sansDialogue.textContent = `* Do you wanna have a bad time working on "${taskName}"? eee...`;
    } else {
        sansDialogue.textContent = `* Do you wanna have a bad time? eee...`;
    }

    // Play the "eee" sound a few times like text crawling
    let count = 0;
    const soundInterval = setInterval(() => {
        playSansSound();
        count++;
        if (count >= 5) clearInterval(soundInterval);
    }, 100);

    // Auto-hide after 5 seconds
    clearTimeout(easterEggTimeout);
    easterEggTimeout = setTimeout(() => {
        hideEasterEgg();
    }, 5000);
}

function hideEasterEgg() {
    easterEgg.classList.remove('visible');
    easterEgg.classList.add('hidden');
}


// Event Listeners
startBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);

modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        setMode(e.target.getAttribute('data-mode'));
    });
});

function logSession() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let logMessage = "";

    const li = document.createElement('li');
    li.classList.add('log-entry');
    li.classList.add(currentMode);

    const taskName = taskInput && taskInput.value.trim() !== "" ? taskInput.value.trim() : "";

    if (currentMode === 'pomodoro') {
        pomodorosCompleted++;
        pomodoroCountDisplay.textContent = pomodorosCompleted;
        logMessage = taskName ? `Focused on "${taskName}"` : "Pomodoro completed";
    } else if (currentMode === 'shortBreak') {
        logMessage = "Short Break taken";
    } else if (currentMode === 'longBreak') {
        logMessage = "Long Break taken";
    }

    li.innerHTML = `<span class="log-text">${logMessage}</span><span class="log-time">${timeString}</span>`;

    sessionLog.prepend(li);
}

// Initialize
updateDisplay();
