import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {ResourcePreset} from '../../types/api/resourcePresets';
import type {DatabaseComputeConfig} from '../../types/api/tenant';

import type {AllocatedResources, DatabaseRow} from './types';

export const RESOURCE_GROUPINGS = ['cpu', 'memory'] as const;
export type ResourceGrouping = (typeof RESOURCE_GROUPINGS)[number];

export interface ResourceUsageGroup {
    name: string;
    lower?: number;
    upper?: number;
    rows: DatabaseRow[];
}

const USAGE_THRESHOLDS = [100, 90, 75, 50, 0];

function fixedCompute(row: PreparedTenant) {
    const cp = row.ControlPlane;
    if (!cp) {
        return undefined;
    }
    if (cp.serverless_database || row.Type === 'Serverless') {
        return cp.serverless_database?.exclusive_compute_resources;
    }
    const compute = cp.dedicated_database ?? cp.shared_database;
    return {
        resource_preset_id: compute?.resource_preset_id ?? cp.resource_preset_id,
        scale_policy: compute?.scale_policy ?? cp.scale_policy,
    };
}

function configuredSize(config?: DatabaseComputeConfig) {
    const raw = config?.scale_policy?.fixed_scale?.size;
    if (typeof raw !== 'number' && !(typeof raw === 'string' && raw.trim())) {
        return undefined;
    }
    const size = Number(raw);
    return Number.isSafeInteger(size) && size >= 0 ? size : undefined;
}

export function needsPreset(row: PreparedTenant) {
    const config = fixedCompute(row);
    return Boolean(config?.resource_preset_id && configuredSize(config) !== undefined);
}

function parseBytes(value?: string | number) {
    if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) {
        return undefined;
    }
    const bytes = Number(value);
    return Number.isFinite(bytes) && bytes >= 0 ? bytes : undefined;
}

function allocatedAmount(value: string, size: number, unit = 1) {
    const perSlot = Number(value);
    if (!Number.isSafeInteger(perSlot) || perSlot <= 0) {
        return undefined;
    }
    const total = perSlot * size * unit;
    return Number.isSafeInteger(total) ? total : undefined;
}

export function allocatedResources(
    row: PreparedTenant,
    catalogs: ReadonlyMap<string, ReadonlyMap<string, ResourcePreset>>,
): AllocatedResources | undefined {
    const config = fixedCompute(row);
    const size = configuredSize(config);
    if (!row.Cluster || !config?.resource_preset_id || size === undefined) {
        return undefined;
    }
    const preset = catalogs.get(row.Cluster)?.get(config.resource_preset_id);
    if (!preset) {
        return undefined;
    }
    return {
        cores: allocatedAmount(preset.cores, size),
        // Control Plane expresses memory per slot in GiB. Viewer reports bytes.
        memoryBytes: allocatedAmount(preset.memory, size, 1024 ** 3),
    };
}

function usageRatio(used?: number, capacity?: number) {
    if (
        typeof used !== 'number' ||
        !Number.isFinite(used) ||
        used < 0 ||
        typeof capacity !== 'number' ||
        !Number.isFinite(capacity) ||
        capacity <= 0
    ) {
        return undefined;
    }
    return used / capacity;
}

export function groupByResourceUsage(
    rows: readonly DatabaseRow[],
    mode: ResourceGrouping,
): ResourceUsageGroup[] {
    const groups = new Map<number | undefined, DatabaseRow[]>();
    for (const row of rows) {
        const ratio =
            mode === 'cpu'
                ? usageRatio(row.CoresUsed, row.allocated?.cores)
                : usageRatio(parseBytes(row.MemoryUsed), row.allocated?.memoryBytes);
        const lower =
            ratio === undefined
                ? undefined
                : USAGE_THRESHOLDS.find((threshold) => ratio >= threshold / 100);
        const existing = groups.get(lower);
        if (existing) {
            existing.push(row);
        } else {
            groups.set(lower, [row]);
        }
    }
    const result: ResourceUsageGroup[] = [];
    for (const [index, lower] of [...USAGE_THRESHOLDS, undefined].entries()) {
        const members = groups.get(lower);
        if (members) {
            result.push({
                name: `usage-${mode}-${lower ?? 'unknown'}`,
                lower,
                upper: lower === undefined ? undefined : USAGE_THRESHOLDS[index - 1],
                rows: members,
            });
        }
    }
    return result;
}
