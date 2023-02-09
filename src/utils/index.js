import numeral from 'numeral';
import locales from 'numeral/locales'; // eslint-disable-line no-unused-vars

import {dateTimeParse} from '@gravity-ui/date-utils';

import {i18n} from './i18n';
import {MEGABYTE, TERABYTE, GIGABYTE, DAY_IN_SECONDS} from './constants';
import {isNumeric} from './utils';

numeral.locale(i18n.lang);

// Here you can't control displayed size and precision
// If you need more custom format, use formatBytesCustom instead
export const formatBytes = (bytes) => {
    if (!isNumeric(bytes)) {
        return '';
    }

    // by agreement, display byte values in decimal scale
    return numeral(bytes).format('0 b');
};

export const formatBps = (bytes) => formatBytes(bytes) + '/s';

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

    const uptime = [days && `${days}d`, numeral(remain).format('00:00:00')]
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

    return numeral(number).format();
};

export const formatCPU = (value) => {
    if (!isNumeric(value)) {
        return '';
    }

    return numeral(value / 1000000).format('0.00');
};

export const formatDateTime = (value) => {
    if (!isNumeric(value)) {
        return '';
    }

    return value > 0 ? dateTimeParse(Number(value)).format('YYYY-MM-DD HH:mm') : 'N/A';
};

export const calcUptimeInSeconds = (milliseconds) => {
    const currentDate = new Date();
    return (currentDate - Number(milliseconds)) / 1000;
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

export const getExplainNodeId = (...values) => {
    return values.join('|');
};

const getStringFromProps = (props) => {
    return props
        .map(([name, value]) => {
            return value && `${name}: ${Array.isArray(value) ? value.join(', ') : value}`;
        })
        .filter(Boolean)
        .join('\n');
};

export const getMetaForExplainNode = (node) => {
    switch (node.type) {
        case 'MultiLookup':
        case 'Lookup': {
            return getStringFromProps([
                ['lookup by', node.lookup_by],
                ['columns', node.columns],
            ]);
        }
        case 'FullScan':
        case 'Scan': {
            return getStringFromProps([
                ['scan by', node.scan_by],
                ['limit', node.limit],
                ['columns', node.columns],
            ]);
        }
        case 'Upsert':
        case 'MultiUpsert': {
            return getStringFromProps([
                ['key', node.key],
                ['columns', node.columns],
            ]);
        }
        case 'Erase':
        case 'MultiErase': {
            return getStringFromProps([
                ['key', node.key],
                ['columns', node.columns],
            ]);
        }
        default:
            return '';
    }
};
