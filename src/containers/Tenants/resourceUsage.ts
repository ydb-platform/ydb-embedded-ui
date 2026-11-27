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

type PresetCatalogs = ReadonlyMap<string, ReadonlyMap<string, ResourcePreset>>;

/**
 * The catalog of a cluster has its common presets.
 * The catalog of a cloud in the cluster also has the presets restricted to that cloud.
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
    const preset =
        catalogs.get(presetCatalogKey(clusterName, cloudId))?.get(presetId) ??
        catalogs.get(presetCatalogKey(clusterName))?.get(presetId);
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

function parseBytes(value?: string | number) {
    if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) {
        return undefined;
    }
    const bytes = Number(value);
    return Number.isFinite(bytes) && bytes >= 0 ? bytes : undefined;
}

export interface StorageQuota {
    pool?: string;
    used?: number;
    limit?: number;
    source: 'reported' | 'configured';
}

function configuredLimit(hard?: string, soft?: string) {
    // SchemeShard uses the soft threshold as the hard threshold when only soft is set.
    const hardBytes = parseBytes(hard);
    return hardBytes || (parseBytes(soft) ?? hardBytes);
}

export function databaseStorageQuotas(row: PreparedTenant): StorageQuota[] {
    const report = row.DiskSpaceQuotaUsage;
    if (report) {
        const entries = report.Entries ?? [];
        if (report.Mode === 'MODE_OVERALL' && entries.length === 1 && !entries[0].PoolKind) {
            return [
                {
                    used: parseBytes(entries[0].Usage),
                    limit: parseBytes(entries[0].HardQuota),
                    source: 'reported',
                },
            ];
        }
        if (report.Mode === 'MODE_STORAGE_POOL_KINDS') {
            return entries
                .filter((entry) => entry.PoolKind)
                .map((entry) => ({
                    pool: entry.PoolKind,
                    used: parseBytes(entry.Usage),
                    limit: parseBytes(entry.HardQuota),
                    source: 'reported',
                }));
        }
        return [];
    }
    const config = row.DatabaseQuotas;
    if (config?.storage_quotas?.length) {
        // TablesStorage groups by media, while quotas are keyed by the exact pool kind.
        const quotas: StorageQuota[] = config.storage_quotas
            .filter((entry) => entry.unit_kind)
            .map((entry) => ({
                pool: entry.unit_kind,
                limit: configuredLimit(entry.data_size_hard_quota, entry.data_size_soft_quota),
                source: 'configured',
            }));
        const overallLimit = configuredLimit(
            config.data_size_hard_quota,
            config.data_size_soft_quota,
        );
        if (overallLimit) {
            quotas.unshift({limit: overallLimit, source: 'configured'});
        }
        return quotas;
    }
    const tables = row.TablesStorage ?? [];
    // Viewer copies the configured database-wide thresholds into one TablesStorage entry.
    const thresholds = tables.find(
        (table) => table.HardQuota !== undefined || table.SoftQuota !== undefined,
    );
    const limit = configuredLimit(
        config?.data_size_hard_quota ?? thresholds?.HardQuota,
        config?.data_size_soft_quota ?? thresholds?.SoftQuota,
    );
    const sizes = tables.map((table) => parseBytes(table.Size));
    const used =
        sizes.length && sizes.every((size): size is number => size !== undefined)
            ? sizes.reduce((total, size) => total + size, 0)
            : undefined;
    return [{used, limit, source: 'configured'}];
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
