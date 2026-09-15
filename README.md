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

The "Solve My Physical Cube" solver is original, from-scratch code
(`assets/js/own-solver.js` + `own-solver-engine.js`) rather than a
third-party library - a layer-by-layer solver (cross → F2L → OLL → PLL)
built and tested specifically for this app. The trade-off: solutions run
roughly 70-130 moves rather than an optimal solver's ~20, and a solve can
occasionally take up to ~30 seconds on harder scrambles rather than
milliseconds - both fine for "figure out my physical cube" use.

## ⏱️ Real StackMat timer support (via microphone)

Toggle **"Use a StackMat timer (via microphone)"** inside the Speed Timer to read an actual physical StackMat/SpeedStacks timer through your computer's microphone input (the timer's audio-out jack carries a serial data signal, not audible sound - the same jack cubers have plugged into laptops for this for years). The app decodes that signal directly in the browser via the Web Audio API (no drivers, no Flash/Java) using the vendored `stackmat` library (MIT licensed - see `libs/stackmat-LICENSE.txt`), and drives the same session/stats/history as the manual timer, so times recorded either way sit in one unified list.

- Live connection state and left/right hand indicators, just like the timer's own display.
- WCA-style inspection (if enabled) still runs in software and applies +2/DNF the moment you place both hands, exactly as with the manual timer.
- Clear, friendly messages if the microphone is unsupported, blocked, or unavailable - it never just hangs.
- The microphone is released the instant you turn the toggle off or close the modal, however you close it (button, Escape, or clicking outside).

## 🛠️ How to Run

This project requires no build tools. Simply open the `index.html` file in your browser or publish it to GitHub Pages.
