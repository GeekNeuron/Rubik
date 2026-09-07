# 🚀 3D Rubik's Cube

An interactive 3D Rubik's Cube game built with pure JavaScript and the **Three.js** library. This project is self-contained and optimized to run on GitHub Pages.

**Project Link:** [https://geekneuron.github.io/Rubik/](https://geekneuron.github.io/Rubik/)

## ✨ Features

- **Smooth 3D Rendering:** Powered by WebGL and Three.js.
- **Full Camera Control:** Rotate, pan, and zoom with mouse or touch.
- **Light & Dark Themes:** With user preference saved to local storage.
- **English / Persian UI:** Automatic RTL layout switch, saved to local storage.
- **Animated Scramble & Solve:** Scrambling and solving both play out as animated turns; Solve always reverses the full history back to a solved cube, however it got scrambled.
- **Solve My Physical Cube:** Enter your real cube's colors on a flattened net (with an SVG orientation guide, and the 3D cube live-rotating to show whichever face you're editing), and a real Kociemba two-phase solver (running in a Web Worker, so the UI never freezes) computes an actual solution - or tells you clearly which colors look wrong if the arrangement isn't physically possible. Play it back move-by-move (Play/Pause/Prev/Next, or tap any move to jump straight to it) on the 3D cube to follow along on your physical one, and copy the move list or come back later - your entered colors are saved automatically.
- **Tutorial:** A guided step-by-step course (notation → cross → corners → F2L → OLL → PLL, with explanations and a "check my cube" button at each step) plus a 16-algorithm reference library (2-look OLL, a verified real F2L insertion example, and 8 PLL algorithms - T/U/Y/A/J/Ub/F/V perms) demonstrated live on the 3D cube. Opens on whichever course step matches how far your current cube actually is.
- **Speed Timer:** A StackMat-style precision timer for practicing on your physical cube - hold to arm, release to start, tap to stop, centisecond precision, a fresh WCA-style scramble each time (also shown on the 3D cube for reference), optional 15s WCA inspection with +2/DNF penalties, and session stats (best, mean, Ao5, Ao12) saved between visits.
- **Export / Import Settings:** Save your theme, language, custom face colors, and timer history to a file, and load them back on any device.
- **Live Color Customization:** Change the color of each of the six faces and see it applied instantly, no refresh needed.
- **Solve Timer:** Tracks the time it takes to solve the cube.
- **Time History:** Click the timer to view a history of solve times.
- **Responsive Design:** With a distinct, optimized layout for mobile and desktop.

## 🧩 Solve My Physical Cube - how it works

1. Tap **Solve My Cube**, pick a color, and tap each sticker to match your real cube (the center of each face is fixed and defines that face's color).
2. Tap **Solve**. A real Kociemba two-phase algorithm (the `cubejs` library, MIT licensed - see `libs/cubejs-LICENSE.txt`) computes a solution in a background Web Worker, so the app stays responsive even though the first solve needs a ~1.5s one-time initialization.
3. The 3D cube resets to an equivalent scrambled state and the move list appears. Use Play/Pause or step through with the arrow buttons at your own pace while you turn your physical cube to match.

If the colors you entered don't describe a physically valid cube, the solver will report that it couldn't find a solution rather than hanging indefinitely.

## 🩹 Fixed in this revision

- **Solve button now actually solves the cube.** Previously, scramble moves were never recorded to history and manual-move recording stopped after the first move, so Solve almost never returned the cube to a solved state. It now records every move since the last solve and reverses all of it.
- **Live color settings** now recolor the cube immediately instead of showing an alert asking for a refresh.
- Removed the unused `libs/solver.js` (a full cube-solving library that was bundled but never referenced).
- Unified the rotation-angle math so the visual animation and the logical move always agree.
- Buttons are now disabled while an animation is playing, and pop-up `alert()`s were replaced with non-blocking toast notifications.
- Basic accessibility: `aria-label`/`role` on modals and icon buttons, Escape closes modals.

## 🛠️ How to Run

This project requires no build tools. Simply open the `index.html` file in your browser or publish it to GitHub Pages.
