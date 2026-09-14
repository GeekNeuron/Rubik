import { PacketInvalid, PacketStatus } from '../packet/packet.js';
import { isEvent } from './timer-event.js';
export class TimerEventManager {
    constructor() {
        this.lastPacketRunning = false;
        this.lastPacketReset = false;
        this.handlers = new Map();
        this.connected = false;
        this.lastPacketReceived = 0;
        this.connectionTimout = 1000;
        setInterval(() => {
            if (this.connected && this.lastPacketReceived + this.connectionTimout < Date.now()) {
                this.connected = false;
                this.fire('timerDisconnected', this.lastPacket || new PacketInvalid());
            }
            else if (!this.connected && this.lastPacketReceived + this.connectionTimout > Date.now()) {
                this.connected = true;
                this.fire('timerConnected', this.lastPacket || new PacketInvalid());
            }
        }, 100, this);
    }
    on(event, callback) {
        if (isEvent(event)) {
            const handlers = this.handlers.get(event) || [];
            handlers.push(callback);
            this.handlers.set(event, handlers);
        }
    }
    off(event) {
        if (event && isEvent(event) && this.handlers.has(event)) {
            this.handlers.delete(event);
        }
        else if (!event) {
            this.handlers.clear();
        }
    }
    receivePacket(packet) {
        this.lastPacketReceived = Date.now();
        this.fire('packetReceived', packet);
        if (this.lastPacket) {
            if (this.lastPacket.isLeftHandDown && !packet.isLeftHandDown) {
                this.fire('leftHandUp', packet);
            }
            else if (!this.lastPacket.isLeftHandDown && packet.isLeftHandDown) {
                this.fire('leftHandDown', packet);
            }
            if (this.lastPacket.isRightHandDown && !packet.isRightHandDown) {
                this.fire('rightHandUp', packet);
            }
            else if (!this.lastPacket.isRightHandDown && packet.isRightHandDown) {
                this.fire('rightHandDown', packet);
            }
            if (!this.lastPacket.areBothHandsDown && packet.status === PacketStatus.BOTH_HANDS && this.lastPacket.timeInMilliseconds === 0) {
                this.fire('ready', packet);
            }
            if (this.lastPacket.status === PacketStatus.BOTH_HANDS && !packet.areBothHandsDown && packet.status !== PacketStatus.RUNNING && packet.timeInMilliseconds === 0) {
                this.fire('unready', packet);
            }
            if (this.lastPacket.status === PacketStatus.BOTH_HANDS && packet.status === PacketStatus.STARTING) {
                this.fire('starting', packet);
            }
            if (!this.lastPacketRunning && (packet.status === PacketStatus.RUNNING || (this.lastPacket.timeInMilliseconds === 0 && packet.timeInMilliseconds > 0))) {
                this.lastPacketRunning = true;
                this.lastPacketReset = false;
                this.fire('started', packet);
            }
            if (this.lastPacketRunning && (packet.status === PacketStatus.STOPPED || packet.status === PacketStatus.BOTH_HANDS || (this.lastPacket.timeInMilliseconds === packet.timeInMilliseconds && packet.timeInMilliseconds > 0))) {
                this.lastPacketRunning = false;
                this.lastPacketReset = false;
                if (!this.lastPacket.isLeftHandDown && !packet.isLeftHandDown) {
                    this.fire('leftHandDown', packet);
                }
                if (!this.lastPacket.isRightHandDown && !packet.isRightHandDown) {
                    this.fire('rightHandDown', packet);
                }
                this.fire('stopped', packet);
                if (!this.lastPacket.isLeftHandDown && !packet.isLeftHandDown) {
                    this.fire('leftHandUp', packet);
                }
                if (!this.lastPacket.isRightHandDown && !packet.isRightHandDown) {
                    this.fire('rightHandUp', packet);
                }
            }
            if (!this.lastPacketReset && packet.status === PacketStatus.IDLE) {
                this.lastPacketRunning = false;
                this.lastPacketReset = true;
                this.fire('reset', packet);
            }
        }
        this.lastPacket = packet;
    }
    fire(event, packet) {
        for (const handler of this.handlers.get(event) || []) {
            handler(packet);
        }
    }
}
