import {dateTimeParse} from '@gravity-ui/date-utils';

import type {TVDiskID, TVSlotId} from '../../types/api/vdisk';
import {
    formatBytes as formatBytesCustom,
    getSizeWithSignificantDigits,
} from '../bytesParsers/formatBytes';
import type {BytesSizes} from '../bytesParsers/formatBytes';
import {DAY_IN_SECONDS, HOUR_IN_SECONDS} from '../constants';
import {configuredNumeral} from '../numeral';
import {isNumeric} from '../utils';

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

export const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / DAY_IN_SECONDS);
    const remain = seconds % DAY_IN_SECONDS;

    const uptime = [days && `${days}d`, configuredNumeral(remain).format('00:00:00')]
        .filter(Boolean)
        .join(' ');

    return uptime;
};

export const formatMsToUptime = (ms?: number) => {
    return ms && formatUptime(ms / 1000);
};

export const formatStorageValues = (value?: number, total?: number, size?: BytesSizes) => {
    let calculatedSize = getSizeWithSignificantDigits(Number(value), 0);
    let valueWithSizeLabel = true;
    let valuePrecision = 0;

    if (isNumeric(total)) {
        calculatedSize = getSizeWithSignificantDigits(Number(total), 0);
        valueWithSizeLabel = false;
        valuePrecision = 1;
    }

    const formattedValue = formatBytesCustom({
        value,
        withSizeLabel: valueWithSizeLabel,
        size: size || calculatedSize,
        precision: valuePrecision,
    });
    const formattedTotal = formatBytesCustom({value: total, size: size || calculatedSize});

    return [formattedValue, formattedTotal];
};

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

export const formatSecondsToHours = (seconds: number) => {
    const hours = (seconds / HOUR_IN_SECONDS).toFixed(2);
    return `${formatNumber(hours)} hours`;
};

export const roundToPrecision = (value: number | string, precision = 0) => {
    let [digits] = String(value).split('.');
    if (Number(value) < 1) {
        digits = '';
    }
    if (digits.length >= precision) {
        return Math.round(Number(value));
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

export const formatDateTime = (value?: number | string, defaultValue = '') => {
    const formattedData = dateTimeParse(Number(value))?.format('YYYY-MM-DD HH:mm');

    return formattedData ?? defaultValue;
};

export const calcUptimeInSeconds = (milliseconds: number | string) => {
    const currentDate = new Date();
    const diff = currentDate.getTime() - Number(milliseconds);
    return diff <= 0 ? 0 : diff / 1000;
};

export const calcUptime = (milliseconds?: number | string) => {
    return formatUptime(calcUptimeInSeconds(Number(milliseconds)));
};
