import { updateBackgroundColor } from './three-scene.js';
import { updateCubeColors } from './cube.js';

let themeSwitcher, timerElement, historyModal, settingsModal, historyList;
let closeButtons;
let timerInterval;
let seconds = 0;
let timerHistory = JSON.parse(localStorage.getItem('timerHistory')) || [];

function initTheme() {
    themeSwitcher = document.getElementById('theme-switcher');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    updateThemeIcon(savedTheme);

    themeSwitcher.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        const newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        updateBackgroundColor();
    });
}

function updateThemeIcon(theme) {
    const iconSvg = theme === 'dark' 
        ? `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`
        : `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    document.getElementById('theme-icon').innerHTML = iconSvg;
}

function initTimer() {
    timerElement = document.getElementById('timer');
    timerElement.addEventListener('click', showHistoryModal);
    startTimer();
}

function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        timerElement.textContent = formatTime(seconds);
    }, 1000);
}

export function stopTimer() {
    clearInterval(timerInterval);
    if (seconds > 0) {
        timerHistory.push({ time: seconds, date: new Date().toLocaleString('en-US') });
        localStorage.setItem('timerHistory', JSON.stringify(timerHistory));
    }
}

export function resetTimer() {
    stopTimer();
    seconds = 0;
    timerElement.textContent = formatTime(seconds);
    startTimer();
}

function initModals() {
    historyModal = document.getElementById('history-modal');
    settingsModal = document.getElementById('settings-modal');
    historyList = document.getElementById('history-list');
    closeButtons = document.querySelectorAll('.close-button');

    document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
    
    closeButtons.forEach(btn => btn.addEventListener('click', () => {
        historyModal.classList.remove('show');
        settingsModal.classList.remove('show');
    }));

    window.addEventListener('click', (event) => {
        if (event.target === historyModal) historyModal.classList.remove('show');
        if (event.target === settingsModal) settingsModal.classList.remove('show');
    });
}

function showHistoryModal() {
    historyList.innerHTML = '';
    if(timerHistory.length === 0) {
        historyList.innerHTML = '<li>No history yet.</li>';
    } else {
        timerHistory.slice().reverse().forEach(item => {
            const li = document.createElement('li');
            li.textContent = `Time: ${formatTime(item.time)} - Date: ${item.date}`;
            historyList.appendChild(li);
        });
    }
    historyModal.classList.add('show');
}

function showSettingsModal() {
    const colorSettingsDiv = settingsModal.querySelector('.color-settings');
    colorSettingsDiv.innerHTML = '';
    const faces = [
        { name: 'Up', var: '--color-up' }, { name: 'Down', var: '--color-down' },
        { name: 'Front', var: '--color-front' }, { name: 'Back', var: '--color-back' },
        { name: 'Left', var: '--color-left' }, { name: 'Right', var: '--color-right' }
    ];

    faces.forEach(face => {
        const group = document.createElement('div');
        group.className = 'color-input-group';
        const label = document.createElement('label');
        label.textContent = face.name;
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = getComputedStyle(document.documentElement).getPropertyValue(face.var).trim();
        colorInput.addEventListener('input', (e) => {
            document.documentElement.style.setProperty(face.var, e.target.value);
        });
        colorInput.addEventListener('change', updateCubeColors);
        group.append(label, colorInput);
        colorSettingsDiv.appendChild(group);
    });

    settingsModal.classList.add('show');
}

export function initUI() {
    initTheme();
    initTimer();
    initModals();
}
