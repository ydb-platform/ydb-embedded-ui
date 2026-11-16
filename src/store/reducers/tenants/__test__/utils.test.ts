import type {TTenant} from '../../../../types/api/tenant';
import {EType} from '../../../../types/api/tenant';
import {calculateTenantMetrics, prepareTenants} from '../utils';

describe('calculateTenantMetrics', () => {
    test('keeps legacy storage metric card values for prod payload without tablet quota', () => {
        const result = calculateTenantMetrics({
            TablesStorage: [{Type: EType.SSD, Size: '35915303563'}],
            StorageAllocatedSize: '492778291200',
            StorageAllocatedLimit: '6399113297920',
            DatabaseStorage: [
                {
                    Type: EType.SSD,
                    Size: '492778291200',
                    Limit: '6399113297920',
                },
            ],
            DatabaseQuotas: {},
        });

        expect(result.tabletStorage).toBe(35_915_303_563);
        expect(result.tabletStorageStats).toEqual([
            {
                name: EType.SSD,
                used: 35_915_303_563,
                limit: undefined,
                usage: undefined,
            },
        ]);
        expect(result.storageMetricStats).toEqual([
            {
                name: EType.SSD,
                used: 492_778_291_200,
                limit: 6_399_113_297_920,
                usage: expect.any(Number),
            },
        ]);
        expect(result.storageMetricStats[0]?.usage).toBeCloseTo(7.701);
    });

    test('keeps per-media quotas out of legacy storage metric card values', () => {
        const result = calculateTenantMetrics({
            StorageAllocatedSize: '500',
            StorageAllocatedLimit: '1000',
            DatabaseStorage: [{Type: EType.SSD, Size: '500', Limit: '1000'}],
            DatabaseQuotas: {
                storage_quotas: [{unit_kind: EType.SSD, data_size_soft_quota: '900'}],
            },
            TablesStorage: [{Type: EType.SSD, Size: '90'}],
        });

        expect(result.tabletStorageStats).toEqual([
            {name: EType.SSD, used: 90, limit: 900, usage: 10},
        ]);
        expect(result.storageMetricStats).toEqual([
            {name: EType.SSD, used: 500, limit: 1000, usage: 50},
        ]);
    });

    test('normalizes invalid storage sizes and limits', () => {
        const result = calculateTenantMetrics({
            DatabaseStorage: [{Type: EType.SSD}, {Type: EType.HDD, Size: '200', Limit: 'invalid'}],
            DatabaseQuotas: {
                storage_quotas: [{unit_kind: EType.HDD, data_size_soft_quota: '800'}],
            },
            TablesStorage: [
                {Type: EType.SSD, Size: 'invalid', Limit: 'invalid'},
                {Type: EType.HDD, Size: '100', Limit: '300', SoftQuota: 'invalid'},
            ],
        });

        expect(result.blobStorageStats).toEqual([
            {name: EType.SSD, used: 0, limit: undefined, usage: undefined},
            {name: EType.HDD, used: 200, limit: undefined, usage: undefined},
        ]);
        expect(result.tabletStorageStats).toEqual([
            {name: EType.SSD, used: 0, limit: undefined, usage: undefined},
            {name: EType.HDD, used: 100, limit: 800, usage: 12.5},
        ]);
    });

    test('uses per-media storage quotas when table storage limit is missing', () => {
        const result = calculateTenantMetrics({
            DatabaseQuotas: {
                data_size_soft_quota: '612032839680',
                storage_quotas: [
                    {unit_kind: 'ssd', data_size_soft_quota: '306016419840'},
                    {unit_kind: 'hdd', data_size_soft_quota: '2089072092774'},
                ],
            },
            DatabaseStorage: [
                {Type: EType.HDD, Size: '1353743073280', Limit: '17999012094860'},
                {Type: EType.SSD, Size: '98419343360', Limit: '1873981472766'},
            ],
            TablesStorage: [
                {
                    Type: EType.HDD,
                    Size: '289166965049',
                    Limit: '612032839680',
                    SoftQuota: '612032839680',
                },
                {Type: EType.SSD, Size: '986'},
            ],
        });

        expect(result.tabletStorageStats).toEqual([
            {
                name: EType.HDD,
                used: 289166965049,
                limit: 612032839680,
                usage: expect.any(Number),
            },
            {name: EType.SSD, used: 986, limit: 306016419840, usage: expect.any(Number)},
        ]);
        expect(result.tabletStorageStats?.[0]?.usage).toBeCloseTo(47.247);
        expect(result.tabletStorageStats?.[1]?.usage).toBeCloseTo(0.000000322);
    });

    test('ignores invalid per-media quota and falls back to table storage limit', () => {
        const result = calculateTenantMetrics({
            DatabaseQuotas: {
                storage_quotas: [{unit_kind: EType.SSD, data_size_soft_quota: 'invalid'}],
            },
            TablesStorage: [{Type: EType.SSD, Size: '100', Limit: '300'}],
        });

        expect(result.tabletStorageStats).toEqual([
            {name: EType.SSD, used: 100, limit: 300, usage: expect.any(Number)},
        ]);
        expect(result.tabletStorageStats?.[0]?.usage).toBeCloseTo(33.333333333333336);
    });

    test('normalizes table storage type before per-media quota lookup', () => {
        const result = calculateTenantMetrics({
            DatabaseQuotas: {
                storage_quotas: [{unit_kind: 'hdd', data_size_soft_quota: '900'}],
            },
            TablesStorage: [{Type: 'ROT', Size: '90'}],
        });

        expect(result.tabletStorageStats).toEqual([
            {name: EType.HDD, used: 90, limit: 900, usage: 10},
        ]);
    });

    test('marks aggregate storage fallbacks with None media type', () => {
        const result = calculateTenantMetrics({
            StorageAllocatedSize: '100',
            StorageAllocatedLimit: '500',
            DatabaseQuotas: {
                data_size_soft_quota: '1000',
            },
        });

        expect(result.blobStorageStats).toEqual([
            {name: EType.None, used: 100, limit: 500, usage: 20},
        ]);
        expect(result.tabletStorageStats).toEqual([
            {name: EType.None, used: 0, limit: 1000, usage: undefined},
        ]);
    });
});

