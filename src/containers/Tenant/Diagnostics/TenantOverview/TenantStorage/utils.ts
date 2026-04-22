import type {TenantStorageRawData} from '../../../../../store/reducers/tenantOverview/storage/tenantOverviewStorage';
import type {TenantStorageStats} from '../../../../../store/reducers/tenants/utils';
import type {EPathSubType, EPathType} from '../../../../../types/api/schema';
import type {TStorageStatsTabletTypeEntry} from '../../../../../types/api/storage';
import {EType as ETabletType} from '../../../../../types/api/tablet';
import {EType} from '../../../../../types/api/tenant';
import {normalizeMediaType} from '../../../../../utils/disks/normalizeMediaType';

import type {TenantStorageMetrics} from './types';

export const TENANT_STORAGE_SEGMENT_KEYS = {
    rowTables: 'rowTables',
    columnTables: 'columnTables',
    topics: 'topics',
    system: 'system',
    unknown: 'unknown',
} as const;

export const TENANT_STORAGE_SYSTEM_DETAIL_KEYS = {
    hive: 'Hive',
    coordinator: 'Coordinator',
    mediator: 'Mediator',
    schemeShard: 'SchemeShard',
    sysViewProcessor: 'SysViewProcessor',
    graphShard: 'GraphShard',
    statisticsAggregator: 'StatisticsAggregator',
    bsController: 'BSController',
    cms: 'Cms',
    nodeBroker: 'NodeBroker',
    tenantSlotBroker: 'TenantSlotBroker',
    console: 'Console',
} as const;

export type TenantStorageSegmentKey =
    (typeof TENANT_STORAGE_SEGMENT_KEYS)[keyof typeof TENANT_STORAGE_SEGMENT_KEYS];

export type TenantStorageSystemDetailKey =
    (typeof TENANT_STORAGE_SYSTEM_DETAIL_KEYS)[keyof typeof TENANT_STORAGE_SYSTEM_DETAIL_KEYS];

export interface TenantStorageSegment {
    key: TenantStorageSegmentKey;
    value: number;
}

export interface TenantStorageSystemDetail {
    key: TenantStorageSystemDetailKey;
    value: number;
}

