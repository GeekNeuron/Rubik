import { createTimerController, formatTime, formatEntryTime, computeStats } from './speedtimer.js';
import { t } from './i18n.js';
import { scrambleCubeInstantly } from './cube.js';
import { startStackmatListening, stopStackmatListening } from './stackmat-bridge.js';
import { PacketStatus } from '../../libs/stackmat/packet/packet.js';

let controller = null;
let displayEl, scrambleEl, statsEl, historyEl, tapAreaEl, inspectionToggle;
let stackmatToggle, stackmatStatusEl, stackmatDot, handDotL, handDotR, hintEl;
let stackmatInstance = null;
let stackmatActive = false;
let scene = null;

export function initSpeedTimer(threeScene) {
    scene = threeScene;
    const openBtn = document.getElementById('speedtimer-btn');
    const modal = document.getElementById('speedtimer-modal');
    if (!openBtn || !modal) return;

    openBtn.addEventListener('click', () => {
        renderTimer();
        modal.classList.add('show');
    });
}

function fmtStat(ms) {
    if (ms === Infinity) return 'DNF';
    return formatTime(ms);
}

function renderTimer() {
    const body = document.getElementById('speedtimer-body');
    body.innerHTML = '';

    const settingsRow = document.createElement('label');
    settingsRow.className = 'st-inspection-toggle';
    inspectionToggle = document.createElement('input');
    inspectionToggle.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = t('stUseInspection');
    settingsRow.append(inspectionToggle, span);
    body.appendChild(settingsRow);

    const stackmatRow = document.createElement('label');
    stackmatRow.className = 'st-inspection-toggle';
    stackmatToggle = document.createElement('input');
    stackmatToggle.type = 'checkbox';
    const stackmatSpan = document.createElement('span');
    stackmatSpan.textContent = t('stUseStackmat');
    stackmatRow.append(stackmatToggle, stackmatSpan);
    body.appendChild(stackmatRow);

    stackmatStatusEl = document.createElement('div');
    stackmatStatusEl.className = 'st-hw-status';
    stackmatStatusEl.style.display = 'none';
    stackmatDot = document.createElement('span');
    stackmatDot.className = 'st-hw-dot';
    const stackmatLabel = document.createElement('span');
    stackmatLabel.className = 'st-hw-label';
    const handsWrap = document.createElement('span');
    handsWrap.className = 'st-hw-hands';
    handDotL = document.createElement('span');
    handDotL.className = 'st-hw-dot';
    handDotL.title = t('stStackmatHandL');
    handDotR = document.createElement('span');
    handDotR.className = 'st-hw-dot';
    handDotR.title = t('stStackmatHandR');
    handsWrap.append(handDotL, handDotR);
    stackmatStatusEl.append(stackmatDot, stackmatLabel, handsWrap);
    body.appendChild(stackmatStatusEl);

    scrambleEl = document.createElement('p');
    scrambleEl.className = 'st-scramble';
    body.appendChild(scrambleEl);

    tapAreaEl = document.createElement('div');
    tapAreaEl.className = 'st-tap-area';
    displayEl = document.createElement('div');
    displayEl.className = 'st-display';
    tapAreaEl.appendChild(displayEl);
    const hint = document.createElement('p');
    hint.className = 'st-hint';
    hint.textContent = t('stHint');
    hintEl = hint;
    tapAreaEl.appendChild(hint);
    body.appendChild(tapAreaEl);

    statsEl = document.createElement('div');
    statsEl.className = 'st-stats';
    body.appendChild(statsEl);

    const actions = document.createElement('div');
    actions.className = 'st-actions';
    const newScrambleBtn = document.createElement('button');
    newScrambleBtn.className = 'btn';
    newScrambleBtn.textContent = t('stNewScramble');
    newScrambleBtn.addEventListener('click', () => {
        const scr = controller.newScramble();
        scrambleEl.textContent = scr;
        applyScrambleToMainCube(scr);
    });
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn';
    clearBtn.textContent = t('stClearAll');
    clearBtn.addEventListener('click', () => {
        if (!confirm(t('stClearConfirm'))) return;
        controller.clearAll();
        renderStats();
        renderHistory();
    });
    actions.append(newScrambleBtn, clearBtn);
    body.appendChild(actions);

    historyEl = document.createElement('div');
    historyEl.className = 'st-history';
    body.appendChild(historyEl);

    controller = createTimerController({
        onStateChange: handleStateChange,
        onTick: (ms) => { displayEl.textContent = formatTime(ms); },
        onInspectionTick: (remainMs) => {
            displayEl.textContent = Math.ceil(remainMs / 1000).toString();
        },
        onRecorded: () => { renderStats(); renderHistory(); },
    });

    inspectionToggle.checked = controller.isInspectionEnabled();
    inspectionToggle.addEventListener('change', () => {
        controller.setInspectionEnabled(inspectionToggle.checked);
    });

    stackmatToggle.checked = false;
    stackmatToggle.addEventListener('change', () => {
        if (stackmatToggle.checked) enableStackmat(); else disableStackmat();
    });

    scrambleEl.textContent = controller.getScramble();
    applyScrambleToMainCube(controller.getScramble());
    displayEl.textContent = '0.00';
    renderStats();
    renderHistory();

    tapAreaEl.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!stackmatActive) controller.onPointerDown(); });
    tapAreaEl.addEventListener('pointerup', (e) => { e.preventDefault(); if (!stackmatActive) controller.onPointerUp(); });
    window.addEventListener('keydown', spaceDown);
    window.addEventListener('keyup', spaceUp);

    const modal = document.getElementById('speedtimer-modal');
    const cleanup = () => {
        window.removeEventListener('keydown', spaceDown);
        window.removeEventListener('keyup', spaceUp);
        disableStackmat();
    };
    // Covers the explicit close button *and* the app's generic
    // backdrop-click/Escape handlers (which just toggle the "show" class
    // directly) - a MutationObserver is the one place that sees every path
    // by which this modal can close, so the microphone always gets
    // released instead of leaking in the background.
    modal.querySelectorAll('.close-button').forEach(b => b.addEventListener('click', cleanup, { once: true }));
    const closeObserver = new MutationObserver(() => {
        if (!modal.classList.contains('show')) { cleanup(); closeObserver.disconnect(); }
    });
    closeObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });

    controller.startInspectionManually();
}

