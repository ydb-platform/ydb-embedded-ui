import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import {
    allocatedResources,
    databaseStorageQuotas,
    groupByResourceUsage,
    needsPreset,
} from '../resourceUsage';

function database(fields: Partial<PreparedTenant>): PreparedTenant {
    return {
        controlPlaneName: '',
        sharedTenantName: undefined,
        sharedNodeIds: undefined,
        cpu: undefined,
        memory: undefined,
        storage: undefined,
        nodesCount: 0,
        groupsCount: 0,
        ...fields,
    };
}

const fixed = {resource_preset_id: 'custom', scale_policy: {fixed_scale: {size: 64}}};
const dedicated = database({
    Cluster: 'cluster-a',
    CoresUsed: 145.25,
    CoresTotal: 576,
    ControlPlane: fixed,
});
const preset = {id: 'custom', cores: '10', memory: '50'};
const catalogs = new Map([['cluster-a', new Map([[preset.id, preset]])]]);
const allocation = {cores: 640, memoryBytes: 3435973836800};

test('groups CPU usage using the allocation from the cluster catalog', () => {
    expect(allocatedResources(dedicated, catalogs)).toEqual(allocation);
    const row = {...dedicated, CoresUsed: 300};
    const allocations = new Map([[row, allocation]]);
    expect(groupByResourceUsage([row], 'allocated', allocations)[0]).toEqual({
        name: 'usage-allocated-0',
        lower: 0,
        upper: 50,
        rows: [row],
    });
    expect(allocatedResources({...dedicated, Cluster: 'other'}, catalogs)).toBeUndefined();
});

test('sorts by unrounded usage and keeps unknown values separate from zero', () => {
    const rows = [
        0,
        49.999,
        50,
        74.999,
        75,
        89.999,
        90,
        99.999,
        100,
        117,
        undefined,
        Infinity,
        -1,
    ].map((CoresUsed) => database({CoresUsed}));
    const zeroCapacity = database({CoresUsed: 2});
    const allocations = new Map(rows.map((row) => [row, {cores: 100}]));
    allocations.set(zeroCapacity, {cores: 0});
    const groups = groupByResourceUsage([...rows, zeroCapacity], 'allocated', allocations);
    expect(groups).toEqual([
        {name: 'usage-allocated-100', lower: 100, upper: undefined, rows: rows.slice(8, 10)},
        {name: 'usage-allocated-90', lower: 90, upper: 100, rows: rows.slice(6, 8)},
        {name: 'usage-allocated-75', lower: 75, upper: 90, rows: rows.slice(4, 6)},
        {name: 'usage-allocated-50', lower: 50, upper: 75, rows: rows.slice(2, 4)},
        {name: 'usage-allocated-0', lower: 0, upper: 50, rows: rows.slice(0, 2)},
        {
            name: 'usage-allocated-unknown',
            lower: undefined,
            rows: [...rows.slice(10), zeroCapacity],
        },
    ]);
    expect(groupByResourceUsage(rows, 'allocated', new Map())).toEqual([
        {name: 'usage-allocated-unknown', lower: undefined, rows},
    ]);
});

test('does not infer allocation from a preset name, runtime nodes or an automatic scaling policy', () => {
    expect(
        allocatedResources({...dedicated, ControlPlane: {resource_preset_id: 'custom'}}, catalogs),
    ).toBeUndefined();
    expect(
        allocatedResources(
            {...dedicated, ControlPlane: {...fixed, resource_preset_id: 'oltp-c10-m50'}},
            catalogs,
        ),
    ).toBeUndefined();
    const incompletePreset = new Map([
        ['cluster-a', new Map([['custom', {...preset, memory: ''}]])],
    ]);
    expect(allocatedResources(dedicated, incompletePreset)).toEqual({
        cores: 640,
        memoryBytes: undefined,
    });
});

test('supports nested and legacy fixed compute and only the tenant’s own exclusive resources', () => {
    const legacy = {...fixed, dedicated_database: {}};
    const nested = {
        id: 'id',
        shared_database: {resource_preset_id: 'custom', scale_policy: {fixed_scale: {size: '64'}}},
    };
    const exclusive = {id: 'id', serverless_database: {exclusive_compute_resources: fixed}};
    expect(allocatedResources({...dedicated, ControlPlane: legacy}, catalogs)).toEqual(allocation);
    expect(allocatedResources({...dedicated, ControlPlane: nested}, catalogs)).toEqual(allocation);
    expect(
        allocatedResources({...dedicated, Type: 'Serverless', ControlPlane: exclusive}, catalogs),
    ).toEqual(allocation);
    expect(allocatedResources({...dedicated, Type: 'Serverless'}, catalogs)).toBeUndefined();
});

