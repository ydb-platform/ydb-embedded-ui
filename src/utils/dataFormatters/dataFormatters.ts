import {dateTimeParse, duration} from '@gravity-ui/date-utils';

import type {TVDiskID, TVSlotId} from '../../types/api/vdisk';
import {formatBytes as formatBytesCustom, getBytesSizeUnit} from '../bytesParsers/formatBytes';
import type {BytesSizes} from '../bytesParsers/formatBytes';
import {HOUR_IN_SECONDS, UNBREAKABLE_GAP} from '../constants';
import {configuredNumeral} from '../numeral';
import {isNumeric} from '../utils';

import {formatValues} from './common';
import {formatNumberWithDigits, getNumberSizeUnit} from './formatNumber';
import type {Digits} from './formatNumber';
import i18n from './i18n';

// Here you can't control displayed size and precision
// If you need more custom format, use formatBytesCustom instead
export const formatBytes = (bytes?: string | number) => {
    if (!isNumeric(bytes)) {
        return '';
    }

    // by agreement, display byte values in decimal scale
    return configuredNumeral(bytes).format('0 b');
};

export const formatBps = (bytes?: string | number) => {
    const formattedBytes = formatBytes(bytes);

    if (!formattedBytes) {
        return '';
    }

    return formattedBytes + '/s';
};

export const stringifyVdiskId = (id?: TVDiskID | TVSlotId) => {
    return id ? Object.values(id).join('-') : '';
};

/**
 * It works well only with positive values,
 * if you want to get negative formatted duration, use some wrapper like getDowntimeFromDateFormatted
 */
export function formatDurationSeconds(seconds: number) {
    if (!isNumeric(seconds)) {
        return undefined;
    }

    // duration.format() doesn't work well with negative values
    // negative value will be displayed like -2d -12:-58:-21
    // so we process positive duration and only then add sign if any
    const sign = seconds < 0 ? '-' : '';
    const d = duration(Math.abs(seconds), 's').rescale();

    let value: string;

    // Do not use just d.days(), since days could be rescaled up to weeks and more
    // So for 7d we will have d.weeks() = 1 and d.days() = 0
    if (Math.floor(d.asDays()) > 0) {
        value = d.format(`d[${i18n('d')}${UNBREAKABLE_GAP}]hh:mm:ss`);
    } else if (d.hours() > 0) {
        value = d.format('h:mm:ss');
    } else if (d.minutes() > 0) {
        value = d.format('m:ss');
    } else {
        value = d.format(`s[${i18n('s')}]`);
    }

    return sign + value;
}

export const formatDurationMs = (ms?: number) => {
    return formatDurationSeconds(Number(ms) / 1000);
};

export function getUptimeFromDateFormatted(dateFrom?: number | string, dateTo?: number | string) {
    let diff = calcTimeDiffInSec(dateFrom, dateTo);

    // Our time and server time could differ a little
    // Prevent wrong negative uptime values
    diff = diff < 0 ? 0 : diff;

    return formatDurationSeconds(diff);
}

export function getDowntimeFromDateFormatted(dateFrom?: number | string, dateTo?: number | string) {
    let diff = calcTimeDiffInSec(dateFrom, dateTo);

    // Our time and server time could differ a little
    // Prevent wrong negative uptime values
    diff = diff < 0 ? 0 : diff;

    return formatDurationSeconds(-diff);
}

function calcTimeDiffInSec(
    dateFrom?: number | string,
    dateTo: number | string = new Date().getTime(),
) {
    const diffMs = Number(dateTo) - Number(dateFrom);

    return diffMs / 1000;
}

export function formatStorageValues(
    value?: number,
    total?: number,
    size?: BytesSizes,
    delimiter?: string,
    withValueLabel?: boolean,
) {
    return formatValues<BytesSizes>(
        formatBytesCustom,
        getBytesSizeUnit,
        value,
        total,
        size,
        delimiter,
        withValueLabel,
    );
}

export function formatNumericValues(
    value?: number,
    total?: number,
    size?: Digits,
    delimiter?: string,
    withValueLabel?: boolean,
) {
    return formatValues<Digits>(
        formatNumberWithDigits,
        getNumberSizeUnit,
        value,
        total,
        size,
        delimiter,
        withValueLabel,
    );
}

export const formatStorageValuesToGb = (value?: number, total?: number) => {
    return formatStorageValues(value, total, 'gb');
};

export const formatStorageValuesToTb = (value?: number, total?: number) => {
    return formatStorageValues(value, total, 'tb');
};

