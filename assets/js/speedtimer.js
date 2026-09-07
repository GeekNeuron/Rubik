// A standalone speedcubing timer (StackMat-style): hold to arm, release to
// start, tap to stop - centisecond precision, session stats (best/mean/
// ao5/ao12), and a fresh scramble each time. Independent of the app's other
// scramble/solve timer, which tracks the virtual 3D cube instead.
// Optionally uses WCA-style 15s inspection with +2 / DNF penalties.

const STORAGE_KEY = 'speedTimerSession';
const SETTINGS_KEY = 'speedTimerSettings';
const AXIS_OF = { U: 'y', D: 'y', R: 'x', L: 'x', F: 'z', B: 'z' };
const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
const MODS = ['', "'", '2'];
const INSPECTION_MS = 15000;
const INSPECTION_DNF_MS = 17000;

export function generateWcaLikeScramble(length = 20) {
    const seq = [];
    let lastFace = null, lastAxis = null;
    while (seq.length < length) {
        const face = FACES[Math.floor(Math.random() * FACES.length)];
        const axis = AXIS_OF[face];
        if (face === lastFace) continue;
        if (axis === lastAxis) continue;
        seq.push(face + MODS[Math.floor(Math.random() * MODS.length)]);
        lastFace = face;
        lastAxis = axis;
    }
    return seq.join(' ');
}

export function formatTime(ms) {
    const totalCs = Math.round(ms / 10);
    const cs = totalCs % 100;
    const totalSec = Math.floor(totalCs / 100);
    const sec = totalSec % 60;
    const min = Math.floor(totalSec / 60);
    const csStr = String(cs).padStart(2, '0');
    const secStr = String(sec).padStart(2, '0');
    return min > 0 ? `${min}:${secStr}.${csStr}` : `${sec}.${csStr}`;
}

export function formatEntryTime(entry) {
    if (entry.penalty === 'DNF') return 'DNF';
    const shown = entry.penalty === '+2' ? entry.time + 2000 : entry.time;
    return formatTime(shown) + (entry.penalty === '+2' ? '+' : '');
}

function effectiveTime(entry) {
    if (entry.penalty === 'DNF') return Infinity;
    return entry.penalty === '+2' ? entry.time + 2000 : entry.time;
}

function loadSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}
function saveSession(times) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(times)); } catch { /* ignore */ }
}
export function loadTimerSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : { inspection: true };
    } catch { return { inspection: true }; }
}
export function saveTimerSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

function average(nums) { return nums.reduce((a, b) => a + b, 0) / nums.length; }

function trimmedAverage(entries) {
    if (entries.length < 3) return null;
    const values = entries.map(effectiveTime);
    const sorted = values.slice().sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    if (trimmed.filter(v => v === Infinity).length > 0) return Infinity;
    return average(trimmed);
}

export function computeStats(session) {
    if (session.length === 0) return { count: 0 };
    const values = session.map(effectiveTime);
    const finite = values.filter(v => Number.isFinite(v));
    const best = finite.length ? Math.min(...finite) : Infinity;
    const worst = finite.length ? Math.max(...finite) : Infinity;
    const mean = finite.length ? average(finite) : Infinity;
    const last5 = session.slice(-5);
    const last12 = session.slice(-12);
    return {
        count: session.length,
        best, worst, mean,
        current: values[values.length - 1],
        ao5: last5.length === 5 ? trimmedAverage(last5) : null,
        ao12: last12.length === 12 ? trimmedAverage(last12) : null,
    };
}

export function createTimerController({ onStateChange, onTick, onInspectionTick, onRecorded }) {
    let state = 'idle';
    let holdTimer = null;
    let startTime = null;
    let tickInterval = null;
    let inspectionStart = null;
    let inspectionInterval = null;
    let pendingPenalty = null;
    let session = loadSession();
    let settings = loadTimerSettings();
    let currentScramble = generateWcaLikeScramble();
    const HOLD_MS = 350;

    function setState(next) {
        state = next;
        if (onStateChange) onStateChange(state);
    }

    function beginInspectionIfEnabled() {
        if (!settings.inspection) { setState('idle'); return; }
        inspectionStart = performance.now();
        setState('inspecting');
        inspectionInterval = setInterval(() => {
            const elapsed = performance.now() - inspectionStart;
            if (onInspectionTick) onInspectionTick(Math.max(0, INSPECTION_MS - elapsed), elapsed);
        }, 60);
    }

    function stopInspectionTicking() {
        if (inspectionInterval) { clearInterval(inspectionInterval); inspectionInterval = null; }
    }

    function armHold() {
        if (state !== 'idle' && state !== 'inspecting' && state !== 'stopped') return;
        if (state === 'inspecting') {
            const elapsed = performance.now() - inspectionStart;
            pendingPenalty = elapsed > INSPECTION_DNF_MS ? 'DNF' : elapsed > INSPECTION_MS ? '+2' : null;
        } else {
            pendingPenalty = null;
        }
        setState('holding');
        holdTimer = setTimeout(() => setState('ready'), HOLD_MS);
    }

    function cancelOrStop() {
        if (state === 'holding') {
            clearTimeout(holdTimer);
            setState(inspectionStart ? 'inspecting' : 'idle');
        } else if (state === 'ready') {
            setState(inspectionStart ? 'inspecting' : 'idle');
        } else if (state === 'running') {
            const elapsed = performance.now() - startTime;
            clearInterval(tickInterval);
            const entry = {
                time: elapsed, date: new Date().toISOString(), scramble: currentScramble,
                penalty: pendingPenalty,
            };
            session.push(entry);
            saveSession(session);
            setState('stopped');
            currentScramble = generateWcaLikeScramble();
            inspectionStart = null;
            if (onRecorded) onRecorded(entry, computeStats(session));
        }
    }

    function releaseFromReady() {
        if (state !== 'ready') return;
        stopInspectionTicking();
        startTime = performance.now();
        setState('running');
        tickInterval = setInterval(() => {
            if (onTick) onTick(performance.now() - startTime);
        }, 40);
    }

    return {
        onPointerDown() {
            if (state === 'running') { cancelOrStop(); return; }
            armHold();
        },
        onPointerUp() {
            if (state === 'holding') {
                clearTimeout(holdTimer);
                setState(inspectionStart ? 'inspecting' : 'idle');
                return;
            }
            if (state === 'ready') { releaseFromReady(); return; }
            if (state === 'stopped') { beginInspectionIfEnabled(); }
        },
        startInspectionManually() {
            if (state === 'idle') beginInspectionIfEnabled();
        },
        setInspectionEnabled(enabled) {
            settings.inspection = enabled;
            saveTimerSettings(settings);
        },
        isInspectionEnabled: () => settings.inspection,
        deleteEntry(index) {
            session.splice(index, 1);
            saveSession(session);
        },
        clearAll() {
            session = [];
            saveSession(session);
        },
        newScramble() {
            currentScramble = generateWcaLikeScramble();
            return currentScramble;
        },
        getScramble: () => currentScramble,
        getSession: () => session,
        getState: () => state,
    };
}
