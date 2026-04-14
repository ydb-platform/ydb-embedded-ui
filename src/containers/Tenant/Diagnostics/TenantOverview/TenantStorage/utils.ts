import type {TenantStorageRawData} from '../../../../../store/reducers/tenantOverview/storage/tenantOverviewStorage';
import type {TenantStorageStats} from '../../../../../store/reducers/tenants/utils';
import type {EPathSubType, EPathType} from '../../../../../types/api/schema';
import {EType as ETabletType} from '../../../../../types/api/tablet';
import {EType} from '../../../../../types/api/tenant';

import type {TenantStorageMetrics} from './types';

export const TENANT_STORAGE_SEGMENT_KEYS = {
    rowTables: 'rowTables',
    columnTables: 'columnTables',
    topics: 'topics',
    system: 'system',
} as const;

export type TenantStorageSegmentKey =
    (typeof TENANT_STORAGE_SEGMENT_KEYS)[keyof typeof TENANT_STORAGE_SEGMENT_KEYS];

export interface TenantStorageSegment {
    key: TenantStorageSegmentKey;
    value: number;
}

export interface TenantStorageSummary {
    available?: number;
    overhead?: number;
    quota?: number;
    total?: number;
    used: number;
    usedPercent: number;
    segments: TenantStorageSegment[];
}

export interface TenantStorageTopRow {
    path: string;
    pathType?: EPathType;
    pathSubType?: EPathSubType;
    userData: number;
    physicalDisk?: number;
    dbShare: number;
    overhead?: number;
}

export interface TenantStorageData {
    summary: {
        userData: TenantStorageSummary;
        physical: TenantStorageSummary;
    };
    topRows: TenantStorageTopRow[];
}

export interface TenantStorageMediaSection {
    mediaType: EType;
    userData: TenantStorageSummary;
    physical: TenantStorageSummary;
}

const SYSTEM_STORAGE_PATH_PATTERN = /(^|\/)\.(sys|metadata)(\/|$)/;

function normalizeNumber(value: number | string | undefined) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
}

function toOptionalNumber(value: number | string | undefined) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : undefined;
}

function calculateUsedPercent(used: number, total?: number) {
    if (!total || total <= 0 || used <= 0) {
        return 0;
    }

    return Math.min((used / total) * 100, 100);
}

function getUserSegmentKey(type?: string) {
    switch (type) {
        case ETabletType.DataShard:
        case ETabletType.OldDataShard:
            return TENANT_STORAGE_SEGMENT_KEYS.rowTables;
        case ETabletType.ColumnShard:
            return TENANT_STORAGE_SEGMENT_KEYS.columnTables;
        case ETabletType.PersQueue:
            return TENANT_STORAGE_SEGMENT_KEYS.topics;
        default:
            return undefined;
    }
}

function getPhysicalSegmentKey(type?: string) {
    return getUserSegmentKey(type) ?? TENANT_STORAGE_SEGMENT_KEYS.system;
}

function sumSegments(segments: TenantStorageSegment[]) {
    return segments.reduce((sum, segment) => sum + segment.value, 0);
}

function createSegments(keys: TenantStorageSegmentKey[]) {
    return keys.map((key) => ({key, value: 0}));
}

function accumulateSegment(
    segments: TenantStorageSegment[],
    key: TenantStorageSegmentKey,
    value: number,
) {
    return segments.map((segment) => {
        if (segment.key !== key) {
            return segment;
        }

        return {
            ...segment,
            value: segment.value + value,
        };
    });
}

export function isSystemStoragePath(path: string) {
    return SYSTEM_STORAGE_PATH_PATTERN.test(path);
}

function getMediaSortOrder(type: EType) {
    switch (type) {
        case EType.SSD:
            return 0;
        case EType.HDD:
            return 1;
        default:
            return 99;
    }
}

function buildStatsByType(stats: TenantStorageStats[] | undefined) {
    const result = new Map<EType, TenantStorageStats>();

    for (const item of stats ?? []) {
        const type = item.name;

        if (!type) {
            continue;
        }

        result.set(type, item);
    }

    return result;
}