export const formatNumber = (number?: unknown) => {
    if (!isNumeric(number)) {
        return '';
    }

    // "," in format is delimiter sign, not delimiter itself
    return configuredNumeral(number).format('0,0.[00000]');
};

export const formatPercent = (number?: unknown, precision = 2, options?: {fixed?: boolean}) => {
    if (!isNumeric(number)) {
        return '';
    }

    // Round precision for very low numbers (e.g. 2e-27 from backend)
    // Pass as number, not string, to avoid locale decimal separator issues

    // The input is a fraction (e.g. 0.0123), but the output is displayed as percent.
    // Numeral's '%' format multiplies the value by 100.
    // If we round the fraction to `precision` too early, we lose digits that must be visible in the percent view.
    // Example: 0.0123 -> toFixed(2) => 0.01 -> percent => 1% (wrong), expected 1.23%.
    // Therefore we pre-round the fraction with +2 extra decimal digits: fraction decimals = percent decimals + 2

    const numberValue = Number(number);
    const roundedNumber = Number(numberValue.toFixed(precision + 2));

    const zeros = '0'.repeat(precision);
    const format = options?.fixed ? `0.${zeros}%` : `0.[${zeros}]%`;

    return configuredNumeral(roundedNumber).format(format);
};

export const formatSecondsToHours = (seconds: number) => {
    const hours = (seconds / HOUR_IN_SECONDS).toFixed(2);
    return `${formatNumber(hours)} hours`;
};

export const roundToPrecision = (value: number | string, precision = 0) => {
    // Prevent "-" counting as digit in negative values
    const valueAbs = Math.abs(Number(value));
    let [digits] = String(valueAbs).split('.');
    if (Number(valueAbs) < 1) {
        digits = '';
    }
    if (digits.length >= precision) {
        return Number(Number(value).toFixed(0));
    }
    return Number(Number(value).toFixed(precision - digits.length));
};

const normalizeCPU = (value: number | string) => {
    const rawCores = Number(value) / 1000000;

    return roundToPrecision(rawCores, 3);
};

export const formatCPU = (value?: number | string) => {
    if (value === undefined) {
        return undefined;
    }

    return configuredNumeral(normalizeCPU(value)).format('0.[000]');
};

export const formatCPUWithLabel = (value?: number) => {
    if (value === undefined) {
        return undefined;
    }
    const cores = normalizeCPU(value);
    const localizedCores = configuredNumeral(cores).format('0.[000]');

    return `${localizedCores} ${i18n('format-cpu.cores', {count: cores})}`;
};

export const formatDateTime = (
    value?: number | string,
    {withTimeZone, defaultValue = ''}: {withTimeZone?: boolean; defaultValue?: string} = {},
) => {
    // prevent 1970-01-01 03:00
    if (!Number(value)) {
        return defaultValue;
    }

    const tz = withTimeZone ? ' z' : '';
    const formattedData = dateTimeParse(Number(value))?.format(`YYYY-MM-DD HH:mm${tz}`);

    return formattedData ?? defaultValue;
};
export const formatTimestamp = (value?: string | number, defaultValue = '') => {
    const formattedData = dateTimeParse(value)?.format('YYYY-MM-DD, HH:mm:ss.SSS');

    return formattedData ?? defaultValue;
};

export function getStringifiedData(value: unknown) {
    if (value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    } else {
        return value.toString();
    }
}

// Delete outer empty lines, saving first line spaces
export function trimOuterEmptyLines(str: string) {
    const lines = str.split('\n');

    let start = 0;
    while (start < lines.length && lines[start].trim() === '') {
        start++;
    }

    let end = lines.length - 1;
    while (end >= start && lines[end].trim() === '') {
        end--;
    }

    return lines.slice(start, end + 1).join('\n');
}

// Remove from each line exactly as many leading spaces
// as from the first non-empty line
export function stripIndentByFirstLine(str: string) {
    const lines = str.split('\n');
    if (lines.length === 0) {
        return str;
    }

    const firstIdx = lines.findIndex((l) => l.trim() !== '');
    if (firstIdx === -1) {
        return str;
    }

    const firstLine = lines[firstIdx];
    const match = firstLine.match(/^ +/);
    const leadSpaces = match ? match[0].length : 0;
    if (leadSpaces === 0) {
        return str;
    }

    const re = new RegExp(`^ {0,${leadSpaces}}`);
    const res = lines.map((line) => line.replace(re, ''));
    return res.join('\n');
}
