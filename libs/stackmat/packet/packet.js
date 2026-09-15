export var PacketStatus;
(function (PacketStatus) {
    PacketStatus["IDLE"] = "I";
    PacketStatus["STARTING"] = "A";
    PacketStatus["RUNNING"] = " ";
    PacketStatus["STOPPED"] = "S";
    PacketStatus["LEFT_HAND"] = "L";
    PacketStatus["RIGHT_HAND"] = "R";
    PacketStatus["BOTH_HANDS"] = "C";
    PacketStatus["INVALID"] = "X";
})(PacketStatus || (PacketStatus = {}));
export function isPacketStatusCharCode(charCode) {
    return 'IA SLRC'.indexOf(String.fromCharCode(charCode)) !== -1;
}
export function isNumberCharCode(charCode) {
    return '0123456789'.indexOf(String.fromCharCode(charCode)) !== -1;
}
export function isChecksumValid(checksum, digitCharCodes) {
    return checksum === digitCharCodes.map((char) => Number(String.fromCharCode(char)))
        .reduce((previousValue, currentValue) => previousValue + currentValue) + 64;
}
export class PacketAbstract {
    constructor(isValid, status, stringDigits, timeInMilliseconds) {
        this.isValid = isValid;
        this.status = status || PacketStatus.INVALID;
        this.stringDigits = stringDigits || [];
        this.timeInMilliseconds = timeInMilliseconds || 0;
    }
    get timeAsString() {
        return this.stringDigits.slice(0, 1)
            + ':' + this.stringDigits.slice(1, 3).join('')
            + '.' + this.stringDigits.slice(3).join('');
    }
    get isLeftHandDown() {
        return this.status === PacketStatus.LEFT_HAND || this.status === PacketStatus.BOTH_HANDS || this.status === PacketStatus.STARTING;
    }
    get isRightHandDown() {
        return this.status === PacketStatus.RIGHT_HAND || this.status === PacketStatus.BOTH_HANDS || this.status === PacketStatus.STARTING;
    }
    get areBothHandsDown() {
        return this.status === PacketStatus.BOTH_HANDS || this.status === PacketStatus.STARTING;
    }
}
export class PacketInvalid extends PacketAbstract {
    constructor() {
        super(false);
    }
}