describe('prepareTenants', () => {
    const shared: TTenant = {Id: 'shared', Name: '/Root/shared', NodeIds: [1, 2]};
    const serverless: TTenant = {
        Id: 'serverless',
        Name: '/Root/serverless',
        ResourceId: 'shared',
    };

    test('returns an empty list for empty input', () => {
        expect(prepareTenants([])).toEqual([]);
    });

    test('leaves shared fields undefined when no Id matches the ResourceId', () => {
        const tenants: TTenant[] = [
            shared,
            {Id: 'missing', ResourceId: 'absent'},
            {Id: 'unset'},
            {Id: 'empty', ResourceId: ''},
        ];

        prepareTenants(tenants)
            .slice(1)
            .forEach((row) => {
                expect(row.sharedTenantName).toBeUndefined();
                expect(row.sharedNodeIds).toBeUndefined();
            });
    });

    test('keeps the first missing and empty Id without conflating them', () => {
        const tenants: TTenant[] = [
            {Id: '', Name: '/Root/empty', NodeIds: [5]},
            {Name: '/Root/omitted', NodeIds: [6]},
            {Id: '', Name: '/Root/duplicate-empty', NodeIds: [7]},
            {Name: '/Root/duplicate-omitted', NodeIds: [8]},
            {Id: 'omitted-resource'},
            {Id: 'empty-resource', ResourceId: ''},
        ];
        const result = prepareTenants(tenants);

        expect(result[4].sharedTenantName).toBe('/Root/omitted');
        expect(result[4].sharedNodeIds).toBe(tenants[1].NodeIds);
        expect(result[5].sharedTenantName).toBe('/Root/empty');
        expect(result[5].sharedNodeIds).toBe(tenants[0].NodeIds);
    });

    test('keeps the first duplicate Id even when a later match is in the consumer cluster', () => {
        const tenants: TTenant[] = [
            {...shared, Cluster: 'cluster-a'},
            {...shared, Cluster: 'cluster-b', Name: '/Root/duplicate', NodeIds: [9]},
            {...serverless, Cluster: 'cluster-b'},
        ];
        const row = prepareTenants(tenants)[2];

        expect(row.sharedTenantName).toBe('/Root/shared');
        expect(row.sharedNodeIds).toBe(tenants[0].NodeIds);
    });

    test('prepares consumers on both sides of a shared row without changing input or order', () => {
        const first: TTenant = {
            ...serverless,
            ControlPlane: {name: 'control-plane'},
            CoresUsed: 1.5,
            MemoryUsed: '100',
            StorageAllocatedSize: '200',
            StorageGroups: '3',
            NodeIds: [7],
            Owner: 'owner',
        };
        const second: TTenant = {...serverless, Id: 'second', Name: '/Root/second'};
        const tenants = [first, shared, second];
        const snapshot = JSON.stringify(tenants);
        tenants.forEach((tenant) => Object.freeze(tenant));
        Object.freeze(tenants);

        const result = prepareTenants(tenants);

        expect(result.map((row) => row.Id)).toEqual(['serverless', 'shared', 'second']);
        expect(result[0]).toEqual({
            ...first,
            sharedTenantName: '/Root/shared',
            sharedNodeIds: [1, 2],
            controlPlaneName: 'control-plane',
            cpu: 1_500_000,
            memory: 100,
            storage: 200,
            nodesCount: 1,
            groupsCount: 3,
        });
        expect(result[2]).toMatchObject({
            sharedTenantName: '/Root/shared',
            controlPlaneName: 'second',
        });
        expect(result[0].sharedNodeIds).toBe(shared.NodeIds);
        expect(result[2].sharedNodeIds).toBe(shared.NodeIds);
        expect(JSON.stringify(tenants)).toBe(snapshot);
        result.forEach((row, index) => expect(row).not.toBe(tenants[index]));
    });
});
