import { standardSequenceToEngineMoves } from './physical-solver.js';
import { setupForPlayback, createMovePlayer } from './cube.js';
import { detectProgress } from './cube-state.js';
import { t } from './i18n.js';

// --- Reference algorithm library (each verified beforehand - see project notes) ---
const LESSONS = [
    { level: 'beginner', key: 'lessonMoves', moves: "U D R L F B" },
    { level: 'beginner', key: 'lessonSexyMove', moves: "R U R' U'" },
    { level: 'beginner', key: 'lessonCross', moves: "F D R'" },
    { level: 'intermediate', key: 'lessonF2L', moves: "U R U' R'" },
    { level: 'intermediate', key: 'lessonF2LExample', moves: "F' R2 U2 R2 F U R" },
    { level: 'intermediate', key: 'lessonOllEdges', moves: "F R U R' U' F'" },
    { level: 'intermediate', key: 'lessonSune', moves: "R U R' U R U2 R'" },
    { level: 'intermediate', key: 'lessonAntiSune', moves: "R U2 R' U' R U' R'" },
    { level: 'advanced', key: 'lessonTPerm', moves: "R U R' U' R' F R2 U' R' U' R U R' F'" },
    { level: 'advanced', key: 'lessonUPerm', moves: "R U' R U R U R U' R' U' R2" },
    { level: 'advanced', key: 'lessonYPerm', moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    { level: 'advanced', key: 'lessonAPerm', moves: "R' F R' B2 R F' R' B2 R2" },
    { level: 'advanced', key: 'lessonJPerm', moves: "R U R' F' R U R' U' R' F R2 U' R'" },
    { level: 'advanced', key: 'lessonUbPerm', moves: "R2 U R U R' U' R' U' R' U R'" },
    { level: 'advanced', key: 'lessonFPerm', moves: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
    { level: 'advanced', key: 'lessonVPerm', moves: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
];

// --- Guided course: sequential steps with explanations + progress checks ---
const COURSE_STEPS = [
    { key: 'courseNotation', demo: "U D R L F B", check: null },
    { key: 'courseCross', demo: "F D R'", check: 'cross' },
    { key: 'courseCorners', demo: "R U R' U'", check: null },
    { key: 'courseF2l', demo: "U R U' R'", check: 'f2l' },
    { key: 'courseOll', demo: "F R U R' U' F'", check: 'oll' },
    { key: 'coursePll', demo: "R U' R U R U R U' R' U' R2", check: 'solved' },
];

let scene = null;
let activeTab = 'course';
let courseIndex = 0;

export function initTutorial(threeScene) {
    scene = threeScene;
    const openBtn = document.getElementById('tutorial-btn');
    const modal = document.getElementById('tutorial-modal');
    if (!openBtn || !modal) return;
    openBtn.addEventListener('click', () => {
        activeTab = 'course';
        courseIndex = suggestedStepIndex();
        renderRoot();
        modal.classList.add('show');
    });
}

function suggestedStepIndex() {
    const p = detectProgress();
    if (p.solved) return COURSE_STEPS.length - 1;
    if (p.oll) return 5;
    if (p.f2l) return 4;
    if (p.cross) return 3;
    return 1;
}

function renderRoot() {
    const body = document.getElementById('tutorial-body');
    body.innerHTML = '';

    const tabs = document.createElement('div');
    tabs.className = 'tut-tabs';
    const courseTab = document.createElement('button');
    courseTab.className = 'tut-tab' + (activeTab === 'course' ? ' active' : '');
    courseTab.textContent = t('tutTabCourse');
    courseTab.addEventListener('click', () => { activeTab = 'course'; renderRoot(); });
    const refTab = document.createElement('button');
    refTab.className = 'tut-tab' + (activeTab === 'reference' ? ' active' : '');
    refTab.textContent = t('tutTabReference');
    refTab.addEventListener('click', () => { activeTab = 'reference'; renderRoot(); });
    tabs.append(courseTab, refTab);
    body.appendChild(tabs);

    const content = document.createElement('div');
    content.id = 'tut-content';
    body.appendChild(content);

    if (activeTab === 'course') renderCourseStep(content);
    else renderReferenceList(content);
}

function renderCourseStep(container) {
    container.innerHTML = '';
    const step = COURSE_STEPS[courseIndex];

    const progressLabel = document.createElement('p');
    progressLabel.className = 'tut-step-progress';
    progressLabel.textContent = `${courseIndex + 1} / ${COURSE_STEPS.length}`;
    container.appendChild(progressLabel);

    const title = document.createElement('h3');
    title.textContent = t(step.key + 'Title');
    container.appendChild(title);

    const bodyText = document.createElement('p');
    bodyText.className = 'tut-step-body';
    bodyText.textContent = t(step.key + 'Body');
    container.appendChild(bodyText);

    if (step.demo) {
        const notation = document.createElement('p');
        notation.className = 'tut-notation';
        notation.textContent = step.demo;
        container.appendChild(notation);
        container.appendChild(buildPlaybackControls(step.demo));
    }

    if (step.check) {
        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn tut-check-btn';
        checkBtn.textContent = t('tutCheckProgress');
        const result = document.createElement('p');
        result.className = 'tut-check-result';
        checkBtn.addEventListener('click', () => {
            const p = detectProgress();
            const ok = p[step.check];
            result.textContent = ok ? t('tutCheckPass') : t('tutCheckFail');
            result.classList.toggle('pass', ok);
            result.classList.toggle('fail', !ok);
        });
        container.append(checkBtn, result);
    }

    const nav = document.createElement('div');
    nav.className = 'tut-step-nav';
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn';
    prevBtn.textContent = t('tutPrevStep');
    prevBtn.disabled = courseIndex === 0;
    prevBtn.addEventListener('click', () => { courseIndex--; renderCourseStep(container); });
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn';
    nextBtn.textContent = t('tutNextStep');
    nextBtn.disabled = courseIndex === COURSE_STEPS.length - 1;
    nextBtn.addEventListener('click', () => { courseIndex++; renderCourseStep(container); });
    nav.append(prevBtn, nextBtn);
    container.appendChild(nav);
}

function renderReferenceList(container) {
    container.innerHTML = '';
    ['beginner', 'intermediate', 'advanced'].forEach(level => {
        const heading = document.createElement('h3');
        heading.className = 'tut-level-heading';
        heading.textContent = t(level === 'beginner' ? 'levelBeginner' : level === 'intermediate' ? 'levelIntermediate' : 'levelAdvanced');
        container.appendChild(heading);

        const list = document.createElement('div');
        list.className = 'tut-lesson-list';
        LESSONS.filter(l => l.level === level).forEach(lesson => {
            const row = document.createElement('button');
            row.className = 'tut-lesson-row';
            row.textContent = t(lesson.key);
            row.addEventListener('click', () => renderReferenceDetail(container, lesson));
            list.appendChild(row);
        });
        container.appendChild(list);
    });
}

function renderReferenceDetail(container, lesson) {
    container.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = t(lesson.key);
    container.appendChild(title);
    const notation = document.createElement('p');
    notation.className = 'tut-notation';
    notation.textContent = lesson.moves;
    container.appendChild(notation);
    container.appendChild(buildPlaybackControls(lesson.moves, true));

    const backBtn = document.createElement('button');
    backBtn.className = 'btn';
    backBtn.textContent = t('psBack');
    backBtn.addEventListener('click', () => renderReferenceList(container));
    container.appendChild(backBtn);
}

/** Builds Prev/Play/Next(+Loop) controls that demo `movesStr` from solved.
 * The cube is only reset to the demo's starting position once Play is
 * actually pressed - just viewing a step shouldn't disturb whatever the
 * user's own cube (main scramble, physical-solver state, etc.) was doing. */
function buildPlaybackControls(movesStr, withLoop) {
    const engineMoves = standardSequenceToEngineMoves(movesStr.split(' '));
    let player = null;
    let looping = false;

    const controls = document.createElement('div');
    controls.className = 'ps-playback-controls';
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn';
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', () => { if (player) player.prev(); });
    const playBtn = document.createElement('button');
    playBtn.className = 'btn';
    playBtn.textContent = t('psPlay');
    playBtn.addEventListener('click', () => {
        if (!player) {
            const startState = setupForPlayback(engineMoves, scene);
            player = createMovePlayer(engineMoves, scene, { speedMs: 1100, startState });
            attachStepHandler();
        }
        if (player.isPlaying) player.pause(); else player.play();
    });
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn';
    nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', () => {
        if (!player) {
            const startState = setupForPlayback(engineMoves, scene);
            player = createMovePlayer(engineMoves, scene, { speedMs: 1100, startState });
            attachStepHandler();
        }
        player.next();
    });
    controls.append(prevBtn, playBtn, nextBtn);

    if (withLoop) {
        const loopBtn = document.createElement('button');
        loopBtn.className = 'btn';
        loopBtn.textContent = t('tutLoop');
        loopBtn.addEventListener('click', () => { looping = !looping; loopBtn.classList.toggle('active', looping); });
        controls.appendChild(loopBtn);
    }

    function attachStepHandler() {
        player.onStep(({ index, total, playing }) => {
            playBtn.textContent = playing ? t('psPause') : t('psPlay');
            if (index >= total && looping) {
                const newStart = setupForPlayback(engineMoves, scene);
                player = createMovePlayer(engineMoves, scene, { speedMs: 1100, startState: newStart });
                attachStepHandler();
                player.play();
            }
        });
    }

    return controls;
}
