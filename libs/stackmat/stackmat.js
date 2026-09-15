import { AudioProcessor } from './audio-processor.js';
import { isEvent } from './event/timer-event.js';
import { TimerEventManager } from './event/timer-event-manager.js';
export default class Stackmat {
    constructor() {
        this.eventManager = new TimerEventManager();
    }
    on(event, callback) {
        if (isEvent(event)) {
            this.eventManager.on(event, callback);
            return true;
        }
        else {
            return false;
        }
    }
    off(event) {
        if (event && !isEvent(event)) {
            return false;
        }
        else {
            this.eventManager.off(event);
            return true;
        }
    }
    start() {
        if (this.audioProcessor) {
            this.stop();
        }
        this.audioProcessor = new AudioProcessor(((packet) => this.eventManager.receivePacket(packet)));
        this.audioProcessor.start(); // TODO: handle errors that occur with browser audio API
    }
    stop() {
        if (this.audioProcessor) {
            this.audioProcessor.stop();
            this.audioProcessor = undefined;
        }
    }
}