async function enableStackmat() {
    stackmatStatusEl.style.display = 'flex';
    setStackmatLabel(t('stStackmatWaiting'), false);
    stackmatInstance = await startStackmatListening((problem) => {
        stackmatToggle.checked = false;
        const key = problem === 'unsupported' ? 'stStackmatUnsupported'
            : problem === 'permission' ? 'stStackmatPermission' : 'stStackmatError';
        setStackmatLabel(t(key), false);
        stackmatDot.classList.add('off-line');
        stackmatActive = false;
    });
    if (!stackmatInstance) return;
    stackmatActive = true;
    tapAreaEl.classList.add('st-hw-mode');
    hintEl.textContent = t('stStackmatHint');

    stackmatInstance.on('timerConnected', () => setStackmatLabel(t('stStackmatConnected'), true));
    stackmatInstance.on('timerDisconnected', () => setStackmatLabel(t('stStackmatWaiting'), false));
    stackmatInstance.on('packetReceived', (packet) => {
        handDotL.classList.toggle('on', packet.isLeftHandDown);
        handDotR.classList.toggle('on', packet.isRightHandDown);
        if (packet.status === PacketStatus.RUNNING) displayEl.textContent = formatTime(packet.timeInMilliseconds);
    });
    stackmatInstance.on('ready', () => controller.hardwareReady());
    stackmatInstance.on('started', () => controller.hardwareStarted());
    stackmatInstance.on('stopped', (packet) => controller.hardwareStopped(packet.timeInMilliseconds));
    stackmatInstance.on('reset', () => controller.hardwareReset());
}

function disableStackmat() {
    stopStackmatListening(stackmatInstance);
    stackmatInstance = null;
    stackmatActive = false;
    if (tapAreaEl) tapAreaEl.classList.remove('st-hw-mode');
    if (hintEl) hintEl.textContent = t('stHint');
    if (stackmatStatusEl) stackmatStatusEl.style.display = 'none';
    if (handDotL) { handDotL.classList.remove('on'); handDotR.classList.remove('on'); }
    if (stackmatDot) stackmatDot.classList.remove('off-line');
}

function setStackmatLabel(text, connected) {
    stackmatStatusEl.querySelector('.st-hw-label').textContent = text;
    stackmatDot.classList.toggle('on', connected);
    if (connected) stackmatDot.classList.remove('off-line');
}

function applyScrambleToMainCube(scrambleStr) {
    if (scene && scrambleCubeInstantly) {
        try { scrambleCubeInstantly(scrambleStr, scene); } catch { /* non-critical visual aid */ }
    }
}

function spaceDown(e) {
    if (e.code !== 'Space' || e.repeat) return;
    if (!document.getElementById('speedtimer-modal').classList.contains('show')) return;
    e.preventDefault();
    controller.onPointerDown();
}
function spaceUp(e) {
    if (e.code !== 'Space') return;
    if (!document.getElementById('speedtimer-modal').classList.contains('show')) return;
    e.preventDefault();
    controller.onPointerUp();
}

function handleStateChange(state) {
    tapAreaEl.classList.remove('st-holding', 'st-ready', 'st-running', 'st-inspecting');
    if (state === 'holding') tapAreaEl.classList.add('st-holding');
    if (state === 'ready') tapAreaEl.classList.add('st-ready');
    if (state === 'running') tapAreaEl.classList.add('st-running');
    if (state === 'inspecting') tapAreaEl.classList.add('st-inspecting');
    if (state === 'idle') displayEl.textContent = '0.00';
    if (state === 'inspecting') displayEl.textContent = '15';
}

function renderStats() {
    const stats = computeStats(controller.getSession());
    statsEl.innerHTML = '';
    if (!stats.count) {
        statsEl.textContent = t('stNoSolvesYet');
        return;
    }
    const rows = [
        [t('stBest'), fmtStat(stats.best)],
        [t('stMean'), fmtStat(stats.mean)],
        ['Ao5', stats.ao5 != null ? fmtStat(stats.ao5) : '-'],
        ['Ao12', stats.ao12 != null ? fmtStat(stats.ao12) : '-'],
        [t('stCount'), String(stats.count)],
    ];
    rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'st-stat-row';
        row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        statsEl.appendChild(row);
    });
}

function renderHistory() {
    historyEl.innerHTML = '';
    const session = controller.getSession();
    session.slice().reverse().forEach((entry, revIdx) => {
        const idx = session.length - 1 - revIdx;
        const row = document.createElement('div');
        row.className = 'st-history-row';
        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatEntryTime(entry);
        timeSpan.title = entry.scramble;
        const delBtn = document.createElement('button');
        delBtn.className = 'st-delete-btn';
        delBtn.textContent = '×';
        delBtn.setAttribute('aria-label', t('stDeleteSolve'));
        delBtn.addEventListener('click', () => {
            controller.deleteEntry(idx);
            renderStats();
            renderHistory();
        });
        row.append(timeSpan, delBtn);
        historyEl.appendChild(row);
    });
}
