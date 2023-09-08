import {dateTimeParse} from '@gravity-ui/date-utils';

import {MEGABYTE, TERABYTE, GIGABYTE, DAY_IN_SECONDS} from './constants';
import {isNumeric} from './utils';
import {configuredNumeral} from './numeral';

// Here you can't control displayed size and precision
// If you need more custom format, use formatBytesCustom instead
export const formatBytes = (bytes) => {
    if (!isNumeric(bytes)) {
        return '';
    }

    // by agreement, display byte values in decimal scale
    return configuredNumeral(bytes).format('0 b');
};

export const formatBps = (bytes) => {
    const formattedBytes = formatBytes(bytes);

    if (!formattedBytes) {
        return '';
    }

    return formattedBytes + '/s';
};

export const formatBytesToGigabyte = (bytes) => {
    return `${Math.floor(bytes / GIGABYTE)} GB`;
};

export const stringifyVdiskId = (id) => {
    return Object.values(id).join('-');
};
export const getPDiskId = (info) => {
    return `${info.NodeId}-${info.PDiskId}`;
};

export const formatUptime = (seconds) => {
    const days = Math.floor(seconds / DAY_IN_SECONDS);
    const remain = seconds % DAY_IN_SECONDS;

    const uptime = [days && `${days}d`, configuredNumeral(remain).format('00:00:00')]
        .filter(Boolean)
        .join(' ');

    return uptime;
};

export const formatMsToUptime = (ms) => {
    return formatUptime(ms / 1000);
};

export const formatIOPS = (value, capacity) => {
    return [Math.floor(value), Math.floor(capacity) + ' IOPS'];
};

export const formatStorageValues = (value, total) => {
    return [Math.floor(value / TERABYTE), `${Math.floor(total / TERABYTE)} TB`];
};
export const formatStorageValuesToGb = (value, total) => {
    return [Math.floor(value / 1000000000), `${Math.floor(total / 1000000000)} GB`];
};

export const formatThroughput = (value, total) => {
    return [(value / MEGABYTE).toFixed(2), (total / MEGABYTE).toFixed(1) + ' MB/s'];
};

export const formatNumber = (number) => {
    if (!isNumeric(number)) {
        return '';
    }

    return configuredNumeral(number).format();
};

export const formatCPU = (value) => {
    if (!isNumeric(value)) {
        return '';
    }

    return configuredNumeral(value / 1000000).format('0.00');
};

export const formatDateTime = (value) => {
    if (!isNumeric(value)) {
        return '';
    }

    return value > 0 ? dateTimeParse(Number(value)).format('YYYY-MM-DD HH:mm') : 'N/A';
};

export const calcUptimeInSeconds = (milliseconds) => {
    const currentDate = new Date();
    const diff = currentDate - Number(milliseconds);
    return diff <= 0 ? 0 : diff / 1000;
};

export const calcUptime = (milliseconds) => {
    return formatUptime(calcUptimeInSeconds(milliseconds));
};

// determine how many nodes have status Connected "true"
export const getConnectedNodesCount = (nodeStateInfo) => {
    return nodeStateInfo?.reduce((acc, item) => (item.Connected ? acc + 1 : acc), 0);
};

export const renderExplainNode = (node) => {
    const parts = node.name.split('|');
    return parts.length > 1 ? parts[1] : node.name;
};
