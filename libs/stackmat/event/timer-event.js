const stringEventType = (arr) => arr;
const types = stringEventType([
    'packetReceived',
    'timerConnected',
    'timerDisconnected',
    'started',
    'stopped',
    'reset',
    'ready',
    'unready',
    'starting',
    'leftHandDown',
    'leftHandUp',
    'rightHandDown',
    'rightHandUp',
]);
export const isEvent = (x) => typeof x === 'string' && types.includes(x);
