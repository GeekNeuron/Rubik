// --- UI copy (English only) ---

const translations = {
    en: {
        scramble: 'Scramble',
        solve: 'Solve',
        settings: 'Settings',
        historyTitle: 'Time History',
        settingsTitle: 'Settings',
        settingsIntro: 'Choose the colors for the solved faces:',
        settingsColorsTitle: 'Cube Colors',
        settingsPreferencesTitle: 'Preferences',
        settingsAnimationSpeed: 'Animation speed',
        speedSlow: 'Slower', speedNormal: 'Normal', speedFast: 'Faster', speedInstant: 'Instant',
        settingsScrambleLength: 'Scramble length',
        settingsShowTicker: 'Show live move list in footer',
        settingsSound: 'Move sound effect',
        settingsAccessibilityTitle: 'Accessibility',
        settingsColorblindHint: 'A palette chosen to stay distinguishable for the most common forms of color blindness.',
        useColorblindPalette: 'Use Colorblind-Friendly Colors',
        resetColors: 'Reset to Default Colors',
        settingsBackupTitle: 'Backup',
        exportSettings: 'Export Settings', importSettings: 'Import Settings',
        settingsExported: 'Settings file downloaded!',
        settingsImported: 'Settings imported - reloading...',
        settingsImportFailed: "Couldn't read that file - please pick a valid settings export.",
        noHistory: 'No history yet.',
        historyEntry: (time, date) => `Time: ${time} - Date: ${date}`,
        alreadySolved: 'The cube is already solved.',
        solvedByButton: 'Solved! 🧩',
        solvedByUser: 'Congratulations, you solved the cube! 🎉',
        toggleTheme: 'Toggle theme',
        footer: 'Created by GeekNeuron',
        faceUp: 'Up', faceDown: 'Down', faceFront: 'Front',
        faceBack: 'Back', faceLeft: 'Left', faceRight: 'Right',
        physicalSolver: 'Solve My Cube', tutorial: 'Tutorial',
        physicalSolverTitle: 'Solve My Physical Cube',
        tutorialTitle: 'Cube Tutorial',
        psIntro: 'Pick a color, then tap each sticker to match your real cube. The center of each face is fixed - it defines that face\'s color.',
        psOrientationCaption: 'Arrows show which neighboring face the top and right edge of each block are turned toward - keep that in mind while reading your cube.',
        psHoldCaption: 'Hold your cube like this the whole time (whichever color is actually on top/front for you) - it\'s the fixed reference the grid below is drawn from.',
        psReset: 'Reset', psSolveBtn: 'Solve',
        psErrorCenters: 'Each face needs a different center color.',
        psErrorCount: (color, count) => `Color ${color} is used ${count} times - it should be exactly 9.`,
        psLoading: 'Working out the solution... this can take up to a minute.',
        psErrorTimeout: "Couldn't find a solution - please double check the colors you entered.",
        psErrorGeneric: 'Something went wrong solving that cube. Please check your colors and try again.',
        psInvalidReason_unmatchedEdge: "One of the edge pieces has a color combination that doesn't exist on a real cube - please check the colors you entered.",
        psInvalidReason_unmatchedCorner: "One of the corner pieces has a color combination that doesn't exist on a real cube - please check the colors you entered.",
        psInvalidReason_badCornerColors: 'A corner piece is missing a valid center color - please check the colors you entered.',
        psInvalidReason_permutationParity: "This exact arrangement can't happen on a real cube (two pieces would need to be swapped) - a sticker was likely misread. Please double-check your colors.",
        psInvalidReason_edgeOrientation: "This exact arrangement can't happen on a real cube (an edge piece would need to be flipped in place) - please double-check your colors.",
        psInvalidReason_cornerOrientation: "This exact arrangement can't happen on a real cube (a corner piece would need to be twisted in place) - please double-check your colors.",
        psBack: 'Back', psAlreadySolved: 'This cube is already solved!',
        psPlay: 'Play', psPause: 'Pause', psDone: 'Done! 🎉',
        psJumpHint: 'Tap to jump here',
        psCopyMoves: 'Copy move list', psCopied: 'Copied to clipboard!', psCopyFailed: "Couldn't copy - please copy manually.",
        levelBeginner: 'Beginner', levelIntermediate: 'Intermediate', levelAdvanced: 'Advanced',
        lessonMoves: 'The 6 basic moves (U D R L F B)',
        lessonSexyMove: "The \"sexy move\" (R U R' U')",
        lessonCross: 'Building the first cross',
        lessonF2L: 'Inserting a first-two-layers pair',
        lessonF2LExample: 'F2L: a real verified insertion example',
        lessonOllEdges: 'Orienting the last layer edges',
        lessonSune: 'The Sune algorithm (corner orientation)',
        lessonAntiSune: 'Anti-Sune (corner orientation, mirrored)',
        lessonTPerm: 'T-Perm (swap 2 corners + 2 edges)',
        lessonUPerm: 'U-Perm (cycle 3 edges)',
        lessonYPerm: 'Y-Perm (swap 2 corners, diagonal)',
        lessonAPerm: 'A-Perm (swap 2 adjacent corners)',
        lessonJPerm: 'J-Perm (swap corners + edges)',
        lessonUbPerm: 'Ub-Perm (cycle 3 edges, mirrored)',
        lessonFPerm: 'F-Perm (swap corners + edges)',
        lessonVPerm: 'V-Perm (diagonal swap)',
        tutTabCourse: 'Guided Course', tutTabReference: 'Algorithm Reference',
        tutCheckProgress: 'Check my cube', tutCheckPass: '✅ Looks right - move on!', tutCheckFail: '❌ Not quite there yet on your cube.',
        tutPrevStep: '◀ Prev', tutNextStep: 'Next ▶',
        courseNotationTitle: '1. Notation - the 6 moves',
        courseNotationBody: 'Every move is named after the face you turn: U (up), D (down), R (right), L (left), F (front), B (back). A letter alone means a 90° clockwise turn (looking straight at that face); a letter with \' means counter-clockwise; a letter with 2 means a 180° turn. Watch the demo below, then try turning each face yourself on the cube above.',
        courseCrossTitle: '2. The Cross',
        courseCrossBody: 'Pick one face color (say, white) and get its 4 edge pieces onto that face, each also matching the center color of the side it sits next to - forming a "+" shape, correctly aligned all the way through, not just on top. This step has no fixed algorithm - it is mostly intuitive piece-by-piece placement, and gets much faster with practice as you learn to plan it before you start turning.',
        courseCornersTitle: '3. First-layer corners',
        courseCornersBody: 'With the cross done, place the 4 corners of that same layer. A handy trick: get the target corner into the bottom layer, right underneath where it needs to go, then repeat "R U R\' U\'" (using whichever face is next to that corner) until it pops into place correctly. Repeat for all 4 corners - your first layer is now solved.',
        courseF2lTitle: '4. Second layer (F2L)',
        courseF2lBody: 'Now place the 4 middle-layer edges (the ones with no yellow/white sticker at all). Find one sitting in the top layer, turn U until it lines up above its slot, then use a short trigger like "U R U\' R\'" (or its mirror on the left) to slot it in without disturbing what you already solved. Faster solvers learn to combine this with the previous step and insert corner+edge together - that combined technique is called F2L.',
        courseOllTitle: '5. Orient the last layer (OLL)',
        courseOllBody: 'Flip the cube so your solved layers are on the bottom. Now make the top face a single solid color, ignoring the side stickers for now. The simple ("2-look") way: first fix the 4 edges using an algorithm like "F R U R\' U\' F\'" (you may need it once or twice, rotating U in between), then fix the corners with "Sune" / "Anti-Sune" until the whole top is one color.',
        coursePllTitle: '6. Permute the last layer (PLL)',
        coursePllBody: 'The top is one color, but the side stickers of that layer may still be jumbled. Now swap pieces into their correct spots without disturbing their orientation - using algorithms like the ones in the T-Perm/U-Perm/Y-Perm family from the reference tab. Finish with a U turn to line everything up (called "AUF") - and the cube is solved!',
        tutLoop: 'Loop',
        tutSuggestCross: 'Looks like the cross isn\'t solved yet - start here 👇',
        tutSuggestF2l: 'Nice, the cross is done! Next up: the first-two-layers pair 👇',
        tutSuggestOll: 'First two layers look complete! Next: orient the last layer 👇',
        tutSuggestPll: 'Last layer oriented! Now practice a permutation (PLL) algorithm 👇',
        speedTimer: 'Speed Timer', speedTimerTitle: 'Speed Timer',
        stHint: 'Hold to ready, release to start, tap to stop',
        stUseInspection: 'Use 15s WCA inspection (+2 / DNF)',
        stNewScramble: 'New Scramble', stClearAll: 'Clear All',
        stClearConfirm: 'Delete all recorded times? This cannot be undone.',
        stNoSolvesYet: 'No solves yet - hold the timer to start!',
        stBest: 'Best', stMean: 'Mean', stCount: 'Solves', stDeleteSolve: 'Delete this solve',
        stUseStackmat: 'Use a StackMat timer (via microphone)',
        stStackmatConnected: 'StackMat connected', stStackmatWaiting: 'Listening for a StackMat on the microphone input...',
        stStackmatUnsupported: "This browser can't listen for a StackMat (microphone/audio support is missing).",
        stStackmatPermission: 'Microphone access was denied - allow it in your browser settings to use a StackMat.',
        stStackmatError: "Couldn't access the microphone - please check your audio input and try again.",
        stStackmatHandL: 'Left hand', stStackmatHandR: 'Right hand',
        stStackmatHint: 'Place both hands on the StackMat to get ready',
    },
};

/**
 * Looks up a UI string by key (English only). Kept as a function - rather
 * than inlining strings everywhere - so all copy still lives in one place
 * and every existing data-i18n attribute in the markup keeps working
 * unchanged.
 */
export function t(key, ...args) {
    const entry = translations.en[key];
    if (typeof entry === 'function') return entry(...args);
    return entry !== undefined ? entry : key;
}

function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-title')));
    });
}

/** Applies the (English) UI strings to the page. English-only app - no language switching. */
export function initLanguage() {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    applyStaticTranslations();
}
