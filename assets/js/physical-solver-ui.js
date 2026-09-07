import { solveFacelets, netToFaceletString, validateNetColors, standardSequenceToEngineMoves, NET_FACE_ORDER } from './physical-solver.js';
import { verifyPhysicalCube } from './cube-validator.js';
import { setupForPlayback, createMovePlayer, previewFace, resetPreviewRotation } from './cube.js';
import { getCamera } from './three-scene.js';
import { t } from './i18n.js';
import { showToast } from './ui-handler.js';
import { buildOrientationGuideSvg, buildHoldReferenceSvg } from './orientation-svg.js';

const PALETTE = [
    { key: 'W', css: '#FFFFFF' }, { key: 'Y', css: '#FFD500' },
    { key: 'G', css: '#009E60' }, { key: 'B', css: '#0051BA' },
    { key: 'R', css: '#C41E3A' }, { key: 'O', css: '#FF5800' },
];

// Sensible defaults so the grid isn't empty on open (standard Western color
// scheme) - the user overwrites these to match their real cube.
const DEFAULT_FACE_COLOR = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };

let netColors = null;
let activeColor = 'W';
let scene = null;
let player = null;

const STORAGE_KEY = 'physicalCubeNetColors';

function freshNet() {
    const net = {};
    NET_FACE_ORDER.forEach(face => {
        net[face] = new Array(9).fill(DEFAULT_FACE_COLOR[face]);
    });
    return net;
}

function loadSavedNet() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const ok = NET_FACE_ORDER.every(f => Array.isArray(parsed[f]) && parsed[f].length === 9);
        return ok ? parsed : null;
    } catch { return null; }
}

function saveNet() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(netColors)); } catch { /* ignore quota errors */ }
}

export function initPhysicalSolver(threeScene) {
    scene = threeScene;
    netColors = loadSavedNet() || freshNet();

    const openBtn = document.getElementById('physical-solver-btn');
    const modal = document.getElementById('physical-solver-modal');
    if (!openBtn || !modal) return;

    openBtn.addEventListener('click', () => {
        renderInputView();
        modal.classList.add('show');
    });

    modal.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', () => resetPreviewRotation(scene));
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) resetPreviewRotation(scene);
    });
}

