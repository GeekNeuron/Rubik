// The imports are now correct based on the new architecture.
import { updateBackgroundColor } from './three-scene.js';

/**
 * Initializes all UI components of the application.
 */
export function initUI() {
    initTheme();
    initTimer();
    initModals();
}

/**
 * Sets up the theme switcher button and loads the saved theme.
 */
function initTheme() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) return;

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    updateThemeIcon(savedTheme);

    themeSwitcher.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        const newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        // Call the imported function to update the 3D scene's background
        updateBackgroundColor();
    });
}

/**
 * Updates the theme switcher's sun/moon icon.
 * @param {string} theme - The current theme ('light' or 'dark').
 */
function updateThemeIcon(theme) {
    const themeIconElement = document.getElementById('theme-icon');
    if (!themeIconElement) return;
    const sunIcon = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    themeIconElement.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

let timerInterval;
let seconds = 0;
let timerHistory = JSON.parse(localStorage.getItem('timerHistory')) || [];

/**
 * Initializes the timer display and its click event.
 */
function initTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.addEventListener('click', showHistoryModal);
    }
}

function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

/**
 * Sets up event listeners for modals.
 */
function initModals() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    if(settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => settingsModal.classList.add('show'));
    }
    
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.modal').classList.remove('show'));
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });
}

/**
 * Displays the timer history modal with saved times.
 */
function showHistoryModal() {
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    if (!historyModal || !historyList) return;

    historyList.innerHTML = '';
    if (timerHistory.length === 0) {
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
