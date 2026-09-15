import { updateBackgroundColor } from './three-scene.js';
import { updateCubeColors } from './cube.js';
import { initLanguage, t } from './i18n.js';
import { isMoveTickerVisible, setMoveTickerVisible, getAnimationSpeed, setAnimationSpeed, getScrambleLength, setScrambleLength, isSoundEnabled, setSoundEnabled } from './settings-state.js';
import { applyTickerVisibility } from './move-ticker.js';

export { t };

/**
 * Initializes all UI components of the application.
 */
export function initUI() {
    restoreCustomColors();
    initLanguage();
    initTheme();
    initTimer();
    initModals();
}

const CUSTOM_COLORS_KEY = 'customFaceColors';
const FACE_COLOR_VARS = ['--color-up', '--color-down', '--color-front', '--color-back', '--color-left', '--color-right'];
const DEFAULT_FACE_COLORS = {
    '--color-up': '#ffffff', '--color-down': '#ffd500', '--color-front': '#009e60',
    '--color-back': '#0051ba', '--color-left': '#ff5800', '--color-right': '#c41e3a',
};
// The Okabe-Ito palette (a well-established colorblind-safe qualitative
// set) mapped onto the 6 faces - keeps every face pairwise distinguishable
// under the common forms of color blindness, unlike the standard
// red/green/orange/blue scheme.
const COLORBLIND_FACE_COLORS = {
    '--color-up': '#ffffff', '--color-down': '#f0e442', '--color-front': '#009e73',
    '--color-back': '#56b4e9', '--color-left': '#d55e00', '--color-right': '#cc79a7',
};

function restoreCustomColors() {
    try {
        const raw = localStorage.getItem(CUSTOM_COLORS_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        FACE_COLOR_VARS.forEach(v => {
            if (saved[v]) document.documentElement.style.setProperty(v, saved[v]);
        });
    } catch { /* ignore malformed data */ }
}

function saveCustomColors() {
    const values = {};
    FACE_COLOR_VARS.forEach(v => {
        values[v] = getComputedStyle(document.body).getPropertyValue(v).trim();
    });
    try { localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(values)); } catch { /* ignore */ }
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
        updateBackgroundColor();
    });
}

function updateThemeIcon(theme) {
    const themeIconElement = document.getElementById('theme-icon');
    if (!themeIconElement) return;
    const sunIcon = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    themeIconElement.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

// --- Timer Logic ---
let timerInterval;
let seconds = 0;
let timerHistory = JSON.parse(localStorage.getItem('timerHistory')) || [];

function initTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.addEventListener('click', showHistoryModal);
    }
    resetClock();
}

export function startClock() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('timer').textContent = formatTime(seconds);
    }, 1000);
}

export function stopClock() {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;
    if (seconds > 0) {
        timerHistory.push({ time: seconds, date: new Date().toLocaleString('en-US') });
        localStorage.setItem('timerHistory', JSON.stringify(timerHistory));
    }
}

export function resetClock() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    seconds = 0;
    document.getElementById('timer').textContent = formatTime(seconds);
}

function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// --- Button enable/disable (used while an animation is playing) ---
export function setButtonsEnabled(enabled) {
    ['scramble-btn', 'solve-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !enabled;
    });
}

// --- Header messages (replaces blocking alert() popups, and sits in the
// header rather than floating over the cube/controls) ---
export function showToast(message, duration = 2500) {
    const el = document.getElementById('header-message');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// --- Modal Logic ---
function initModals() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            populateColorSettings();
            populatePreferenceToggles();
            settingsModal.classList.add('show');
        });
    }

    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.modal').classList.remove('show'));
    });

    initSettingsIO();

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
        }
    });
}