test('requests a catalog only for a tenant with its own fixed compute size and preset ID', () => {
    expect(needsPreset(dedicated)).toBe(true);
    expect(needsPreset(database({}))).toBe(false);
    expect(needsPreset(database({ControlPlane: {resource_preset_id: 'custom'}}))).toBe(false);
    expect(needsPreset(database({ControlPlane: {scale_policy: {fixed_scale: {size: 1}}}}))).toBe(
        false,
    );
    expect(needsPreset(database({Type: 'Serverless', sharedControlPlane: fixed}))).toBe(false);
});

test('compares memory in bytes with the selected capacity, independently of CPU', () => {
    const row = {...dedicated, MemoryUsed: '1072505360384', MemoryLimit: '1200000000000'};
    const allocations = new Map([[row, allocatedResources(row, catalogs)]]);
    expect(groupByResourceUsage([row], 'memory-allocated', allocations)[0].lower).toBe(0);
});

test('keeps missing memory and missing limits out of the zero-usage bucket', () => {
    const idle = database({MemoryUsed: '0'});
    const missing = database({});
    const invalid = database({MemoryUsed: ''});
    const noAllocation = database({MemoryUsed: '40'});
    const rows = [idle, missing, invalid, noAllocation];
    const allocations = new Map([idle, missing, invalid].map((row) => [row, {memoryBytes: 100}]));
    expect(groupByResourceUsage(rows, 'memory-allocated', allocations)).toEqual([
        {name: 'usage-memory-allocated-0', lower: 0, upper: 50, rows: [idle]},
        {
            name: 'usage-memory-allocated-unknown',
            lower: undefined,
            rows: [missing, invalid, noAllocation],
        },
    ]);
});

test('reads usage and hard limit from the effective report, keeping distinct pool quotas', () => {
    const overall = database({
        DiskSpaceQuotaUsage: {Mode: 'MODE_OVERALL', Entries: [{Usage: '0', HardQuota: '100'}]},
        StorageAllocatedSize: '9999',
        StorageAllocatedLimit: '11111',
        DatabaseQuotas: {data_size_hard_quota: '300'},
        TablesStorage: [{Type: 'SSD', Size: '45'}],
    });
    const pools = database({
        DiskSpaceQuotaUsage: {
            Mode: 'MODE_STORAGE_POOL_KINDS',
            Entries: [
                {PoolKind: 'ssd', Usage: '95', HardQuota: '100'},
                {PoolKind: 'hdd', Usage: '200', HardQuota: '1000'},
                {PoolKind: 'archive', Usage: '500', HardQuota: '0'},
            ],
        },
    });
    const unknown = database({
        DiskSpaceQuotaUsage: {Mode: 'MODE_UNSPECIFIED'},
        TablesStorage: [{Type: 'HDD', Size: '1', HardQuota: '2'}],
    });
    expect(databaseStorageQuotas(overall)).toEqual([{used: 0, limit: 100, source: 'reported'}]);
    expect(databaseStorageQuotas(pools).map((q) => [q.pool, q.used, q.limit])).toEqual([
        ['ssd', 95, 100],
        ['hdd', 200, 1000],
        ['archive', 500, 0],
    ]);
    expect(databaseStorageQuotas(unknown)).toEqual([]);
});

test('estimates only complete database-wide usage and keeps configured limits separate', () => {
    const legacy = database({
        DatabaseQuotas: {data_size_hard_quota: '100'},
        TablesStorage: [
            {Type: 'SSD', Size: '40', Limit: '90'},
            {Type: 'HDD', Size: '15'},
        ],
    });
    expect(databaseStorageQuotas(legacy)).toEqual([{used: 55, limit: 100, source: 'configured'}]);
    expect(
        databaseStorageQuotas({
            ...legacy,
            TablesStorage: [{Type: 'SSD', Size: '0'}, {Type: 'HDD'}],
        }),
    ).toEqual([{used: undefined, limit: 100, source: 'configured'}]);
    expect(
        databaseStorageQuotas({
            ...legacy,
            DatabaseQuotas: undefined,
            TablesStorage: [{Type: 'SSD', Size: '0', Limit: '90'}],
        }),
    ).toEqual([{used: 0, limit: undefined, source: 'configured'}]);
    expect(
        databaseStorageQuotas({...legacy, DatabaseQuotas: {data_size_soft_quota: '110'}})[0].limit,
    ).toBe(110);
    expect(
        databaseStorageQuotas({
            ...legacy,
            DatabaseQuotas: {storage_quotas: [{unit_kind: 'ssd-fast', data_size_hard_quota: '60'}]},
        }),
    ).toEqual([{pool: 'ssd-fast', limit: 60, source: 'configured'}]);
});
