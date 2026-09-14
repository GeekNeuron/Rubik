import { isChecksumValid, isNumberCharCode, isPacketStatusCharCode, PacketAbstract } from './packet.js';
export class PacketGen4 extends PacketAbstract {
    static isValid(rawData) {
        return rawData.length === 10
            && isPacketStatusCharCode(rawData[0])
            && isNumberCharCode(rawData[1])
            && isNumberCharCode(rawData[2])
            && isNumberCharCode(rawData[3])
            && isNumberCharCode(rawData[4])
            && isNumberCharCode(rawData[5])
            && isNumberCharCode(rawData[6])
            && isChecksumValid(rawData[7], rawData.slice(1, 7))
            && rawData[8] === 10
            && rawData[9] === 13;
    }
    constructor(rawData) {
        if (PacketGen4.isValid(rawData)) {
            const status = String.fromCharCode(rawData[0]);
            const stringDigits = rawData.slice(1, 7).map((char) => String.fromCharCode(char));
            const minutes = Number(stringDigits[0]);
            const seconds = Number(stringDigits.slice(1, 3).join(''));
            const thousandths = Number(stringDigits.slice(3).join(''));
            const timeInMilliseconds = (minutes * 60000) + (seconds * 1000) + thousandths;
            super(true, status, stringDigits, timeInMilliseconds);
        }
        else {
            super(false);
        }
    }
}
