import {isNil} from 'lodash';

import type {PoolName, TPoolStats} from '../../../types/api/nodes';
import type {TTenant} from '../../../types/api/tenant';
import {EType} from '../../../types/api/tenant';
import {
    DEFAULT_DANGER_THRESHOLD,
    DEFAULT_WARNING_THRESHOLD,
    EMPTY_DATA_PLACEHOLDER,
} from '../../../utils/constants';
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
export type TenantStorageStats = TenantMetricStats<EType>;

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

export const calculateTenantMetrics = (tenant: TTenant = {}) => {
    const {
        CoresUsed,
        MemoryUsed,
        StorageAllocatedSize,
        MemoryLimit,
        StorageAllocatedLimit,
        PoolStats,
        Metrics = {},
        DatabaseQuotas = {},
        StorageUsage,
        QuotaUsage,
        NetworkUtilization,
        NetworkWriteThroughput,
    } = tenant;

    const cpu = Number(CoresUsed) * 1_000_000 || 0;

    const memory = Number(MemoryUsed) || 0;
    const blobStorage = Number(StorageAllocatedSize) || 0;
    const tabletStorage = Number(Metrics.Storage) || 0;

    const memoryLimit = isNumeric(MemoryLimit) ? Number(MemoryLimit) : undefined;
    const blobStorageLimit = isNumeric(StorageAllocatedLimit)
        ? Number(StorageAllocatedLimit)
        : undefined;
    const tabletStorageLimit = isNumeric(DatabaseQuotas.data_size_soft_quota)
        ? Number(DatabaseQuotas.data_size_soft_quota)
        : undefined;

    const poolsStats = calculatePoolsStats(PoolStats);

    let blobStorageStats: TenantStorageStats[];
    let tabletStorageStats: TenantStorageStats[] | undefined;

    if (StorageUsage) {
        blobStorageStats = StorageUsage.map((value) => {
            const {Type, Size, Limit} = value;

            const used = Number(Size);
            const limit = Number(Limit);

            return {
                name: Type,
                used,
                limit,
                usage: calculateUsage(used, limit),
            };
        });
    } else {
        blobStorageStats = [
            {
                name: EType.SSD,
                used: blobStorage,
                limit: blobStorageLimit,
                usage: calculateUsage(blobStorage, blobStorageLimit),
            },
        ];
    }

    if (QuotaUsage) {
        tabletStorageStats = QuotaUsage.map((value) => {
            const {Type, Size, Limit} = value;

            const used = Number(Size);
            const limit = Number(Limit);

            return {
                name: Type,
                used,
                limit,
                usage: calculateUsage(used, limit),
            };
        });
    } else if (tabletStorageLimit) {
        tabletStorageStats = [
            {
                name: EType.SSD,
                used: tabletStorage,
                limit: tabletStorageLimit,
                usage: calculateUsage(tabletStorage, tabletStorageLimit),
            },
        ];
    }

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
