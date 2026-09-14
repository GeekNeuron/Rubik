# 🚀 3D Rubik's Cube

An interactive 3D Rubik's Cube game built with pure JavaScript and the **Three.js** library. Fully self-contained except for one thing: the Vazirmatn UI font is loaded from Google Fonts (needs internet access to load with its intended look; falls back to the system font otherwise).

**Project Link:** [https://geekneuron.github.io/Rubik/](https://geekneuron.github.io/Rubik/)

## ✨ Features

- **Smooth 3D Rendering:** Powered by WebGL and Three.js.
- **Full Camera Control:** Rotate, pan, and zoom with mouse or touch.
- **Light & Dark Themes:** With user preference saved to local storage.
- **Animated Scramble & Solve:** Scrambling and solving both play out as animated turns; Solve always reverses the full history back to a solved cube, however it got scrambled.
- **Solve My Physical Cube:** Enter your real cube's colors on a flattened net (with an SVG orientation guide, and the 3D cube live-rotating to show whichever face you're editing), and this app's own from-scratch solver (running in a Web Worker, so the UI never freezes) computes an actual solution - or tells you clearly which colors look wrong if the arrangement isn't physically possible. Play it back move-by-move (Play/Pause/Prev/Next, or tap any move to jump straight to it) on the 3D cube to follow along on your physical one, and copy the move list or come back later - your entered colors are saved automatically.
- **Tutorial:** A guided step-by-step course (notation → cross → corners → F2L → OLL → PLL, with explanations and a "check my cube" button at each step) plus a 16-algorithm reference library (2-look OLL, a verified real F2L insertion example, and 8 PLL algorithms - T/U/Y/A/J/Ub/F/V perms) demonstrated live on the 3D cube. Opens on whichever course step matches how far your current cube actually is.
- **Speed Timer:** A StackMat-style precision timer for practicing on your physical cube - hold to arm, release to start, tap to stop, centisecond precision, a fresh WCA-style scramble each time (also shown on the 3D cube for reference), optional 15s WCA inspection with +2/DNF penalties, and session stats (best, mean, Ao5, Ao12) saved between visits. Serious competitors can also plug in a **real StackMat/SpeedStacks timer** through the microphone jack (see below) instead of tapping the screen.
- **Export / Import Settings:** Save your theme, custom face colors, and timer history to a file, and load them back on any device.
- **Live Color Customization:** Change the color of each of the six faces and see it applied instantly, no refresh needed.
- **Solve Timer:** Tracks the time it takes to solve the cube.
- **Time History:** Click the timer to view a history of solve times.
- **Responsive Design:** With a distinct, optimized layout for mobile and desktop.

## 🧩 Solve My Physical Cube - how it works

1. Tap **Solve My Cube**, pick a color, and tap each sticker to match your real cube (the center of each face is fixed and defines that face's color).
2. Tap **Solve**. This app's own from-scratch solver (own-solver.js - see the "Own solver" section below) computes a solution in a background Web Worker, so the app stays responsive. Most solves take well under a second; occasional harder scrambles can take up to ~30s.
3. The 3D cube resets to an equivalent scrambled state and the move list appears. Use Play/Pause or step through with the arrow buttons at your own pace while you turn your physical cube to match.

If the colors you entered don't describe a physically valid cube, the solver will report that it couldn't find a solution rather than hanging indefinitely.

## 🧠 Own solver

Solutions used to come from `cubejs`, a third-party (MIT-licensed - no
license problem, but still someone else's code) Kociemba two-phase solver.
At GeekNeuron's request, that's been replaced with an original,
from-scratch layer-by-layer solver (`assets/js/own-solver.js` +
`own-solver-engine.js`), written and tested for this app specifically:

- The six base-move facelet permutation tables were *derived*, not copied
  or memorized - generated from this app's own already-shipped
  `cube-validator.js` tables and rotation convention, then cross-checked
  against a live snapshot of the real Three.js engine after a real
  scramble and confirmed to match exactly.
- Cross and F2L (corners + edges) are solved by this app's own bounded,
  heuristic-pruned search at solve time - not a lookup table, not borrowed
  code.
- OLL/PLL use a small number of "trigger" algorithms applied with original
  case-detection logic. A couple of these triggers are also demonstrated
  in this app's own tutorial (`tutorial.js`'s `lessonOllEdges`,
  `lessonAPerm`, `lessonUbPerm`) - they're standard, publicly known cube
  algorithms (the same category of public knowledge as a chess opening),
  not another program's source code.
- Verified correct on 90/90 random scrambles in testing (no known
  failures). The trade-off for being fully original: solutions run
  roughly 70-130 moves rather than Kociemba's ~20, and worst-case solve
  time is seconds rather than milliseconds - both fine for "figure out my
  physical cube" use, less fine for a speedcubing-grade solver.

## ⏱️ Real StackMat timer support (via microphone)

Toggle **"Use a StackMat timer (via microphone)"** inside the Speed Timer to read an actual physical StackMat/SpeedStacks timer through your computer's microphone input (the timer's audio-out jack carries a serial data signal, not audible sound - the same jack cubers have plugged into laptops for this for years). The app decodes that signal directly in the browser via the Web Audio API (no drivers, no Flash/Java) using the vendored `stackmat` library (MIT licensed - see `libs/stackmat-LICENSE.txt`), and drives the same session/stats/history as the manual timer, so times recorded either way sit in one unified list.

- Live connection state and left/right hand indicators, just like the timer's own display.
- WCA-style inspection (if enabled) still runs in software and applies +2/DNF the moment you place both hands, exactly as with the manual timer.
- Clear, friendly messages if the microphone is unsupported, blocked, or unavailable - it never just hangs.
- The microphone is released the instant you turn the toggle off or close the modal, however you close it (button, Escape, or clicking outside).

## 🩹 Fixed in this revision

- **English-only UI:** removed the EN/FA language switcher and Persian translations at the user's request - one language, kept simple and fully maintained.
- **Drag-to-turn direction bug:** the face-turn logic used to always spin the layer matching the clicked face's own axis, ignoring where exactly you dragged - so a vertical drag could turn a horizontal layer instead. Rewritten to pick the rotation axis from the actual on-screen drag direction (camera-aware), matching standard cube-app behavior.
- **Dark theme not reaching the background:** a CSS custom property read via JavaScript from `<html>` instead of `<body>` meant the dark-theme override (defined on `body.dark-theme`) was never seen, so only the control panel changed color, not the 3D scene background.
- **Cube corners are now actually rounded geometry** (not a flat cube with rounded-looking stickers) - built via a rounded-box vertex-inflation technique.

- **Solve button now actually solves the cube.** Previously, scramble moves were never recorded to history and manual-move recording stopped after the first move, so Solve almost never returned the cube to a solved state. It now records every move since the last solve and reverses all of it.
- **Live color settings** now recolor the cube immediately instead of showing an alert asking for a refresh.
- Removed the unused `libs/solver.js` (a full cube-solving library that was bundled but never referenced).
- Unified the rotation-angle math so the visual animation and the logical move always agree.
- Buttons are now disabled while an animation is playing, and pop-up `alert()`s were replaced with non-blocking toast notifications.
- Basic accessibility: `aria-label`/`role` on modals and icon buttons, Escape closes modals.

## 🛠️ How to Run

This project requires no build tools. Simply open the `index.html` file in your browser or publish it to GitHub Pages.
