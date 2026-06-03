const INTEGER_REGEX = /^-?([0-9]|[1-9][0-9]+)$/;

function isInt(length: 8 | 16 | 32, stringValue: string) {
    if (!INTEGER_REGEX.test(stringValue)) {
        return false;
    }

    const value = Number(stringValue);
    return !Number.isNaN(value) && value >= -(2 ** length / 2) && value < 2 ** length / 2;
}

function isInt64(stringValue: string) {
    if (!INTEGER_REGEX.test(stringValue)) {
        return false;
    }

    const value = BigInt(stringValue);
    const total = BigInt(2) ** BigInt(64);
    const min = -(total / BigInt(2));
    const max = total / BigInt(2);

    return value >= min && value < max;
}

function isUInt(length: 8 | 16 | 32, stringValue: string) {
    if (!INTEGER_REGEX.test(stringValue)) {
        return false;
    }

    const value = Number(stringValue);
    return !Number.isNaN(value) && value >= 0 && value < 2 ** length;
}

function isUInt64(stringValue: string) {
    if (!INTEGER_REGEX.test(stringValue)) {
        return false;
    }

    const value = BigInt(stringValue);
    const min = BigInt(0);
    const max = BigInt(2) ** BigInt(64);

    return value >= min && value < max;
}

function isDate32(stringValue: string) {
    const dateRegex = /^-?\d{4,6}-(0\d|1[0-2])-([0-2]\d|3[0-1])$/;
    if (!dateRegex.test(stringValue)) {
        return false;
    }

    const yearStr = stringValue.match(/-?\d{4,6}/)?.[0];
    if (!yearStr) {
        return false;
    }

    const year = parseInt(yearStr, 10);

    return year >= -144169 && year <= 148107;
}

function isDatetime64(stringValue: string) {
    const datetimeRegex = /^-?\d{4,6}-(0\d|1[0-2])-([0-2]\d|3[0-1])T\d{2}:\d{2}:\d{2}Z$/;
    if (!datetimeRegex.test(stringValue)) {
        return false;
    }

    const yearStr = stringValue.match(/-?\d{4,6}/)?.[0];
    if (!yearStr) {
        return false;
    }
    const year = parseInt(yearStr, 10);

    return year >= -144169 && year <= 148107;
}

function isTimestamp64(stringValue: string) {
    const timestampRegex = /^-?\d{4,6}-(0\d|1[0-2])-([0-2]\d|3[0-1])T\d{2}:\d{2}:\d{2}\.\d{1,6}Z$/;
    if (!timestampRegex.test(stringValue)) {
        return false;
    }

    const yearStr = stringValue.match(/-?\d{4,6}/)?.[0];
    if (!yearStr) {
        return false;
    }
    const year = parseInt(yearStr, 10);

    return year >= -144169 && year <= 148107;
}

export function isValueForTypeValid(value: string, type: string) {
    switch (type) {
        case 'Bool':
            return /^(true|false)$/i.test(value);
        case 'Int8':
            return isInt(8, value);
        case 'Int16':
            return isInt(16, value);
        case 'Int32':
            return isInt(32, value);
        case 'Int64':
        case 'Interval':
        case 'Interval64':
            return isInt64(value);
        case 'Uint8':
            return isUInt(8, value);
        case 'Uint16':
            return isUInt(16, value);
        case 'Uint32':
            return isUInt(32, value);
        case 'Uint64':
            return isUInt64(value);
        case 'Uuid':
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                value,
            );
        case 'Float':
        case 'Double':
        case 'Decimal(22,9)':
            return /^-?\d+(\.\d+)?$/.test(value);

        case 'Date':
            return /^\d{4}-(0\d|1[0-2])-([0-2]\d|3[0-1])$/.test(value);
        case 'Date32':
            return isDate32(value);
        case 'Datetime':
            return /^\d{4}-(0\d|1[0-2])-([0-2]\d|3[0-1])T\d{2}:\d{2}:\d{2}Z$/.test(value);
        case 'Datetime64':
            return isDatetime64(value);
        case 'Timestamp':
            return /^\d{4}-(0\d|1[0-2])-([0-2]\d|3[0-1])T\d{2}:\d{2}:\d{2}\.\d{1,6}Z$/.test(value);
        case 'Timestamp64':
            return isTimestamp64(value);
        case 'Json':
        case 'JsonDocument':
            try {
                JSON.parse(value);
                return true;
            } catch {
                return false;
            }
        default:
            return true;
    }
}
