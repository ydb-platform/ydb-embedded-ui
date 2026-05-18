import {isNil} from 'lodash';

import type {PoolName, TPoolStats} from '../../../types/api/nodes';
import type {TTenant} from '../../../types/api/tenant';
import {EType} from '../../../types/api/tenant';
import {
    DEFAULT_DANGER_THRESHOLD,
    DEFAULT_WARNING_THRESHOLD,
    EMPTY_DATA_PLACEHOLDER,
} from '../../../utils/constants';
import {UNKNOWN_MEDIA_TYPE, normalizeMediaType} from '../../../utils/disks/normalizeMediaType';
import {isNumeric, safeParseNumber} from '../../../utils/utils';

import {METRIC_STATUS} from './contants';
import type {PreparedTenant} from './types';

const getControlPlaneValue = (tenant: TTenant) => {
    const parts = tenant.Name?.split('/');
    const defaultValue = parts?.length ? parts[parts.length - 1] : EMPTY_DATA_PLACEHOLDER;
    const controlPlaneName = tenant.ControlPlane?.name;

    return controlPlaneName ?? defaultValue;
};

export interface TenantMetricStats<T = string> {
    name?: T;
    usage?: number;
    limit?: number;
    used?: number;
}

export type TenantPoolsStats = TenantMetricStats<PoolName>;
export type TenantStorageStats = TenantMetricStats<string>;

type TenantStorageUsage = NonNullable<TTenant['StorageUsage']>[number];
type TenantStorageQuota = NonNullable<
    NonNullable<TTenant['DatabaseQuotas']>['storage_quotas']
>[number];

const calculatePoolsStats = (
    poolsStats: TPoolStats[] | undefined,
): TenantPoolsStats[] | undefined => {
    if (!poolsStats) {
        return undefined;
    }

    return poolsStats
        .map<TenantPoolsStats | undefined>((pool) => {
            if (pool.Name) {
                const usage = Number(pool.Usage) || 0;
                const limit = Number(pool.Threads);
                const used = limit * usage;

                // Multiply usage by 100 to match with usage to status checkers
                return {name: pool.Name, usage: usage * 100, limit, used};
            }

            return undefined;
        })
        .filter((stats): stats is TenantPoolsStats => stats !== undefined);
};

function getTenantStorageType(unitKind?: string) {
    if (!unitKind || unitKind === EType.None) {
        return EType.None;
    }

    const normalizedType = normalizeMediaType(unitKind);

    if (normalizedType === UNKNOWN_MEDIA_TYPE || normalizedType === EType.None.toUpperCase()) {
        return EType.None;
    }

    return normalizedType;
}

function getStorageUsed(value?: string | number) {
    return isNumeric(value) ? Number(value) : 0;
}

function getStorageLimit(value?: string | number) {
    return isNumeric(value) ? Number(value) : undefined;
}

function buildStorageQuotaMap(storageQuotas: TenantStorageQuota[] | undefined) {
    return (
        storageQuotas?.reduce<Map<string, number>>((result, quota) => {
            const type = getTenantStorageType(quota.unit_kind);
            const softQuota = getStorageLimit(quota.data_size_soft_quota);

            if (type === EType.None || softQuota === undefined) {
                return result;
            }

            const currentQuota = result.get(type) ?? 0;

            result.set(type, currentQuota + softQuota);

            return result;
        }, new Map()) ?? new Map<string, number>()
    );
}

function buildStorageStats(values: TenantStorageUsage[]) {
    return values.map((value) => {
        const {Type, Size, Limit} = value;

        const used = getStorageUsed(Size);
        const limit = getStorageLimit(Limit);

        return {
            name: Type,
            used,
            limit,
            usage: calculateUsage(used, limit),
        };
    });
}

