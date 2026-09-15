// Small persisted preferences shared across modules - kept separate from
// ui-handler.js so cube.js (which needs to read these during every
// animation/scramble) doesn't have to import the whole settings-UI module.

const ANIMATION_SPEED_KEY = 'prefAnimationSpeed';
const SHOW_TICKER_KEY = 'prefShowMoveTicker';
const SCRAMBLE_LENGTH_KEY = 'prefScrambleLength';
const SOUND_ENABLED_KEY = 'prefSoundEnabled';

// Multiplier applied to every animation's base duration - "instant" isn't
// exactly 0 so a turn still registers as one visible frame rather than a
// silent instantaneous jump (helps confirm the click actually landed).
const SPEED_MULTIPLIERS = { slow: 1.6, normal: 1, fast: 0.5, instant: 0.02 };

export function getAnimationSpeed() {
    const stored = localStorage.getItem(ANIMATION_SPEED_KEY);
    return SPEED_MULTIPLIERS[stored] ? stored : 'normal';
}

export function setAnimationSpeed(speed) {
    localStorage.setItem(ANIMATION_SPEED_KEY, SPEED_MULTIPLIERS[speed] ? speed : 'normal');
}

export function getAnimationSpeedMultiplier() {
    return SPEED_MULTIPLIERS[getAnimationSpeed()];
}

export function isMoveTickerVisible() {
    const stored = localStorage.getItem(SHOW_TICKER_KEY);
    return stored === null ? true : stored === '1'; // on by default
}

export function setMoveTickerVisible(visible) {
    localStorage.setItem(SHOW_TICKER_KEY, visible ? '1' : '0');
}

const SCRAMBLE_LENGTH_CHOICES = [15, 20, 25, 30];

export function getScrambleLength() {
    const stored = parseInt(localStorage.getItem(SCRAMBLE_LENGTH_KEY), 10);
    return SCRAMBLE_LENGTH_CHOICES.includes(stored) ? stored : 20;
}

export function setScrambleLength(length) {
    const n = parseInt(length, 10);
    localStorage.setItem(SCRAMBLE_LENGTH_KEY, SCRAMBLE_LENGTH_CHOICES.includes(n) ? n : 20);
}

export function isSoundEnabled() {
    return localStorage.getItem(SOUND_ENABLED_KEY) === '1'; // off by default - opt in
}

export function setSoundEnabled(enabled) {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? '1' : '0');
}