export interface TenantStorageSummary {
    available?: number;
    availableApproximate?: boolean;
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

export interface TenantStorageLogicalUserData {
    rowTables: number;
    topics: number;
}

export interface TenantStorageData {
    logicalUserData?: TenantStorageLogicalUserData;
    summary: {
        userData: TenantStorageSummary;
        physical: TenantStorageSummary;
    };
    topRows: TenantStorageTopRow[];
    topRowsError?: unknown;
    userDataSegments: TenantStorageSegment[];
    physicalSegmentsByMedia: Record<string, TenantStorageSegment[]>;
    systemDetailsByMedia: Record<string, TenantStorageSystemDetail[]>;
}

export interface TenantStorageMediaSection {
    mediaType: EType;
    userData: TenantStorageSummary;
    physical: TenantStorageSummary;
}

const SYSTEM_STORAGE_PATH_PATTERN = /(^|\/)\.(sys|metadata)(\/|$)/;

const PHYSICAL_SEGMENT_KEYS = [
    TENANT_STORAGE_SEGMENT_KEYS.system,
    TENANT_STORAGE_SEGMENT_KEYS.rowTables,
    TENANT_STORAGE_SEGMENT_KEYS.columnTables,
    TENANT_STORAGE_SEGMENT_KEYS.topics,
    TENANT_STORAGE_SEGMENT_KEYS.unknown,
] as const;

const PHYSICAL_SYSTEM_TABLET_TYPES = new Set<string>([
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.coordinator,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.mediator,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.schemeShard,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.sysViewProcessor,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.graphShard,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.statisticsAggregator,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.bsController,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.cms,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.nodeBroker,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.tenantSlotBroker,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS.console,
]);

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

function getUserLogicalSegments(logicalUserData?: TenantStorageLogicalUserData) {
    return [
        {
            key: TENANT_STORAGE_SEGMENT_KEYS.rowTables,
            value: logicalUserData?.rowTables ?? 0,
        },
        {
            key: TENANT_STORAGE_SEGMENT_KEYS.topics,
            value: logicalUserData?.topics ?? 0,
        },
    ];
}

function getPhysicalSegmentsBase() {
    return PHYSICAL_SEGMENT_KEYS.map((key) => ({key, value: 0}));
}

function getSystemDetailsBase() {
    return Object.values(TENANT_STORAGE_SYSTEM_DETAIL_KEYS).map((key) => ({key, value: 0}));
}

function accumulateSegment(
    segments: TenantStorageSegment[],
    key: TenantStorageSegmentKey,
    value: number,
) {
    if (value <= 0) {
        return segments;
    }

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

function accumulateSystemDetail(
    details: TenantStorageSystemDetail[],
    key: TenantStorageSystemDetailKey,
    value: number,
) {
    if (value <= 0) {
        return details;
    }

    return details.map((detail) => {
        if (detail.key !== key) {
            return detail;
        }

        return {
            ...detail,
            value: detail.value + value,
        };
    });
}

function sumSegments(segments: TenantStorageSegment[]) {
    return segments.reduce((sum, segment) => sum + segment.value, 0);
}

function getPhysicalSegmentKey(type?: string) {
    switch (type) {
        case ETabletType.DataShard:
        case ETabletType.OldDataShard:
            return TENANT_STORAGE_SEGMENT_KEYS.rowTables;
        case ETabletType.ColumnShard:
            return TENANT_STORAGE_SEGMENT_KEYS.columnTables;
        case ETabletType.PersQueue:
        case ETabletType.PersQueueReadBalancer:
            return TENANT_STORAGE_SEGMENT_KEYS.topics;
        case 'Unknown':
            return TENANT_STORAGE_SEGMENT_KEYS.unknown;
        default:
            return PHYSICAL_SYSTEM_TABLET_TYPES.has(type ?? '')
                ? TENANT_STORAGE_SEGMENT_KEYS.system
                : TENANT_STORAGE_SEGMENT_KEYS.unknown;
    }
}

function isSystemTabletType(type?: string): type is TenantStorageSystemDetailKey {
    return PHYSICAL_SYSTEM_TABLET_TYPES.has(type ?? '');
}

export function getTenantStorageMediaKey(mediaType?: string) {
    return normalizeMediaType(mediaType);
}

function getTabletTypeMediaEntries(row: TStorageStatsTabletTypeEntry) {
    if (!Array.isArray(row.Media)) {
        return [];
    }

    return row.Media.map((mediaEntry) => ({
        mediaKey: getTenantStorageMediaKey(mediaEntry.Kind),
        storageSize: normalizeNumber(mediaEntry.StorageSize),
    })).filter((mediaEntry) => mediaEntry.storageSize > 0);
}

function mergeSegments(segmentsByMedia: Record<string, TenantStorageSegment[]>) {
    return Object.values(segmentsByMedia).reduce<TenantStorageSegment[]>((result, segments) => {
        let nextResult = result;

        for (const segment of segments) {
            nextResult = accumulateSegment(nextResult, segment.key, segment.value);
        }

        return nextResult;
    }, getPhysicalSegmentsBase());
}

export function mergeSystemDetailsByMedia(
    detailsByMedia: Record<string, TenantStorageSystemDetail[]>,
) {
    return Object.values(detailsByMedia).reduce<TenantStorageSystemDetail[]>((result, details) => {
        let nextResult = result;

        for (const detail of details) {
            nextResult = accumulateSystemDetail(nextResult, detail.key, detail.value);
        }

        return nextResult;
    }, getSystemDetailsBase());
}

function buildPhysicalSegmentsByMedia(tabletTypeRows: TStorageStatsTabletTypeEntry[] | undefined) {
    const segmentsByMedia: Record<string, TenantStorageSegment[]> = {};
    const systemDetailsByMedia: Record<string, TenantStorageSystemDetail[]> = {};

    for (const row of tabletTypeRows ?? []) {
        const physicalKey = getPhysicalSegmentKey(row.Type);
        const mediaEntries = getTabletTypeMediaEntries(row);

        for (const mediaEntry of mediaEntries) {
            const currentSegments =
                segmentsByMedia[mediaEntry.mediaKey] ?? getPhysicalSegmentsBase();
            segmentsByMedia[mediaEntry.mediaKey] = accumulateSegment(
                currentSegments,
                physicalKey,
                mediaEntry.storageSize,
            );

            if (!isSystemTabletType(row.Type)) {
                continue;
            }

            const currentDetails =
                systemDetailsByMedia[mediaEntry.mediaKey] ?? getSystemDetailsBase();
            systemDetailsByMedia[mediaEntry.mediaKey] = accumulateSystemDetail(
                currentDetails,
                row.Type,
                mediaEntry.storageSize,
            );
        }
    }

    return {
        physicalSegmentsByMedia: segmentsByMedia,
        systemDetailsByMedia,
    };
}

export function getTenantStoragePhysicalDisplaySegments({
    segments,
    used,
}: {
    segments: TenantStorageSegment[] | undefined;
    used: number;
}) {
    const normalizedUsed = normalizeNumber(used);
    const baseSegments = getPhysicalSegmentsBase();

    const mergedSegments = (segments ?? []).reduce<TenantStorageSegment[]>((result, segment) => {
        return accumulateSegment(result, segment.key, segment.value);
    }, baseSegments);

    const accounted = sumSegments(mergedSegments);
    const remainder = Math.max(normalizedUsed - accounted, 0);

    return accumulateSegment(mergedSegments, TENANT_STORAGE_SEGMENT_KEYS.unknown, remainder);
}

function getApproximateLogicalAvailability({
    hasQuota,
    physical,
    used,
}: {
    hasQuota: boolean;
    physical: TenantStorageSummary;
    used: number;
}) {
    if (hasQuota) {
        return {
            estimatedAvailable: undefined,
            nextAvailable: undefined,
            nextTotal: undefined,
            usedPercent: 0,
        };
    }

    const physicalUsed = normalizeNumber(physical.used);
    const physicalAvailable = toOptionalNumber(physical.available);
    const overhead = used > 0 && physicalUsed > 0 ? physicalUsed / used : undefined;

    if (physicalAvailable === undefined || overhead === undefined || overhead <= 0) {
        return {
            estimatedAvailable: undefined,
            nextAvailable: undefined,
            nextTotal: undefined,
            usedPercent: 0,
        };
    }

    const estimatedAvailable = physicalAvailable / overhead;
    const nextTotal = used + estimatedAvailable;

    return {
        estimatedAvailable,
        nextAvailable: estimatedAvailable,
        nextTotal,
        usedPercent: calculateUsedPercent(used, nextTotal),
    };
}

function isUnchangedUserDataSummary({
    summary,
    nextAvailable,
    nextTotal,
    used,
    usedPercent,
}: {
    summary: TenantStorageSummary;
    nextAvailable: number | undefined;
    nextTotal: number | undefined;
    used: number;
    usedPercent: number;
}) {
    return (
        used === summary.used &&
        nextAvailable === summary.available &&
        usedPercent === summary.usedPercent &&
        !summary.availableApproximate &&
        nextTotal === summary.total
    );
}

export function getTenantStorageUserDataDisplaySummary({
    summary,
    logicalUserData,
    useLogicalBreakdown,
    physical,
}: {
    summary: TenantStorageSummary;
    logicalUserData?: TenantStorageLogicalUserData;
    useLogicalBreakdown: boolean;
    physical: TenantStorageSummary;
}) {
    const used =
        useLogicalBreakdown && logicalUserData
            ? logicalUserData.rowTables + logicalUserData.topics
            : summary.used;
    const quota = summary.quota;
    const hasQuota = quota !== undefined;
    const available = hasQuota ? Math.max((quota ?? 0) - used, 0) : undefined;
    const {
        estimatedAvailable,
        nextAvailable: approximateAvailable,
        nextTotal,
        usedPercent: approximateUsedPercent,
    } = getApproximateLogicalAvailability({
        hasQuota,
        physical,
        used,
    });
    const nextAvailable = available ?? approximateAvailable;
    const usedPercent = hasQuota ? calculateUsedPercent(used, quota) : approximateUsedPercent;

    if (
        isUnchangedUserDataSummary({
            summary,
            nextAvailable,
            nextTotal,
            used,
            usedPercent,
        })
    ) {
        return summary;
    }

    const nextSummary: TenantStorageSummary = {
        ...summary,
        available: nextAvailable,
        used,
        usedPercent,
    };

    if (estimatedAvailable === undefined) {
        return nextSummary;
    }

    return {
        ...nextSummary,
        availableApproximate: true,
        total: nextTotal,
    };
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

    const mediaTypes = Array.from(blobStatsByType.keys()).sort(
        (left, right) => getMediaSortOrder(left) - getMediaSortOrder(right),
    );

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
    const logicalUserData = rawData?.logicalUserData;
    const userDataSegments = getUserLogicalSegments(logicalUserData);
    const {physicalSegmentsByMedia, systemDetailsByMedia} = buildPhysicalSegmentsByMedia(
        rawData?.tabletTypeRows,
    );

    const logicalUsed = logicalUserData
        ? logicalUserData.rowTables + logicalUserData.topics
        : undefined;
    const userUsed =
        logicalUsed === undefined ? normalizeNumber(metrics.tabletStorageUsed) : logicalUsed;
    const userQuota = toOptionalNumber(metrics.tabletStorageLimit);
    const userAvailable = userQuota === undefined ? undefined : Math.max(userQuota - userUsed, 0);

    const physicalUsed = normalizeNumber(metrics.blobStorageUsed);
    const physicalTotal = toOptionalNumber(metrics.blobStorageLimit);
    const physicalAvailable =
        physicalTotal === undefined ? undefined : Math.max(physicalTotal - physicalUsed, 0);
    const overhead = userUsed > 0 ? physicalUsed / userUsed : undefined;

    return {
        logicalUserData,
        summary: {
            userData: {
                available: userAvailable,
                quota: userQuota,
                used: userUsed,
                usedPercent: calculateUsedPercent(userUsed, userQuota),
                segments: userDataSegments,
            },
            physical: {
                available: physicalAvailable,
                overhead,
                total: physicalTotal,
                used: physicalUsed,
                usedPercent: calculateUsedPercent(physicalUsed, physicalTotal),
                segments: getTenantStoragePhysicalDisplaySegments({
                    segments: mergeSegments(physicalSegmentsByMedia),
                    used: physicalUsed,
                }),
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
        topRowsError: rawData?.topRowsError,
        userDataSegments,
        physicalSegmentsByMedia,
        systemDetailsByMedia,
    };
}
