export function parseJson(value) {
    if (!value) {
        return;
    }
    try {
        return JSON.parse(value);
    } catch (err) {
        console.log(err);
        return value;
    }
}

export function getValueFromLS(key, defaultValue) {
    try {
        return localStorage.getItem(key) ?? defaultValue;
    } catch (err) {
        console.log(err);
    }
    return;
}

const sizes = [' B', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB'];
const base = 1000;

export function bytesToSize(bytes) {
    if (isNaN(bytes)) {
        return '';
    }
    if (bytes < base) return String(bytes);
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(base)));
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

function bytesToMB(bytes) {
    if (isNaN(bytes)) {
        return '';
    }
    const val = bytes / base ** 2;
    if (val < 10) {
        return val.toFixed(2) + sizes[2];
    } else if (val < 100) {
        return val.toFixed(1) + sizes[2];
    } else {
        return val.toFixed() + sizes[2];
    }
}

export function bytesToSpeed(bytes) {
    return `${bytesToMB(bytes)}${bytes ? 'ps' : ''}`;
}

export function bytesToGB(bytes, shouldRound) {
    if (isNaN(bytes)) {
        return 'N/A';
    }
    const val = bytes / 1000000000;
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

export function pad9(val) {
    const len = String(val).length;
    let result = val
    for (let i = len; i < 9; i++) {
        result = "0" + result;
    }
    return result;
}

export function isNumeric(value) {
    // need both isNaN and isNaN(parseFloat):
    // - isNaN treats true/false/''/etc. as numbers, parseFloat fixes this
    // - parseFloat treats '123qwe' as number, isNaN fixes this
    return !isNaN(value) && !isNaN(parseFloat(value));
};
