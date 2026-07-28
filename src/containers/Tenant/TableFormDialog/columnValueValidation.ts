const INTEGER_REGEX = /^-?([0-9]|[1-9][0-9]+)$/;
const DATE_MONTH_PART = '(0[1-9]|1[0-2])';
const DATE_DAY_PART = '(0[1-9]|[12]\\d|3[0-1])';
const DATE_PATTERN = `\\d{4}-${DATE_MONTH_PART}-${DATE_DAY_PART}`;
const DATE32_PATTERN = `-?\\d{4,6}-${DATE_MONTH_PART}-${DATE_DAY_PART}`;
const DATE_REGEX = new RegExp(`^${DATE_PATTERN}$`);
const DATE32_REGEX = new RegExp(`^${DATE32_PATTERN}$`);
const DATETIME_REGEX = new RegExp(`^${DATE_PATTERN}T\\d{2}:\\d{2}:\\d{2}Z$`);
const DATETIME64_REGEX = new RegExp(`^${DATE32_PATTERN}T\\d{2}:\\d{2}:\\d{2}Z$`);
const TIMESTAMP_REGEX = new RegExp(`^${DATE_PATTERN}T\\d{2}:\\d{2}:\\d{2}\\.\\d{1,6}Z$`);
const TIMESTAMP64_REGEX = new RegExp(`^${DATE32_PATTERN}T\\d{2}:\\d{2}:\\d{2}\\.\\d{1,6}Z$`);
const DATE_PARTS_REGEX = /^(-?\d{4,6})-(\d{2})-(\d{2})/;
const TIME_PARTS_REGEX = /T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?Z$/;
const MIN_DATE_YEAR = 1970;
const MAX_DATE_YEAR = 2106;
const MIN_EXTENDED_DATE_YEAR = -144169;
const MAX_EXTENDED_DATE_YEAR = 148107;

interface DateParts {
    year: number;
    month: number;
    day: number;
}

interface TimeParts {
    hour: number;
    minute: number;
    second: number;
}

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

function isLeapYear(year: number) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number) {
    switch (month) {
        case 2:
            return isLeapYear(year) ? 29 : 28;
        case 4:
        case 6:
        case 9:
        case 11:
            return 30;
        default:
            return 31;
    }
}

function getDateParts(stringValue: string): DateParts | undefined {
    const parts = stringValue.match(DATE_PARTS_REGEX);

    if (!parts) {
        return undefined;
    }

    return {
        year: parseInt(parts[1], 10),
        month: parseInt(parts[2], 10),
        day: parseInt(parts[3], 10),
    } satisfies DateParts;
}

function getTimeParts(stringValue: string): TimeParts | undefined {
    const parts = stringValue.match(TIME_PARTS_REGEX);

    if (!parts) {
        return undefined;
    }

    return {
        hour: parseInt(parts[1], 10),
        minute: parseInt(parts[2], 10),
        second: parseInt(parts[3], 10),
    } satisfies TimeParts;
}

function isDatePartsValid({year, month, day}: DateParts) {
    return day <= getDaysInMonth(year, month);
}

function isTimePartsValid({hour, minute, second}: TimeParts) {
    return hour < 24 && minute < 60 && second < 60;
}

function isYearInRange(year: number, min: number, max: number) {
    return year >= min && year <= max;
}

function isDateValueValid(stringValue: string, regex: RegExp, minYear: number, maxYear: number) {
    if (!regex.test(stringValue)) {
        return false;
    }

    const dateParts = getDateParts(stringValue);

    return Boolean(
        dateParts && isYearInRange(dateParts.year, minYear, maxYear) && isDatePartsValid(dateParts),
    );
}

function isDateTimeValueValid(
    stringValue: string,
    regex: RegExp,
    minYear: number,
    maxYear: number,
) {
    if (!regex.test(stringValue)) {
        return false;
    }

    const dateParts = getDateParts(stringValue);
    const timeParts = getTimeParts(stringValue);

    return Boolean(
        dateParts &&
            timeParts &&
            isYearInRange(dateParts.year, minYear, maxYear) &&
            isDatePartsValid(dateParts) &&
            isTimePartsValid(timeParts),
    );
}

function isDate32(stringValue: string) {
    return isDateValueValid(
        stringValue,
        DATE32_REGEX,
        MIN_EXTENDED_DATE_YEAR,
        MAX_EXTENDED_DATE_YEAR,
    );
}

function isDatetime64(stringValue: string) {
    return isDateTimeValueValid(
        stringValue,
        DATETIME64_REGEX,
        MIN_EXTENDED_DATE_YEAR,
        MAX_EXTENDED_DATE_YEAR,
    );
}

function isTimestamp64(stringValue: string) {
    return isDateTimeValueValid(
        stringValue,
        TIMESTAMP64_REGEX,
        MIN_EXTENDED_DATE_YEAR,
        MAX_EXTENDED_DATE_YEAR,
    );
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
            return isDateValueValid(value, DATE_REGEX, MIN_DATE_YEAR, MAX_DATE_YEAR);
        case 'Date32':
            return isDate32(value);
        case 'Datetime':
            return isDateTimeValueValid(value, DATETIME_REGEX, MIN_DATE_YEAR, MAX_DATE_YEAR);
        case 'Datetime64':
            return isDatetime64(value);
        case 'Timestamp':
            return isDateTimeValueValid(value, TIMESTAMP_REGEX, MIN_DATE_YEAR, MAX_DATE_YEAR);
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
