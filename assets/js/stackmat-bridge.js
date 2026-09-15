// Thin wrapper around the vendored StackMat library (libs/stackmat, MIT -
// see libs/stackmat-LICENSE.txt) for the "serious competitor" workflow:
// reading a real physical StackMat/SpeedStacks timer through the
// microphone jack instead of tapping the screen. Isolated in its own
// module so the (fairly heavy) audio pipeline is only ever imported when
// someone actually opts into it, and so permission/hardware errors are
// handled in one place instead of leaking into the timer UI code.

let StackmatCtor = null;

export function isStackmatSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
        (window.AudioContext || window.webkitAudioContext));
}

/**
 * Starts listening for a StackMat timer on the default microphone input.
 * Returns a controller with `stop()` plus the usual Stackmat `on/off`
 * event subscription (see libs/stackmat for the full event list: this
 * app cares mainly about `timerConnected`, `timerDisconnected`, `ready`,
 * `started` and `stopped`).
 *
 * onFatalError is called (instead of throwing) if the microphone can't be
 * opened at all - permission denied, no input device, insecure context,
 * etc. - so the caller can show a friendly message and fall back to the
 * manual timer.
 */
export async function startStackmatListening(onFatalError) {
    if (!isStackmatSupported()) {
        onFatalError('unsupported');
        return null;
    }
    // The vendored library swallows getUserMedia errors internally (it only
    // console.errors them) instead of rejecting, so we can't detect a
    // permission/hardware failure by awaiting instance.start(). Probe for
    // mic access ourselves first - same constraints the library uses - and
    // immediately release that probe stream; the library then opens its
    // own stream right after, which the browser grants instantly since
    // permission is already settled.
    try {
        const probeStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false },
        });
        probeStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
        onFatalError(err && err.name === 'NotAllowedError' ? 'permission' : 'error');
        return null;
    }
    try {
        if (!StackmatCtor) {
            ({ default: StackmatCtor } = await import('../../libs/stackmat/index.js'));
        }
        const instance = new StackmatCtor();
        instance.start();
        return instance;
    } catch (err) {
        console.error('StackMat init failed:', err);
        onFatalError('error');
        return null;
    }
}

export function stopStackmatListening(instance) {
    if (instance) {
        try { instance.stop(); } catch { /* already stopped */ }
    }
}