function populateColorSettings() {
    const colorSettingsDiv = document.querySelector('.color-settings');
    if (!colorSettingsDiv) return;
    colorSettingsDiv.innerHTML = '';
    const faces = [
        { key: 'faceUp', var: '--color-up' }, { key: 'faceDown', var: '--color-down' },
        { key: 'faceFront', var: '--color-front' }, { key: 'faceBack', var: '--color-back' },
        { key: 'faceLeft', var: '--color-left' }, { key: 'faceRight', var: '--color-right' }
    ];

    faces.forEach(face => {
        const group = document.createElement('div');
        group.className = 'color-input-group';
        const label = document.createElement('label');
        label.textContent = t(face.key);
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.setAttribute('aria-label', t(face.key));
        colorInput.value = getComputedStyle(document.body).getPropertyValue(face.var).trim();
        colorInput.addEventListener('input', (e) => {
            document.documentElement.style.setProperty(face.var, e.target.value);
            updateCubeColors();
            saveCustomColors();
        });
        group.append(label, colorInput);
        colorSettingsDiv.appendChild(group);
    });
}

function populatePreferenceToggles() {
    const speedSelect = document.getElementById('animation-speed-select');
    const scrambleSelect = document.getElementById('scramble-length-select');
    const tickerToggle = document.getElementById('move-ticker-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const colorblindBtn = document.getElementById('colorblind-palette-btn');
    const resetColorsBtn = document.getElementById('reset-colors-btn');

    if (speedSelect) {
        speedSelect.value = getAnimationSpeed();
        speedSelect.onchange = () => setAnimationSpeed(speedSelect.value);
    }
    if (scrambleSelect) {
        scrambleSelect.value = String(getScrambleLength());
        scrambleSelect.onchange = () => setScrambleLength(scrambleSelect.value);
    }
    if (tickerToggle) {
        tickerToggle.checked = isMoveTickerVisible();
        tickerToggle.onchange = () => {
            setMoveTickerVisible(tickerToggle.checked);
            applyTickerVisibility();
        };
    }
    if (soundToggle) {
        soundToggle.checked = isSoundEnabled();
        soundToggle.onchange = () => setSoundEnabled(soundToggle.checked);
    }
    if (colorblindBtn) {
        colorblindBtn.onclick = () => applyFaceColorPalette(COLORBLIND_FACE_COLORS);
    }
    if (resetColorsBtn) {
        resetColorsBtn.onclick = () => applyFaceColorPalette(DEFAULT_FACE_COLORS);
    }
}

function applyFaceColorPalette(palette) {
    FACE_COLOR_VARS.forEach(v => document.documentElement.style.setProperty(v, palette[v]));
    updateCubeColors();
    saveCustomColors();
    populateColorSettings(); // refresh the color swatches to reflect the new values
}

function showHistoryModal() {
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    if (!historyModal || !historyList) return;

    historyList.innerHTML = '';
    if (timerHistory.length === 0) {
        const li = document.createElement('li');
        li.textContent = t('noHistory');
        historyList.appendChild(li);
    } else {
        timerHistory.slice().reverse().forEach(item => {
            const li = document.createElement('li');
            li.textContent = t('historyEntry', formatTime(item.time), item.date);
            historyList.appendChild(li);
        });
    }
    historyModal.classList.add('show');
}

// --- Settings export / import (theme, language, colors, timer history) ---
const EXPORTABLE_KEYS = [
    'theme', 'lang', 'timerHistory', 'customFaceColors',
    'physicalCubeNetColors', 'speedTimerSession', 'speedTimerSettings',
];

function initSettingsIO() {
    const exportBtn = document.getElementById('export-settings-btn');
    const importBtn = document.getElementById('import-settings-btn');
    const importInput = document.getElementById('import-settings-input');
    if (!exportBtn || !importBtn || !importInput) return;

    exportBtn.addEventListener('click', () => {
        const data = {};
        EXPORTABLE_KEYS.forEach(key => {
            const raw = localStorage.getItem(key);
            if (raw !== null) data[key] = raw;
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rubiks-cube-settings.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast(t('settingsExported'));
    });

    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async () => {
        const file = importInput.files[0];
        importInput.value = '';
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            let applied = 0;
            EXPORTABLE_KEYS.forEach(key => {
                if (typeof data[key] === 'string') {
                    localStorage.setItem(key, data[key]);
                    applied++;
                }
            });
            if (applied === 0) throw new Error('empty');
            showToast(t('settingsImported'));
            setTimeout(() => window.location.reload(), 800);
        } catch {
            showToast(t('settingsImportFailed'));
        }
    });
}