function buildBlobStorageStats({
    blobStorage,
    blobStorageLimit,
    databaseStorage,
    storageUsage,
}: {
    blobStorage: number;
    blobStorageLimit?: number;
    databaseStorage: TTenant['DatabaseStorage'];
    storageUsage: TTenant['StorageUsage'];
}) {
    const source = databaseStorage?.length ? databaseStorage : storageUsage;

    if (source) {
        return buildStorageStats(source);
    }

    return [
        {
            name: EType.None,
            used: blobStorage,
            limit: blobStorageLimit,
            usage: calculateUsage(blobStorage, blobStorageLimit),
        },
    ];
}

function buildLegacyBlobStorageStats({
    blobStorage,
    blobStorageLimit,
    storageUsage,
}: {
    blobStorage: number;
    blobStorageLimit?: number;
    storageUsage: TTenant['StorageUsage'];
}) {
    if (storageUsage) {
        return buildStorageStats(storageUsage);
    }

    return [
        {
            name: EType.SSD,
            used: blobStorage,
            limit: blobStorageLimit,
            usage: calculateUsage(blobStorage, blobStorageLimit),
        },
    ];
}

function buildTabletStorageStats({
    quotaUsage,
    storageQuotasByType,
    tabletStorage,
    tabletStorageLimit,
    tablesStorage,
}: {
    quotaUsage: TTenant['QuotaUsage'];
    storageQuotasByType: Map<string, number>;
    tabletStorage: number;
    tabletStorageLimit?: number;
    tablesStorage: TTenant['TablesStorage'];
}) {
    if (tablesStorage?.length) {
        return tablesStorage.map((value) => {
            const {Type, Size, Limit, SoftQuota} = value;

            const type = getTenantStorageType(Type);
            const used = getStorageUsed(Size);
            const typedQuota = type === EType.None ? undefined : storageQuotasByType.get(type);
            const limit = getStorageLimit(SoftQuota) ?? typedQuota ?? getStorageLimit(Limit);

            return {
                name: type,
                used,
                limit,
                usage: calculateUsage(used, limit),
            };
        });
    }

    if (quotaUsage) {
        return quotaUsage.map((value) => {
            const {Type, Size, Limit} = value;

            const type = getTenantStorageType(Type);
            const used = getStorageUsed(Size);
            const limit = getStorageLimit(Limit);

            return {
                name: type,
                used,
                limit,
                usage: calculateUsage(used, limit),
            };
        });
    }

    if (tabletStorageLimit) {
        return [
            {
                name: EType.None,
                used: tabletStorage,
                limit: tabletStorageLimit,
                usage: calculateUsage(tabletStorage, tabletStorageLimit),
            },
        ];
    }

    return undefined;
}

function buildLegacyTabletStorageStats({
    quotaUsage,
    tabletStorage,
    tabletStorageLimit,
}: {
    quotaUsage: TTenant['QuotaUsage'];
    tabletStorage: number;
    tabletStorageLimit?: number;
}) {
    if (quotaUsage) {
        return buildStorageStats(quotaUsage);
    }

    if (tabletStorageLimit) {
        return [
            {
                name: EType.SSD,
                used: tabletStorage,
                limit: tabletStorageLimit,
                usage: calculateUsage(tabletStorage, tabletStorageLimit),
            },
        ];
    }

    return undefined;
}

