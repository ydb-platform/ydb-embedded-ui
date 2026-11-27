import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import {
    allocatedResources,
    groupByResourceUsage,
    presetCatalogKey,
    requiredPreset,
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
    const row = {...dedicated, CoresUsed: 300, allocated: allocation};
    expect(groupByResourceUsage([row], 'cpu')[0]).toEqual({
        name: 'usage-cpu-0',
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
    ].map((CoresUsed) => ({...database({CoresUsed}), allocated: {cores: 100}}));
    const zeroCapacity = {...database({CoresUsed: 2}), allocated: {cores: 0}};
    const groups = groupByResourceUsage([...rows, zeroCapacity], 'cpu');
    expect(groups).toEqual([
        {name: 'usage-cpu-100', lower: 100, upper: undefined, rows: rows.slice(8, 10)},
        {name: 'usage-cpu-90', lower: 90, upper: 100, rows: rows.slice(6, 8)},
        {name: 'usage-cpu-75', lower: 75, upper: 90, rows: rows.slice(4, 6)},
        {name: 'usage-cpu-50', lower: 50, upper: 75, rows: rows.slice(2, 4)},
        {name: 'usage-cpu-0', lower: 0, upper: 50, rows: rows.slice(0, 2)},
        {
            name: 'usage-cpu-unknown',
            lower: undefined,
            rows: [...rows.slice(10), zeroCapacity],
        },
    ]);
    const withoutAllocation = rows.map((row) => database({CoresUsed: row.CoresUsed}));
    expect(groupByResourceUsage(withoutAllocation, 'cpu')).toEqual([
        {name: 'usage-cpu-unknown', lower: undefined, rows: withoutAllocation},
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
    // A serverless database without exclusive resources has no compute of its own.
    expect(allocatedResources({...dedicated, Type: 'Serverless'}, catalogs)).toBeNull();
    expect(
        allocatedResources({...dedicated, ControlPlane: {serverless_database: {}}}, catalogs),
    ).toBeNull();
    // Without Control Plane data there is nothing to tell that from.
    for (const ControlPlane of [undefined, {}]) {
        expect(
            allocatedResources(
                database({Type: 'Serverless', Cluster: 'cluster-a', ControlPlane}),
                catalogs,
            ),
        ).toBeUndefined();
    }
});

test('requires a preset only for a tenant with its own fixed compute size and preset ID', () => {
    expect(requiredPreset(dedicated)).toEqual({
        clusterName: 'cluster-a',
        cloudId: undefined,
        presetId: 'custom',
        size: 64,
    });
    expect(requiredPreset(database({}))).toBeUndefined();
    expect(
        requiredPreset(
            database({Cluster: 'cluster-a', ControlPlane: {resource_preset_id: 'custom'}}),
        ),
    ).toBeUndefined();
    expect(
        requiredPreset(
            database({
                Cluster: 'cluster-a',
                ControlPlane: {scale_policy: {fixed_scale: {size: 1}}},
            }),
        ),
    ).toBeUndefined();
    expect(
        requiredPreset(
            database({Cluster: 'cluster-a', Type: 'Serverless', sharedControlPlane: fixed}),
        ),
    ).toBeUndefined();
});

test('finds a preset restricted to the cloud of the database in the catalog of that cloud', () => {
    const restricted = {id: 'custom', cores: '4', memory: '4'};
    const cloudCatalogs = new Map([
        ['cluster-a', new Map([['common', preset]])],
        [presetCatalogKey('cluster-a', 'cloud-1'), new Map([[restricted.id, restricted]])],
    ]);
    const inCloud = (cloudId: string, viaControlPlane = false) => ({
        ...dedicated,
        ...(viaControlPlane
            ? {ControlPlane: {...fixed, cloud_id: cloudId}}
            : {UserAttributes: {cloud_id: cloudId}}),
    });

    expect(requiredPreset(inCloud('cloud-1'))?.cloudId).toBe('cloud-1');
    for (const row of [inCloud('cloud-1'), inCloud('cloud-1', true)]) {
        expect(allocatedResources(row, cloudCatalogs)?.cores).toBe(256);
    }
    // The preset is not listed for another cloud or without one
    expect(allocatedResources(inCloud('cloud-2'), cloudCatalogs)).toBeUndefined();
    expect(allocatedResources(dedicated, cloudCatalogs)).toBeUndefined();
    // A common preset needs no catalog of the cloud
    expect(allocatedResources(inCloud('cloud-2'), catalogs)).toEqual(allocation);
});

test('compares memory in bytes with the selected capacity, independently of CPU', () => {
    const row = {...dedicated, MemoryUsed: '1072505360384', MemoryLimit: '1200000000000'};
    const allocated = allocatedResources(row, catalogs);
    expect(groupByResourceUsage([{...row, allocated}], 'memory')[0].lower).toBe(0);
});

test('keeps missing memory and missing limits out of the zero-usage bucket', () => {
    const allocated = {memoryBytes: 100};
    const idle = {...database({MemoryUsed: '0'}), allocated};
    const missing = {...database({}), allocated};
    const invalid = {...database({MemoryUsed: ''}), allocated};
    const noAllocation = database({MemoryUsed: '40'});
    const rows = [idle, missing, invalid, noAllocation];
    expect(groupByResourceUsage(rows, 'memory')).toEqual([
        {name: 'usage-memory-0', lower: 0, upper: 50, rows: [idle]},
        {
            name: 'usage-memory-unknown',
            lower: undefined,
            rows: [missing, invalid, noAllocation],
        },
    ]);
});

test('keeps databases without their own compute apart from the ones with unknown allocation', () => {
    const used = {...dedicated, CoresUsed: 300, allocated: allocation};
    const serverless = {...database({Type: 'Serverless', CoresUsed: 1}), allocated: null};
    const unknown = database({CoresUsed: 1});
    expect(groupByResourceUsage([unknown, serverless, used], 'cpu')).toEqual([
        {name: 'usage-cpu-0', lower: 0, upper: 50, rows: [used]},
        {name: 'usage-cpu-none', notApplicable: true, rows: [serverless]},
        {name: 'usage-cpu-unknown', rows: [unknown]},
    ]);
});
