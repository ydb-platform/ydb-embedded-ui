import {dateTimeParse} from '@gravity-ui/date-utils';

import type {TVDiskID, TVSlotId} from '../../types/api/vdisk';
import {DAY_IN_SECONDS, GIGABYTE, TERABYTE} from '../constants';
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

export const formatBytesToGigabyte = (bytes: number | string) => {
    return `${Math.floor(Number(bytes) / GIGABYTE)} GB`;
};

export const stringifyVdiskId = (id?: TVDiskID | TVSlotId) => {
    return id ? Object.values(id).join('-') : '';
};

export const getPDiskId = (info: {NodeId?: number; PDiskId?: number}) => {
    return info.NodeId && info.PDiskId ? `${info.NodeId}-${info.PDiskId}` : undefined;
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

export const formatStorageValues = (value?: number, total?: number) => {
    return [
        value ? String(Math.floor(value / TERABYTE)) : undefined,
        total ? `${Math.floor(total / TERABYTE)} TB` : undefined,
    ];
};
export const formatStorageValuesToGb = (value?: number, total?: number): (string | undefined)[] => {
    return [
        value ? String(Math.floor(value / 1000000000)) : undefined,
        total ? `${Math.floor(total / 1000000000)} GB` : undefined,
    ];
};

export const formatNumber = (number?: unknown) => {
    if (!isNumeric(number)) {
        return '';
    }

    return configuredNumeral(number).format();
};

const normalizeCPU = (value: number | string) => {
    const rawCores = Number(value) / 1000000;
    let cores = rawCores.toPrecision(3);
    if (rawCores >= 1000) {
        cores = rawCores.toFixed();
    }
    if (rawCores < 0.001) {
        cores = '0';
    }

    return Number(cores);
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

export const formatDateTime = (value?: number | string) => {
    if (!isNumeric(value)) {
        return '';
    }

    const formattedData = dateTimeParse(Number(value))?.format('YYYY-MM-DD HH:mm');

    return Number(value) > 0 && formattedData ? formattedData : 'N/A';
};

export const calcUptimeInSeconds = (milliseconds: number | string) => {
    const currentDate = new Date();
    const diff = currentDate.getTime() - Number(milliseconds);
    return diff <= 0 ? 0 : diff / 1000;
};

export const calcUptime = (milliseconds?: number | string) => {
    return formatUptime(calcUptimeInSeconds(Number(milliseconds)));
};
