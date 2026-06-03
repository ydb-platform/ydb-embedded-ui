import type {TopicFormValues} from '../../../store/reducers/topic/utils';
import {AutoPartitioningStrategy} from '../../../store/reducers/topic/utils';
import {UNBREAKABLE_GAP} from '../../../utils/constants';

import i18n from './i18n';

export const TOPIC_FORM_DIALOG = 'topic-form-dialog';

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;

export const DEFAULT_TOPIC_FORM_VALUES: TopicFormValues = {
    shards: 1,
    writeQuotaBytes: 1024 * 1024,
    retentionPeriodSeconds: 4 * 60 * 60,
    storageLimitMb: 50 * 1024,
    retentionType: 'time',
    autoPartitioning: {
        enabled: false,
        mode: AutoPartitioningStrategy.ScaleUp,
        minPartitions: 1,
        maxPartitions: 2,
        stabilizationWindow: 300,
        upUtilization: 90,
    },
};

export function acceptNumber(value: string) {
    return value === '' || (/^[0-9]+$/.test(value) && Number(value) <= Number.MAX_SAFE_INTEGER);
}

export function parseNumberInput(value: string): number {
    return value ? Number.parseInt(value, 10) : NaN;
}

export function formatNumberInput(value: number | undefined): string {
    return typeof value === 'number' && !Number.isNaN(value) ? value.toString() : '';
}

export function fromMbToGb(value: number) {
    return value / 1024;
}

export function formatBandwidthBytes(value: number | undefined) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '';
    }

    if (value >= MEGABYTE) {
        return `${value / MEGABYTE}${UNBREAKABLE_GAP}MB/s`;
    }

    if (value >= KILOBYTE) {
        return `${value / KILOBYTE}${UNBREAKABLE_GAP}KB/s`;
    }

    return `${value}${UNBREAKABLE_GAP}byte/s`;
}

export function formatWriteQuotaSelectValue(value: number | undefined) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '';
    }

    if (value >= MEGABYTE && value % MEGABYTE === 0) {
        return `${value / MEGABYTE}${UNBREAKABLE_GAP}MB/s`;
    }

    if (value >= KILOBYTE && value % KILOBYTE === 0) {
        return `${value / KILOBYTE}${UNBREAKABLE_GAP}KB/s`;
    }

    return `${value}${UNBREAKABLE_GAP}byte/s`;
}

export function formatRetentionPeriodSelectValue(value: number | undefined) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '';
    }

    const day = 24 * 60 * 60;
    const hour = 60 * 60;
    const minute = 60;

    if (value >= day && value % day === 0) {
        const days = value / day;
        return `${days} ${i18n(days === 1 ? 'value_day' : 'value_days')}`;
    }

    if (value >= hour && value % hour === 0) {
        const hours = value / hour;
        return `${hours} ${i18n(hours === 1 ? 'value_hour' : 'value_hours')}`;
    }

    if (value >= minute && value % minute === 0) {
        const minutes = value / minute;
        return `${minutes} ${i18n(minutes === 1 ? 'value_minute' : 'value_minutes')}`;
    }

    return `${value} ${i18n(value === 1 ? 'value_second' : 'value_seconds')}`;
}

function normalizePath(path: string) {
    return path.replace(/^\/+|\/+$/g, '');
}

function getRelativePath(path: string, databaseFullPath: string): string | undefined {
    const normalizedPath = normalizePath(path);
    const normalizedDatabase = normalizePath(databaseFullPath);

    if (!normalizedPath || normalizedPath === normalizedDatabase) {
        return undefined;
    }

    if (normalizedPath.startsWith(`${normalizedDatabase}/`)) {
        return normalizedPath.slice(normalizedDatabase.length + 1) || undefined;
    }

    return normalizedPath;
}

function splitTopicPath(topicPath: string, databaseFullPath: string) {
    const relativePath = getRelativePath(topicPath, databaseFullPath);
    const pathSegments = relativePath?.split('/').filter(Boolean) ?? [];
    const name = pathSegments.pop() ?? '';
    const path = pathSegments.join('/');

    return {path: path || undefined, name};
}

export function buildFullTopicPath(formData: TopicFormValues, databaseFullPath: string) {
    const databasePath = databaseFullPath.startsWith('/')
        ? databaseFullPath
        : `/${databaseFullPath}`;
    const relativeTopicPath = [formData.path, formData.name].filter(Boolean).join('/');

    return relativeTopicPath ? `${databasePath}/${relativeTopicPath}` : databasePath;
}

export function getCreateTopicInitialValues({
    databaseFullPath,
    parentPath,
}: {
    databaseFullPath: string;
    parentPath?: string;
}): TopicFormValues {
    return {
        ...DEFAULT_TOPIC_FORM_VALUES,
        path: parentPath ? getRelativePath(parentPath, databaseFullPath) : undefined,
        autoPartitioning: {...DEFAULT_TOPIC_FORM_VALUES.autoPartitioning},
    };
}

export function getUpdateTopicInitialValues({
    databaseFullPath,
    formData,
    topicPath,
}: {
    databaseFullPath: string;
    formData: TopicFormValues;
    topicPath: string;
}): TopicFormValues {
    const topicPathData = splitTopicPath(topicPath, databaseFullPath);
    const hasStorageRetention =
        typeof formData.storageLimitMb === 'number' &&
        !Number.isNaN(formData.storageLimitMb) &&
        formData.storageLimitMb > 0;

    return {
        ...DEFAULT_TOPIC_FORM_VALUES,
        ...formData,
        path: topicPathData.path,
        name: topicPathData.name || formData.name,
        retentionType: hasStorageRetention ? 'size' : 'time',
        storageLimitMb: hasStorageRetention
            ? formData.storageLimitMb
            : DEFAULT_TOPIC_FORM_VALUES.storageLimitMb,
        autoPartitioning: {
            ...DEFAULT_TOPIC_FORM_VALUES.autoPartitioning,
            ...formData.autoPartitioning,
        },
    };
}
