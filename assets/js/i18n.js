// --- Minimal bilingual (EN/FA) support with automatic RTL layout ---

const translations = {
    en: {
        scramble: 'Scramble',
        solve: 'Solve',
        settings: 'Settings',
        historyTitle: 'Time History',
        settingsTitle: 'Settings',
        settingsIntro: 'Choose the colors for the solved faces:',
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
        toggleLanguage: 'Switch language',
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
    },
    fa: {
        scramble: 'به‌هم‌ریختن',
        solve: 'حل کن',
        settings: 'تنظیمات',
        historyTitle: 'تاریخچه زمان‌ها',
        settingsTitle: 'تنظیمات',
        settingsIntro: 'رنگ هر وجه در حالت حل‌شده را انتخاب کنید:',
        exportSettings: 'خروجی تنظیمات', importSettings: 'ورودی تنظیمات',
        settingsExported: 'فایل تنظیمات دانلود شد!',
        settingsImported: 'تنظیمات وارد شد — در حال بارگذاری دوباره...',
        settingsImportFailed: 'این فایل خوانده نشد — لطفاً یک فایل خروجیِ معتبر انتخاب کنید.',
        noHistory: 'هنوز تاریخچه‌ای ثبت نشده.',
        historyEntry: (time, date) => `زمان: ${time} - تاریخ: ${date}`,
        alreadySolved: 'مکعب همین الان حل شده است.',
        solvedByButton: 'حل شد! 🧩',
        solvedByUser: 'تبریک! مکعب را حل کردید! 🎉',
        toggleTheme: 'تغییر تم',
        toggleLanguage: 'تغییر زبان',
        footer: 'ساخته‌شده توسط GeekNeuron',
        faceUp: 'بالا', faceDown: 'پایین', faceFront: 'جلو',
        faceBack: 'پشت', faceLeft: 'چپ', faceRight: 'راست',
        physicalSolver: 'حل مکعب من', tutorial: 'آموزش',
        physicalSolverTitle: 'حل مکعب فیزیکی من',
        tutorialTitle: 'آموزش مکعب روبیک',
        psIntro: 'یک رنگ را انتخاب کنید، سپس روی هر خانه بزنید تا مثل مکعب واقعی‌تان شود. مرکز هر وجه ثابت است و رنگ آن وجه را تعیین می‌کند.',
        psOrientationCaption: 'پیکان‌ها نشان می‌دهند لبه‌ی بالا و راستِ هر خانه رو به کدام وجه است — هنگام خواندن رنگ‌های مکعب واقعی‌تان این را در نظر بگیرید.',
        psHoldCaption: 'مکعبتان را همیشه همین‌طور نگه دارید (هر رنگی که واقعاً برای شما بالا/جلو است) — این مرجع ثابتی است که شبکه‌ی پایین بر اساس آن رسم شده.',
        psReset: 'شروع دوباره', psSolveBtn: 'حل کن',
        psErrorCenters: 'رنگ مرکز هر وجه باید با بقیه فرق داشته باشد.',
        psErrorCount: (color, count) => `رنگ ${color} در ${count} خانه استفاده شده — باید دقیقاً ۹ بار باشد.`,
        psLoading: 'در حال محاسبه‌ی راه‌حل... ممکن است تا یک دقیقه طول بکشد.',
        psErrorTimeout: 'راه‌حلی پیدا نشد — لطفاً رنگ‌هایی که وارد کردید را دوباره بررسی کنید.',
        psErrorGeneric: 'مشکلی در حل این مکعب پیش آمد. لطفاً رنگ‌ها را چک کنید و دوباره امتحان کنید.',
        psInvalidReason_unmatchedEdge: 'ترکیب رنگ یکی از قطعات لبه روی مکعب واقعی وجود ندارد — لطفاً رنگ‌های واردشده را بررسی کنید.',
        psInvalidReason_unmatchedCorner: 'ترکیب رنگ یکی از قطعات گوشه روی مکعب واقعی وجود ندارد — لطفاً رنگ‌های واردشده را بررسی کنید.',
        psInvalidReason_badCornerColors: 'یکی از گوشه‌ها رنگ معتبر مرکز را ندارد — لطفاً رنگ‌های واردشده را بررسی کنید.',
        psInvalidReason_permutationParity: 'این چیدمان دقیق روی مکعب واقعی ممکن نیست (باید جای دو قطعه عوض شود) — احتمالاً یک خانه اشتباه خوانده شده. لطفاً رنگ‌ها را دوباره بررسی کنید.',
        psInvalidReason_edgeOrientation: 'این چیدمان دقیق روی مکعب واقعی ممکن نیست (یک لبه باید در جای خودش بچرخد) — لطفاً رنگ‌ها را دوباره بررسی کنید.',
        psInvalidReason_cornerOrientation: 'این چیدمان دقیق روی مکعب واقعی ممکن نیست (یک گوشه باید در جای خودش بچرخد) — لطفاً رنگ‌ها را دوباره بررسی کنید.',
        psBack: 'بازگشت', psAlreadySolved: 'این مکعب همین الان حل شده است!',
        psPlay: 'پخش', psPause: 'مکث', psDone: 'تمام شد! 🎉',
        psJumpHint: 'برای پرش به این‌جا بزنید',
        psCopyMoves: 'کپی لیست حرکات', psCopied: 'در کلیپ‌بورد کپی شد!', psCopyFailed: 'کپی نشد — لطفاً دستی کپی کنید.',
        levelBeginner: 'مبتدی', levelIntermediate: 'متوسط', levelAdvanced: 'پیشرفته',
        lessonMoves: 'شش حرکت پایه (U D R L F B)',
        lessonSexyMove: "«حرکت سکسی» (R U R' U')",
        lessonCross: 'ساختن صلیب اول',
        lessonF2L: 'جاگذاری یک جفت لایه‌ی اول و دوم',
        lessonF2LExample: 'F2L: یک نمونه‌ی واقعیِ تأییدشده',
        lessonOllEdges: 'جهت‌دهی لبه‌های لایه‌ی آخر',
        lessonSune: 'الگوریتم Sune (جهت‌دهی گوشه‌ها)',
        lessonAntiSune: 'Anti-Sune (جهت‌دهی گوشه‌ها، آینه‌ای)',
        lessonTPerm: 'T-Perm (جابه‌جایی ۲ گوشه + ۲ لبه)',
        lessonUPerm: 'U-Perm (چرخش ۳ لبه)',
        lessonYPerm: 'Y-Perm (جابه‌جایی ۲ گوشه‌ی مورب)',
        lessonAPerm: 'A-Perm (جابه‌جایی ۲ گوشه‌ی مجاور)',
        lessonJPerm: 'J-Perm (جابه‌جایی گوشه و لبه)',
        lessonUbPerm: 'Ub-Perm (چرخش ۳ لبه، آینه‌ای)',
        lessonFPerm: 'F-Perm (جابه‌جایی گوشه و لبه)',
        lessonVPerm: 'V-Perm (جابه‌جایی مورب)',
        tutTabCourse: 'دوره‌ی آموزشی', tutTabReference: 'مرجع الگوریتم‌ها',
        tutCheckProgress: 'مکعبم را بررسی کن', tutCheckPass: '✅ درست به نظر می‌رسد — برو مرحله‌ی بعد!', tutCheckFail: '❌ هنوز روی مکعب شما درست نیست.',
        tutPrevStep: '◀ قبلی', tutNextStep: 'بعدی ▶',
        courseNotationTitle: '۱. نشانه‌گذاری حرکات — شش حرکت پایه',
        courseNotationBody: 'هر حرکت با نام وجهی که می‌چرخانید شناخته می‌شود: U (بالا)، D (پایین)، R (راست)، L (چپ)، F (جلو)، B (پشت). حرف تنها یعنی چرخش ۹۰ درجه ساعت‌گرد (وقتی مستقیم به آن وجه نگاه می‌کنید)؛ حرف با علامت \' یعنی پادساعت‌گرد؛ حرف با عدد ۲ یعنی چرخش ۱۸۰ درجه. نمایش زیر را ببینید، بعد خودتان هر وجه را روی مکعب بالا امتحان کنید.',
        courseCrossTitle: '۲. صلیب',
        courseCrossBody: 'یک رنگ وجه (مثلاً سفید) را انتخاب کنید و ۴ قطعه‌ی لبه‌ی آن را طوری بچینید که هم روی آن وجه باشند هم با رنگ مرکز وجه‌ی کناری‌شان هم‌خوانی داشته باشند — یک شکل «+» که تا انتها (نه فقط از بالا) درست است. این مرحله الگوریتم ثابتی ندارد؛ بیشتر جاگذاری شهودی قطعه‌به‌قطعه است و با تمرین، برنامه‌ریزی از قبل آن خیلی سریع‌تر می‌شود.',
        courseCornersTitle: '۳. گوشه‌های لایه‌ی اول',
        courseCornersBody: 'با صلیب آماده، حالا ۴ گوشه‌ی همان لایه را جا بیندازید. یک ترفند ساده: گوشه‌ی هدف را به لایه‌ی پایین، درست زیر جای خودش ببرید، سپس "R U R\' U\'" (با وجه‌ی مجاور آن گوشه) را تکرار کنید تا درست جا بیفتد. برای هر ۴ گوشه تکرار کنید — لایه‌ی اول شما حل شد.',
        courseF2lTitle: '۴. لایه‌ی دوم (F2L)',
        courseF2lBody: 'حالا ۴ لبه‌ی لایه‌ی میانی را جا بیندازید (آن‌هایی که اصلاً رنگ لایه‌ی اول ندارند). یکی را که در لایه‌ی بالا نشسته پیدا کنید، با چرخاندن U آن را بالای جای خودش تنظیم کنید، سپس با یک الگوی کوتاه مثل "U R U\' R\'" (یا آینه‌اش سمت چپ) بدون خراب‌کردن بقیه جایش بیندازید. حل‌کننده‌های سریع‌تر گوشه و لبه را با هم می‌اندازند که به آن F2L می‌گویند.',
        courseOllTitle: '۵. جهت‌دهی لایه‌ی آخر (OLL)',
        courseOllBody: 'مکعب را برگردانید تا لایه‌های حل‌شده پایین باشند. حالا وجه‌ی بالا را یک‌رنگ کنید، فعلاً بدون توجه به رنگ‌های کناری. روش ساده‌ی «دو-نگاهی»: اول ۴ لبه را با الگویی مثل "F R U R\' U\' F\'" درست کنید (شاید یک یا دو بار با چرخش U بین آن‌ها لازم باشد)، بعد گوشه‌ها را با Sune / Anti-Sune درست کنید تا کل بالا یک‌رنگ شود.',
        coursePllTitle: '۶. چیدمان لایه‌ی آخر (PLL)',
        coursePllBody: 'بالا یک‌رنگ است ولی رنگ‌های کناری آن لایه ممکن است هنوز درهم باشند. حالا قطعات را بدون به‌هم‌زدن جهتشان جابه‌جا کنید — با الگوهایی مثل خانواده‌ی T-Perm/U-Perm/Y-Perm در تب مرجع. در پایان با یک چرخش U همه‌چیز را ردیف کنید (به آن AUF می‌گویند) — و مکعب حل شد!',
        tutLoop: 'تکرار',
        tutSuggestSolved: '🎉 مکعب شما حل به نظر می‌رسد! هر الگوریتمی را برای تمرین انتخاب کنید.',
        tutSuggestCross: 'به نظر می‌رسد صلیب هنوز حل نشده — از این‌جا شروع کنید 👇',
        tutSuggestF2l: 'عالی، صلیب حل شد! بعدی: جفت لایه‌ی اول و دوم 👇',
        tutSuggestOll: 'دو لایه‌ی اول کامل به نظر می‌رسد! بعدی: جهت‌دهی لایه‌ی آخر 👇',
        tutSuggestPll: 'لایه‌ی آخر جهت‌دهی شده! حالا یک الگوریتم چیدمان (PLL) تمرین کنید 👇',
        speedTimer: 'تایمر سرعت', speedTimerTitle: 'تایمر سرعت',
        stHint: 'برای آماده‌شدن نگه دارید، رها کنید تا شروع شود، برای توقف بزنید',
        stUseInspection: 'استفاده از ۱۵ ثانیه بازرسی WCA (+۲ / DNF)',
        stNewScramble: 'اسکرمبل جدید', stClearAll: 'پاک‌کردن همه',
        stClearConfirm: 'همه‌ی زمان‌های ثبت‌شده پاک شوند؟ این کار قابل بازگشت نیست.',
        stNoSolvesYet: 'هنوز حلی ثبت نشده — تایمر را نگه دارید تا شروع شود!',
        stBest: 'بهترین', stMean: 'میانگین', stCount: 'تعداد حل', stDeleteSolve: 'حذف این زمان',
    }
};

let currentLang = 'en';

export function getLang() {
    return currentLang;
}

export function t(key, ...args) {
    const entry = (translations[currentLang] || translations.en)[key];
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

export function setLang(lang) {
    currentLang = translations[lang] ? lang : 'en';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', currentLang);
    applyStaticTranslations();
}

export function initLanguage() {
    const saved = localStorage.getItem('lang');
    const browserLang = (navigator.language || 'en').slice(0, 2);
    setLang(saved || (browserLang === 'fa' ? 'fa' : 'en'));

    const langSwitcher = document.getElementById('lang-switcher');
    if (langSwitcher) {
        langSwitcher.addEventListener('click', () => {
            setLang(currentLang === 'en' ? 'fa' : 'en');
        });
    }
}
