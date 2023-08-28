import type {TTenant} from '../../../types/api/tenant';
import {formatBytes} from '../../../utils/bytesParsers';
import {formatCPU} from '../../../utils/formatCPU/formatCPU';
import {isNumeric} from '../../../utils/utils';

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

    const cpu = cpuFromCores ?? cpuFromMetrics ?? 0;

    const rawMemory = MemoryUsed ?? Metrics.Memory;
    const rawStorage = StorageAllocatedSize ?? Metrics.Storage;

    const memory = isNumeric(rawMemory) ? Number(rawMemory) : 0;
    const storage = isNumeric(rawStorage) ? Number(rawStorage) : 0;

    const cpuLimit = isNumeric(CoresLimit) ? Number(CoresLimit) : 0;
    const memoryLimit = isNumeric(MemoryLimit) ? Number(MemoryLimit) : 0;
    const storageLimit = isNumeric(StorageLimit) ? Number(StorageLimit) : 0;

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

export const calculateUsage = (valueUsed?: number, valueLimit?: number): [number?, string?] => {
    if (!valueUsed || !valueLimit) {
        return [];
    }

    const usage = (valueUsed * 100) / valueLimit;
    return [usage, `${usage.toFixed(0)}%`];
};

export enum MetricsTypes {
    CPU = 'CPU',
    Storage = 'Storage',
    Memory = 'Memory',
}

export enum EMetricStatus {
    Grey = 'Grey',
    Green = 'Green',
    Yellow = 'Yellow',
    Orange = 'Orange',
    Red = 'Red',
}

export const metricsUsageToStatus = (type?: MetricsTypes, usage?: number) => {
    if (!usage) return EMetricStatus.Grey;
    switch (type) {
        case MetricsTypes.CPU:
            if (usage > 70) return EMetricStatus.Red;
            if (usage > 60) return EMetricStatus.Yellow;
            return EMetricStatus.Green;
        case MetricsTypes.Memory:
            if (usage > 70) return EMetricStatus.Red;
            if (usage > 60) return EMetricStatus.Yellow;
            return EMetricStatus.Green;
        case MetricsTypes.Storage:
            if (usage > 85) return EMetricStatus.Red;
            if (usage > 75) return EMetricStatus.Yellow;
            return EMetricStatus.Green;

        default:
            return EMetricStatus.Grey;
    }
};

export const formatTenantMetrics = ({
    cpu,
    storage,
    memory,
}: {
    cpu?: number;
    storage?: number;
    memory?: number;
}) => {
    return {
        cpu: formatCPU(cpu),
        storage: storage ? formatBytes({value: storage, significantDigits: 2}) : undefined,
        memory: storage ? formatBytes({value: memory, significantDigits: 2}) : undefined,
    };
};
