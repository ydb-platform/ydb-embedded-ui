import type {TTenant} from '../../../types/api/tenant';
import {formatBytes} from '../../../utils/bytesParsers';
import {formatCPUToLocal} from '../../../utils/dataFormatters/dataFormatters';
import {isNumeric} from '../../../utils/utils';
import {METRIC_STATUS} from './contants';

const getControlPlaneValue = (tenant: TTenant) => {
    const parts = tenant.Name?.split('/');
    const defaultValue = parts?.length ? parts[parts.length - 1] : '—';
    const controlPlaneName = tenant.ControlPlane?.name;

    return controlPlaneName ?? defaultValue;
};

const getTenantBackend = (tenant: TTenant) => {
    const node = tenant.Nodes ? tenant.Nodes[0] : {};
    const address =
        node.Host && node.Endpoints
            ? node.Endpoints.find((endpoint) => endpoint.Name === 'http-mon')?.Address
            : undefined;
    return node.Host ? `${node.Host}${address ? address : ''}` : undefined;
};

export const calculateTenantMetrics = (tenant?: TTenant) => {
    const {
        CoresUsed,
        MemoryUsed,
        StorageAllocatedSize,
        CoresLimit,
        MemoryLimit,
        StorageLimit,
        Metrics = {},
    } = tenant || {};

    const cpuFromCores = isNumeric(CoresUsed) ? Number(CoresUsed) * 1_000_000 : undefined;
    const cpuFromMetrics = isNumeric(Metrics.CPU) ? Number(Metrics.CPU) : undefined;

    const cpu = cpuFromCores ?? cpuFromMetrics ?? undefined;

    const rawMemory = MemoryUsed ?? Metrics.Memory;

    const memory = isNumeric(rawMemory) ? Number(rawMemory) : undefined;

    // Blob storage - actual database size
    const storage = isNumeric(StorageAllocatedSize) ? Number(StorageAllocatedSize) : undefined;
    const cpuLimit = isNumeric(CoresLimit) ? Number(CoresLimit) : undefined;
    const memoryLimit = isNumeric(MemoryLimit) ? Number(MemoryLimit) : undefined;
    const storageLimit = isNumeric(StorageLimit) ? Number(StorageLimit) : undefined;

    return {
        cpu,
        memory,
        storage,
        cpuLimit,
        memoryLimit,
        storageLimit,
    };
};

const calculateTenantEntities = (tenant: TTenant) => {
    const {StorageGroups, NodeIds} = tenant;

    const nodesCount = NodeIds?.length ?? 0;
    const groupsCount = isNumeric(StorageGroups) ? Number(StorageGroups) : 0;

    return {nodesCount, groupsCount};
};

export const prepareTenants = (tenants: TTenant[], useNodeAsBackend: boolean) => {
    return tenants.map((tenant) => {
        const backend = useNodeAsBackend ? getTenantBackend(tenant) : undefined;
        const sharedTenantName = tenants.find((item) => item.Id === tenant.ResourceId)?.Name;
        const controlPlaneName = getControlPlaneValue(tenant);
        const {cpu, memory, storage} = calculateTenantMetrics(tenant);
        const {nodesCount, groupsCount} = calculateTenantEntities(tenant);

        return {
            ...tenant,

            backend,
            sharedTenantName,
            controlPlaneName,
            cpu,
            memory,
            storage,
            nodesCount,
            groupsCount,
        };
    });
};

export const calculateUsage = (valueUsed?: number, valueLimit?: number): number | undefined => {
    if (valueUsed && valueLimit) {
        return (valueUsed * 100) / valueLimit;
    }

    return undefined;
};

export const formatUsage = (usage?: number) => {
    if (usage) {
        return `${usage.toFixed()}%`;
    }

    return undefined;
};

export const cpuUsageToStatus = (usage?: number) => {
    if (!usage) {
        return METRIC_STATUS.Unspecified;
    }

    if (usage > 70) {
        return METRIC_STATUS.Danger;
    }
    if (usage > 60) {
        return METRIC_STATUS.Warning;
    }

    return METRIC_STATUS.Good;
};
export const storageUsageToStatus = (usage?: number) => {
    if (!usage) {
        return METRIC_STATUS.Unspecified;
    }

    if (usage > 85) {
        return METRIC_STATUS.Danger;
    }
    if (usage > 75) {
        return METRIC_STATUS.Warning;
    }

    return METRIC_STATUS.Good;
};

export const memoryUsageToStatus = (usage?: number) => {
    if (!usage) {
        return METRIC_STATUS.Unspecified;
    }

    if (usage > 70) {
        return METRIC_STATUS.Danger;
    }
    if (usage > 60) {
        return METRIC_STATUS.Warning;
    }

    return METRIC_STATUS.Good;
};

export const formatTenantMetrics = ({
    cpu,
    storage,
    memory,
}: {
    cpu?: number;
    storage?: number;
    memory?: number;
}) => ({
    cpu: formatCPUToLocal(cpu),
    storage: formatBytes({value: storage, significantDigits: 2}) || undefined,
    memory: formatBytes({value: memory, significantDigits: 2}) || undefined,
});

export const normalizeProgress = (progress: number) => {
    if (progress >= 100) {
        return 100;
    }
    if (progress <= 0) {
        return 0;
    }

    return progress;
};
