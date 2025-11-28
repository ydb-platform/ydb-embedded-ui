export function parseJson(value?: string | null) {
    if (!value) {
        return undefined;
    }
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

const sizes = [' B', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB'];
const base = 1000;

export function bytesToSize(bytes: number) {
    if (isNaN(bytes)) {
        return '';
    }
    if (bytes < base) {
        return String(bytes);
    }
    let i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(base))), 10);
    if (i >= sizes.length) {
        i = sizes.length - 1;
    }
    let val = bytes / Math.pow(base, i);
    if (val > 999) {
        val = val / base;
        i++;
    }
    return val.toPrecision(3) + sizes[i];
}

export function bytesToMB(bytes?: number | string, fractionDigits?: number) {
    const bytesNumber = Number(bytes);
    if (isNaN(bytesNumber)) {
        return '';
    }

    const val = bytesNumber / base ** 2;

    if (isNumeric(fractionDigits)) {
        const rounded = Number(val.toFixed(fractionDigits));

        return String(rounded) + sizes[2];
    }

    if (val < 10) {
        return val.toFixed(2) + sizes[2];
    } else if (val < 100) {
        return val.toFixed(1) + sizes[2];
    } else {
        return val.toFixed() + sizes[2];
    }
}

export function bytesToSpeed(bytes?: number | string, fractionDigits?: number) {
    const speed = bytesToMB(bytes, fractionDigits);
    return `${speed}${speed ? 'ps' : ''}`;
}

export function bytesToGB(bytes?: number | string, shouldRound?: boolean) {
    const bytesNumber = Number(bytes);
    if (isNaN(bytesNumber)) {
        return 'N/A';
    }
    const val = bytesNumber / 1000000000;
    if (shouldRound) {
        return val.toFixed() + sizes[3];
    }
    if (val < 10) {
        return val.toFixed(2) + sizes[3];
    } else if (val < 100) {
        return val.toFixed(1) + sizes[3];
    } else {
        return val.toFixed() + sizes[3];
    }
}

export function pad9(val: number | string) {
    const stringifiedVal = String(val);
    const len = stringifiedVal.length;
    let result = stringifiedVal;
    for (let i = len; i < 9; i++) {
        result = '0' + result;
    }
    return result;
}

export function isNumeric(value?: unknown): value is number | string {
    if (typeof value === 'number') {
        return !isNaN(value);
    }
    if (typeof value === 'string') {
        // need both isNaN and isNaN(parseFloat):
        // - isNaN treats true/false/''/etc. as numbers, parseFloat fixes this
        // - parseFloat treats '123qwe' as number, isNaN fixes this
        return !isNaN(Number(value)) && !isNaN(parseFloat(value));
    }
    return false;
}

export function toExponential(value: number, precision?: number) {
    return Number(value).toExponential(precision);
}

export const UNBREAKABLE_GAP = '\xa0';

// Numeric values expected, not numeric value should be displayd as 0
export function safeParseNumber(value: unknown, defaultValue = 0): number {
    if (isNumeric(value)) {
        return Number(value);
    }

    return defaultValue;
}
