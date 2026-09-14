import { PacketGen3 } from './packet/packet-gen3.js';
import { PacketGen4 } from './packet/packet-gen4.js';
export class SignalDecoder {
    constructor(sampleRate, callback) {
        this.ticksPerBit = sampleRate / 1200;
        this.callback = callback;
    }
    decode(data) {
        // Not using data.map() here because Float32Array.map always returns a Float32Array
        let bits = [];
        for (const signal of data) {
            bits.push(signal <= 0 ? 1 : 0);
        }
        const startIndex = this.findBeginningOfSignal(bits);
        const runLengthEncoded = runLengthEncode(bits.slice(startIndex));
        bits = this.getBitsFromRunLengthEncodedSignal(runLengthEncoded);
        const packet = getPacket(bits.slice(1));
        if (packet.isValid) {
            this.callback(packet);
        }
    }
    findBeginningOfSignal(data) {
        let oneCount = 0;
        let waitingForZero = false;
        for (let i = 0; i < data.length; i++) {
            if (data[i] === 1) {
                oneCount++;
                if (oneCount > (9 * this.ticksPerBit)) {
                    // there's no byte in a package which contains 8 bits of 1
                    // that translates to 9 * ticksPerBit
                    waitingForZero = true;
                }
            }
            else {
                oneCount = 0;
                if (waitingForZero) {
                    return i;
                }
            }
        }
        return undefined;
    }
    getBitsFromRunLengthEncodedSignal(array) {
        const x = array.map((e) => Array(Math.round(e.length / this.ticksPerBit)).fill(e.bit));
        return [].concat(...x);
    }
}
function runLengthEncode(data) {
    let lastBit = -1;
    const result = [];
    for (const bit of data) {
        if (lastBit !== bit) {
            result.push({ bit, length: 1 });
            lastBit = bit;
        }
        else {
            result[result.length - 1].length++;
        }
    }
    return result;
}
function getPacket(data) {
    const tmp = [];
    for (let i = 0; i <= 9; i++) {
        tmp.push(decodeBits(data, i * 10));
    }
    let packet = new PacketGen4(tmp);
    if (packet.isValid) {
        return packet;
    }
    else {
        packet = new PacketGen3(tmp.slice(0, -1));
        return packet;
    }
}
function decodeBits(data, offset) {
    let result = 0;
    for (let i = 0; i < 8; i++) {
        result += data[offset + i] << i;
    }
    return result;
}