function renderInputView() {
    const body = document.getElementById('physical-solver-body');
    if (!body) return;
    body.innerHTML = '';

    const intro = document.createElement('p');
    intro.className = 'ps-intro';
    intro.textContent = t('psIntro');
    body.appendChild(intro);

    const holdCaption = document.createElement('p');
    holdCaption.className = 'ps-orientation-caption';
    holdCaption.textContent = t('psHoldCaption');
    body.appendChild(holdCaption);

    const orientationWrap = document.createElement('div');
    orientationWrap.className = 'ps-orientation-wrap';
    orientationWrap.innerHTML = buildHoldReferenceSvg() + buildOrientationGuideSvg();
    body.appendChild(orientationWrap);

    const orientationCaption = document.createElement('p');
    orientationCaption.className = 'ps-orientation-caption';
    orientationCaption.textContent = t('psOrientationCaption');
    body.appendChild(orientationCaption);

    // Palette
    const palette = document.createElement('div');
    palette.className = 'ps-palette';
    PALETTE.forEach(({ key, css }) => {
        const swatch = document.createElement('button');
        swatch.className = 'ps-swatch' + (key === activeColor ? ' active' : '');
        swatch.style.background = css;
        swatch.setAttribute('aria-label', key);
        swatch.addEventListener('click', () => {
            activeColor = key;
            palette.querySelectorAll('.ps-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });
        palette.appendChild(swatch);
    });
    body.appendChild(palette);

    // Net (cross layout: U on top, L F R B in a row, D on bottom)
    const net = document.createElement('div');
    net.className = 'ps-net';
    const layout = [
        [null, 'U', null, null],
        ['L', 'F', 'R', 'B'],
        [null, 'D', null, null],
    ];
    layout.forEach(row => {
        row.forEach(face => {
            if (!face) {
                const spacer = document.createElement('div');
                spacer.className = 'ps-spacer';
                net.appendChild(spacer);
                return;
            }
            net.appendChild(buildFaceBlock(face));
        });
    });
    body.appendChild(net);

    const status = document.createElement('p');
    status.className = 'ps-status';
    status.id = 'ps-status';
    body.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'ps-actions';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.textContent = t('psReset');
    resetBtn.addEventListener('click', () => { netColors = freshNet(); saveNet(); renderInputView(); });
    const solveBtn = document.createElement('button');
    solveBtn.className = 'btn';
    solveBtn.id = 'ps-solve-btn';
    solveBtn.textContent = t('psSolveBtn');
    solveBtn.addEventListener('click', onSolveClicked);
    actions.append(resetBtn, solveBtn);
    body.appendChild(actions);

    updateStatus();
}

function buildFaceBlock(face) {
    const block = document.createElement('div');
    block.className = 'ps-face';
    const camera = getCamera();
    block.addEventListener('pointerenter', () => previewFace(face, scene, camera));
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('button');
        cell.className = 'ps-cell';
        if (i === 4) cell.classList.add('ps-center');
        cell.style.background = PALETTE.find(p => p.key === netColors[face][i]).css;
        cell.addEventListener('click', () => {
            previewFace(face, scene, camera);
            netColors[face][i] = activeColor;
            cell.style.background = PALETTE.find(p => p.key === activeColor).css;
            updateStatus();
            saveNet();
        });
        block.appendChild(cell);
    }
    return block;
}

function updateStatus() {
    const status = document.getElementById('ps-status');
    const solveBtn = document.getElementById('ps-solve-btn');
    if (!status || !solveBtn) return;
    const result = validateNetColors(netColors);
    if (result.valid) {
        status.textContent = '';
        solveBtn.disabled = false;
    } else if (result.reason === 'centers') {
        status.textContent = t('psErrorCenters');
        solveBtn.disabled = true;
    } else if (result.reason === 'colorCount') {
        status.textContent = t('psErrorCount', result.color, result.count);
        solveBtn.disabled = true;
    } else {
        status.textContent = '';
        solveBtn.disabled = true;
    }
}

async function onSolveClicked() {
    const body = document.getElementById('physical-solver-body');

    const faceletString = netToFaceletString(netColors);
    const physicalCheck = verifyPhysicalCube(faceletString);
    if (!physicalCheck.valid) {
        body.innerHTML = '';
        const msg = document.createElement('p');
        msg.className = 'ps-status';
        msg.textContent = t('psInvalidReason_' + physicalCheck.reason) || t('psErrorGeneric');
        body.appendChild(msg);
        const backBtn = document.createElement('button');
        backBtn.className = 'btn';
        backBtn.textContent = t('psBack');
        backBtn.addEventListener('click', renderInputView);
        body.appendChild(backBtn);
        return;
    }

    body.innerHTML = `<p class="ps-loading">${t('psLoading')}</p>`;
    try {
        const standardMoves = await solveFacelets(faceletString);
        const engineMoves = standardSequenceToEngineMoves(standardMoves);
        renderPlaybackView(standardMoves, engineMoves);
    } catch (err) {
        body.innerHTML = '';
        const msg = document.createElement('p');
        msg.className = 'ps-status';
        msg.textContent = err.message === 'timeout' ? t('psErrorTimeout') : t('psErrorGeneric');
        body.appendChild(msg);
        const backBtn = document.createElement('button');
        backBtn.className = 'btn';
        backBtn.textContent = t('psBack');
        backBtn.addEventListener('click', renderInputView);
        body.appendChild(backBtn);
    }
}

function renderPlaybackView(standardMoves, engineMoves) {
    const body = document.getElementById('physical-solver-body');
    body.innerHTML = '';

    if (standardMoves.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'ps-status';
        msg.textContent = t('psAlreadySolved');
        body.appendChild(msg);
        return;
    }

    const startState = setupForPlayback(engineMoves, scene);
    player = createMovePlayer(engineMoves, scene, { speedMs: 1200, startState });

    // Each standard-notation token (e.g. "U2") can expand into more than one
    // internal engine move - build a lookup from engine-move index to which
    // token it belongs to, so the move list highlights the right one and
    // can jump straight to any token's boundary (acts as a scrub bar).
    const tokenForEngineIndex = [];
    standardMoves.forEach((mv, tokenIdx) => {
        const count = mv.includes('2') ? 2 : 1;
        for (let i = 0; i < count; i++) tokenForEngineIndex.push(tokenIdx);
    });
    const engineIndexAfterToken = standardMoves.map((_, tokenIdx) => tokenForEngineIndex.lastIndexOf(tokenIdx) + 1);

    const moveList = document.createElement('div');
    moveList.className = 'ps-move-list';
    standardMoves.forEach((mv, i) => {
        const span = document.createElement('span');
        span.className = 'ps-move';
        span.dataset.index = i;
        span.textContent = mv;
        span.title = t('psJumpHint');
        span.addEventListener('click', () => player.jumpTo(engineIndexAfterToken[i]));
        moveList.appendChild(span);
    });
    body.appendChild(moveList);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn ps-copy-btn';
    copyBtn.textContent = t('psCopyMoves');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(standardMoves.join(' '));
            showToast(t('psCopied'));
        } catch {
            showToast(t('psCopyFailed'));
        }
    });
    body.appendChild(copyBtn);

    const controls = document.createElement('div');
    controls.className = 'ps-playback-controls';
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn';
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', () => player.prev());
    const playBtn = document.createElement('button');
    playBtn.className = 'btn';
    playBtn.id = 'ps-play-btn';
    playBtn.textContent = t('psPlay');
    playBtn.addEventListener('click', () => {
        if (player.isPlaying) player.pause(); else player.play();
    });
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn';
    nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', () => player.next());
    controls.append(prevBtn, playBtn, nextBtn);
    body.appendChild(controls);

    const progress = document.createElement('p');
    progress.className = 'ps-progress';
    progress.id = 'ps-progress';
    body.appendChild(progress);

    player.onStep(({ index, total, playing }) => {
        moveList.querySelectorAll('.ps-move').forEach(el => el.classList.remove('current', 'done'));
        // How many FULL tokens have completed: index counts finished engine
        // moves, so a token is "done" once its last engine move is passed.
        let doneTokens = 0;
        while (doneTokens < standardMoves.length && tokenForEngineIndex.lastIndexOf(doneTokens) < index) doneTokens++;
        for (let i = 0; i < doneTokens; i++) moveList.children[i].classList.add('done');
        if (doneTokens < standardMoves.length) moveList.children[doneTokens].classList.add('current');
        progress.textContent = `${doneTokens} / ${standardMoves.length}`;
        playBtn.textContent = playing ? t('psPause') : t('psPlay');
        if (index >= total) showToast(t('psDone'));
    });
    progress.textContent = `0 / ${standardMoves.length}`;
}
