import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {ResourcePreset} from '../../types/api/resourcePresets';
import type {DatabaseComputeConfig} from '../../types/api/tenant';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';

import {databaseCloudId} from './clouds';
import type {AllocatedResources, DatabaseRow} from './types';

export const RESOURCE_GROUPINGS = ['cpu', 'memory'] as const;
export type ResourceGrouping = (typeof RESOURCE_GROUPINGS)[number];

export interface ResourceUsageGroup {
    name: string;
    lower?: number;
    upper?: number;
    /** Databases that have no allocated resources to compare the usage with. */
    notApplicable?: true;
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

/** An empty object tells as little about the database as no Control Plane data at all. */
export function hasControlPlaneData({ControlPlane: cp}: PreparedTenant) {
    return Boolean(cp && Object.keys(cp).length);
}

/** A serverless database runs on shared compute unless it has exclusive resources. */
function hasNoOwnCompute(row: PreparedTenant) {
    const {ControlPlane: cp, Type} = row;
    return Boolean(
        hasControlPlaneData(row) &&
            (cp?.serverless_database || Type === 'Serverless') &&
            !cp?.serverless_database?.exclusive_compute_resources,
    );
}

function configuredSize(config?: DatabaseComputeConfig) {
    const raw = config?.scale_policy?.fixed_scale?.size;
    if (typeof raw !== 'number' && !(typeof raw === 'string' && raw.trim())) {
        return undefined;
    }
    const size = Number(raw);
    return Number.isSafeInteger(size) && size >= 0 ? size : undefined;
}

export type PresetCatalogs = ReadonlyMap<string, ReadonlyMap<string, ResourcePreset>>;

/**
 * Presets are listed for a cluster, or for a cloud in the cluster: that list also has
 * the presets restricted to the cloud. A database reads the list it was asked about with.
 */
export function presetCatalogKey(clusterName: string, cloudId?: string) {
    return cloudId ? JSON.stringify([clusterName, cloudId]) : clusterName;
}

/** The preset a database of a fixed size is scaled by, and where it is listed. */
export function requiredPreset(row: PreparedTenant) {
    const config = fixedCompute(row);
    const size = configuredSize(config);
    if (!row.Cluster || !config?.resource_preset_id || size === undefined) {
        return undefined;
    }
    return {
        clusterName: row.Cluster,
        cloudId: databaseCloudId(row),
        presetId: config.resource_preset_id,
        size,
    };
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
    catalogs: PresetCatalogs,
): AllocatedResources | null | undefined {
    if (hasNoOwnCompute(row)) {
        return null;
    }
    const required = requiredPreset(row);
    if (!required) {
        return undefined;
    }
    const {clusterName, cloudId, presetId, size} = required;
    const preset = catalogs.get(presetCatalogKey(clusterName, cloudId))?.get(presetId);
    if (!preset) {
        return undefined;
    }
    return {
        cores: allocatedAmount(preset.cores, size),
        // Control Plane expresses memory per slot in GiB. Viewer reports bytes.
        memoryBytes: allocatedAmount(preset.memory, size, 1024 ** 3),
    };
}

/** Reads the used amount the same way the table cells do. */
function usageRatio(used: unknown, capacity?: number) {
    const usedAmount = parseOptionalNonNegativeNumber(used);
    if (usedAmount === undefined || !capacity || !Number.isFinite(capacity) || capacity < 0) {
        return undefined;
    }
    return usedAmount / capacity;
}

export function groupByResourceUsage(
    rows: readonly DatabaseRow[],
    mode: ResourceGrouping,
): ResourceUsageGroup[] {
    const groups = new Map<number | 'none' | undefined, DatabaseRow[]>();
    for (const row of rows) {
        const ratio =
            mode === 'cpu'
                ? usageRatio(row.CoresUsed, row.allocated?.cores)
                : usageRatio(row.MemoryUsed, row.allocated?.memoryBytes);
        let lower: number | 'none' | undefined;
        if (row.allocated === null) {
            lower = 'none';
        } else if (ratio !== undefined) {
            lower = USAGE_THRESHOLDS.find((threshold) => ratio >= threshold / 100);
        }
        const existing = groups.get(lower);
        if (existing) {
            existing.push(row);
        } else {
            groups.set(lower, [row]);
        }
    }
    const result: ResourceUsageGroup[] = [];
    for (const [index, lower] of USAGE_THRESHOLDS.entries()) {
        const members = groups.get(lower);
        if (members) {
            result.push({
                name: `usage-${mode}-${lower}`,
                lower,
                upper: USAGE_THRESHOLDS[index - 1],
                rows: members,
            });
        }
    }
    const withoutAllocation = groups.get('none');
    if (withoutAllocation) {
        result.push({name: `usage-${mode}-none`, notApplicable: true, rows: withoutAllocation});
    }
    const unknown = groups.get(undefined);
    if (unknown) {
        result.push({name: `usage-${mode}-unknown`, rows: unknown});
    }
    return result;
}
