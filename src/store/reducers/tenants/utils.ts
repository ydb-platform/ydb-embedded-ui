import type {TTenant} from '../../../types/api/tenant';
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

const calculateTenantMetrics = (tenant: TTenant) => {
    const {CoresUsed, MemoryUsed, StorageAllocatedSize, Metrics = {}} = tenant;

    const cpuFromCores = isNumeric(CoresUsed) ? Number(CoresUsed) * 1_000_000 : undefined;
    const cpuFromMetrics = isNumeric(Metrics.CPU) ? Number(Metrics.CPU) : undefined;

    const cpu = cpuFromCores ?? cpuFromMetrics ?? 0;

    const rawMemory = MemoryUsed ?? Metrics.Memory;
    const rawStorage = StorageAllocatedSize ?? Metrics.Storage;

    const memory = isNumeric(rawMemory) ? Number(rawMemory) : 0;
    const storage = isNumeric(rawStorage) ? Number(rawStorage) : 0;

    return {cpu, memory, storage};
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