export function buildTenantStorageMediaSections({
    blobStorageStats,
    metrics,
    tabletStorageStats,
}: {
    blobStorageStats?: TenantStorageStats[];
    metrics: TenantStorageMetrics;
    tabletStorageStats?: TenantStorageStats[];
}) {
    const blobStatsByType = buildStatsByType(blobStorageStats);
    const tabletStatsByType = buildStatsByType(tabletStorageStats);

    const mediaTypes = Array.from(
        new Set<EType>([
            ...Array.from(blobStatsByType.keys()),
            ...Array.from(tabletStatsByType.keys()),
        ]),
    ).sort((left, right) => getMediaSortOrder(left) - getMediaSortOrder(right));

    if (mediaTypes.length === 0) {
        const userUsed = normalizeNumber(metrics.tabletStorageUsed);
        const userQuota = toOptionalNumber(metrics.tabletStorageLimit);
        const userAvailable =
            userQuota === undefined ? undefined : Math.max(userQuota - userUsed, 0);

        const physicalUsed = normalizeNumber(metrics.blobStorageUsed);
        const physicalTotal = toOptionalNumber(metrics.blobStorageLimit);
        const physicalAvailable =
            physicalTotal === undefined ? undefined : Math.max(physicalTotal - physicalUsed, 0);

        return [
            {
                mediaType: EType.None,
                userData: {
                    used: userUsed,
                    quota: userQuota,
                    available: userAvailable,
                    usedPercent: calculateUsedPercent(userUsed, userQuota),
                    segments: [],
                },
                physical: {
                    used: physicalUsed,
                    total: physicalTotal,
                    available: physicalAvailable,
                    overhead: userUsed > 0 ? physicalUsed / userUsed : undefined,
                    usedPercent: calculateUsedPercent(physicalUsed, physicalTotal),
                    segments: [],
                },
            },
        ];
    }

    return mediaTypes.map<TenantStorageMediaSection>((mediaType) => {
        const userStats = tabletStatsByType.get(mediaType);
        const physicalStats = blobStatsByType.get(mediaType);

        const userUsed = normalizeNumber(userStats?.used);
        const userQuota =
            toOptionalNumber(userStats?.limit) ??
            (mediaTypes.length === 1 ? toOptionalNumber(metrics.tabletStorageLimit) : undefined);
        const userAvailable =
            userQuota === undefined ? undefined : Math.max(userQuota - userUsed, 0);

        const physicalUsed = normalizeNumber(physicalStats?.used);
        const physicalTotal =
            toOptionalNumber(physicalStats?.limit) ??
            (mediaTypes.length === 1 ? toOptionalNumber(metrics.blobStorageLimit) : undefined);
        const physicalAvailable =
            physicalTotal === undefined ? undefined : Math.max(physicalTotal - physicalUsed, 0);

        return {
            mediaType,
            userData: {
                used: userUsed,
                quota: userQuota,
                available: userAvailable,
                usedPercent: calculateUsedPercent(userUsed, userQuota),
                segments: [],
            },
            physical: {
                used: physicalUsed,
                total: physicalTotal,
                available: physicalAvailable,
                overhead: userUsed > 0 ? physicalUsed / userUsed : undefined,
                usedPercent: calculateUsedPercent(physicalUsed, physicalTotal),
                segments: [],
            },
        };
    });
}

export function buildTenantStorageData(
    rawData: TenantStorageRawData | undefined,
    metrics: TenantStorageMetrics,
): TenantStorageData {
    const userSegments = createSegments([
        TENANT_STORAGE_SEGMENT_KEYS.rowTables,
        TENANT_STORAGE_SEGMENT_KEYS.columnTables,
        TENANT_STORAGE_SEGMENT_KEYS.topics,
    ]);
    const physicalSegments = createSegments([
        TENANT_STORAGE_SEGMENT_KEYS.system,
        TENANT_STORAGE_SEGMENT_KEYS.rowTables,
        TENANT_STORAGE_SEGMENT_KEYS.columnTables,
        TENANT_STORAGE_SEGMENT_KEYS.topics,
    ]);

    for (const row of rawData?.tabletTypeRows ?? []) {
        const dataSize = normalizeNumber(row.DataSize);
        const storageSize = normalizeNumber(row.StorageSize);

        const userKey = getUserSegmentKey(row.Type);
        const physicalKey = getPhysicalSegmentKey(row.Type);

        if (userKey) {
            const nextUserSegments = accumulateSegment(userSegments, userKey, dataSize);
            userSegments.splice(0, userSegments.length, ...nextUserSegments);
        }

        const nextPhysicalSegments = accumulateSegment(physicalSegments, physicalKey, storageSize);
        physicalSegments.splice(0, physicalSegments.length, ...nextPhysicalSegments);
    }

    const userUsedFromStats = sumSegments(userSegments);
    const userUsed = userUsedFromStats || normalizeNumber(metrics.tabletStorageUsed);
    const userQuota = toOptionalNumber(metrics.tabletStorageLimit);
    const userAvailable = userQuota === undefined ? undefined : Math.max(userQuota - userUsed, 0);

    const physicalUsed = normalizeNumber(metrics.blobStorageUsed);
    const physicalTotal = toOptionalNumber(metrics.blobStorageLimit);
    const physicalUserSegmentsSum = sumSegments(
        physicalSegments.filter((segment) => segment.key !== TENANT_STORAGE_SEGMENT_KEYS.system),
    );
    const systemPhysical = Math.max(physicalUsed - physicalUserSegmentsSum, 0);
    const normalizedPhysicalSegments = physicalSegments.map((segment) => {
        if (segment.key !== TENANT_STORAGE_SEGMENT_KEYS.system) {
            return segment;
        }

        return {...segment, value: systemPhysical};
    });
    const physicalAvailable =
        physicalTotal === undefined ? undefined : Math.max(physicalTotal - physicalUsed, 0);
    const overhead = userUsed > 0 ? physicalUsed / userUsed : undefined;

    return {
        summary: {
            userData: {
                available: userAvailable,
                quota: userQuota,
                used: userUsed,
                usedPercent: calculateUsedPercent(userUsed, userQuota),
                segments: userSegments,
            },
            physical: {
                available: physicalAvailable,
                overhead,
                total: physicalTotal,
                used: physicalUsed,
                usedPercent: calculateUsedPercent(physicalUsed, physicalTotal),
                segments: normalizedPhysicalSegments,
            },
        },
        topRows: (rawData?.topRows ?? []).map((row) => {
            const physicalDisk = normalizeNumber(row.physicalDisk);

            return {
                ...row,
                physicalDisk,
                dbShare: physicalUsed > 0 ? physicalDisk / physicalUsed : 0,
                overhead: row.userData > 0 ? physicalDisk / row.userData : undefined,
            };
        }),
    };
}