export const calculateTenantMetrics = (tenant: TTenant = {}) => {
    const {
        CoresUsed,
        MemoryUsed,
        StorageAllocatedSize,
        MemoryLimit,
        StorageAllocatedLimit,
        PoolStats,
        DatabaseQuotas = {},
        DatabaseStorage,
        StorageUsage,
        QuotaUsage,
        TablesStorage,
        NetworkUtilization,
        NetworkWriteThroughput,
    } = tenant;

    const cpu = Number(CoresUsed) * 1_000_000 || 0;

    const memory = Number(MemoryUsed) || 0;
    const blobStorage = Number(StorageAllocatedSize) || 0;

    const memoryLimit = isNumeric(MemoryLimit) ? Number(MemoryLimit) : undefined;
    const blobStorageLimit = isNumeric(StorageAllocatedLimit)
        ? Number(StorageAllocatedLimit)
        : undefined;
    const tabletStorageLimit = isNumeric(DatabaseQuotas.data_size_soft_quota)
        ? Number(DatabaseQuotas.data_size_soft_quota)
        : undefined;

    const poolsStats = calculatePoolsStats(PoolStats);

    const tabletStorage =
        TablesStorage?.reduce((sum, storageType) => {
            const size = Number(storageType.Size) || 0;
            return sum + size;
        }, 0) ?? 0;
    const legacyBlobStorageStats = buildLegacyBlobStorageStats({
        blobStorage,
        blobStorageLimit,
        storageUsage: StorageUsage,
    });
    const legacyTabletStorageStats = buildLegacyTabletStorageStats({
        quotaUsage: QuotaUsage,
        tabletStorage,
        tabletStorageLimit,
    });
    const storageQuotasByType = buildStorageQuotaMap(DatabaseQuotas.storage_quotas);
    const blobStorageStats = buildBlobStorageStats({
        blobStorage,
        blobStorageLimit,
        databaseStorage: DatabaseStorage,
        storageUsage: StorageUsage,
    });
    const tabletStorageStats = buildTabletStorageStats({
        quotaUsage: QuotaUsage,
        storageQuotasByType,
        tabletStorage,
        tabletStorageLimit,
        tablesStorage: TablesStorage,
    });

    const memoryStats: TenantMetricStats[] = [
        {
            name: 'Process',
            used: memory,
            limit: memoryLimit,
            usage: calculateUsage(memory, memoryLimit),
        },
    ];

    // Expose raw network utilization and throughput for consumers.
    const networkUtilization = isNil(NetworkUtilization)
        ? undefined
        : safeParseNumber(NetworkUtilization);
    const networkThroughput = isNil(NetworkWriteThroughput)
        ? undefined
        : safeParseNumber(NetworkWriteThroughput);

    return {
        memory,
        blobStorage,
        tabletStorage,
        memoryLimit,
        blobStorageLimit,
        tabletStorageLimit,

        cpu,
        poolsStats,
        memoryStats,
        storageMetricStats: legacyTabletStorageStats || legacyBlobStorageStats || [],
        blobStorageStats,
        tabletStorageStats,
        networkUtilization,
        networkThroughput,
    };
};

const calculateTenantEntities = (tenant: TTenant) => {
    const {StorageGroups, NodeIds} = tenant;

    const nodesCount = NodeIds?.length ?? 0;
    const groupsCount = isNumeric(StorageGroups) ? Number(StorageGroups) : 0;

    return {nodesCount, groupsCount};
};

export const prepareTenants = (tenants: TTenant[]): PreparedTenant[] => {
    return tenants.map((tenant) => {
        const sharedDatabase = tenants.find((item) => item.Id === tenant.ResourceId);
        const sharedTenantName = sharedDatabase?.Name;
        const sharedNodeIds = sharedDatabase?.NodeIds;
        const controlPlaneName = getControlPlaneValue(tenant);
        const {cpu, memory, blobStorage} = calculateTenantMetrics(tenant);
        const {nodesCount, groupsCount} = calculateTenantEntities(tenant);

        return {
            ...tenant,

            sharedTenantName,
            sharedNodeIds,
            controlPlaneName,
            cpu,
            memory,
            storage: blobStorage,
            nodesCount,
            groupsCount,
        };
    });
};

function calculateUsage(valueUsed?: number, valueLimit?: number): number | undefined {
    if (valueUsed && valueLimit) {
        return (valueUsed * 100) / valueLimit;
    }

    return undefined;
}

export function getMetricStatusFromUsage(usage?: number) {
    if (!usage) {
        return METRIC_STATUS.Unspecified;
    }

    if (usage > DEFAULT_DANGER_THRESHOLD) {
        return METRIC_STATUS.Danger;
    }
    if (usage > DEFAULT_WARNING_THRESHOLD) {
        return METRIC_STATUS.Warning;
    }

    return METRIC_STATUS.Good;
}

export const normalizeProgress = (progress: number) => {
    if (progress >= 100) {
        return 100;
    }
    if (progress <= 0) {
        return 0;
    }

    return progress;
};
