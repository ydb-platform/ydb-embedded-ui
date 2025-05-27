import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';

import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import {GroupByValue} from './types';

// Only needed for tests values are present
const nodes: NodesPreparedEntity[] = [
    {
        // Storage node with many roles
        NodeId: 1,
        Version: '25-1-1',
        Roles: ['StateStorageBoard', 'SchemeBoard', 'Bootstrapper', 'StateStorage', 'Storage'],
    },
    {
        // Storage node
        NodeId: 2,
        Version: '25-1-2',
        Roles: ['Storage'],
    },
    {
        // Storage node
        NodeId: 3,
        Version: '25-1-3',
        Roles: ['Storage'],
    },
    {
        // Tenant node
        NodeId: 4,
        Version: '25-1-1',
        Roles: ['Tenant'],
        Tenants: ['/Root/db1'],
    },
    {
        // Tenant node
        NodeId: 5,
        Version: '25-1-2',
        Roles: ['Tenant'],
        Tenants: ['/Root/db2'],
    },
    {
        // Tenant node without Roles
        NodeId: 6,
        Version: '25-1-3',
        Tenants: ['/Root/db3'],
    },
    {
        // Node with some other role
        NodeId: 7,
        Version: '25-1-1',
        Roles: ['Bootstrapper'],
    },
    {
        // Node without roles
        NodeId: 8,
        Version: '25-1-1',
        Roles: [],
    },
];

describe('getGroupedTenantNodes', () => {
    test('should return undefined when nodes is undefined', () => {
        const result = getGroupedTenantNodes(undefined, undefined, GroupByValue.VERSION);
        expect(result).toBeUndefined();
    });

    test('should return undefined when nodes is empty', () => {
        const result = getGroupedTenantNodes([], undefined, GroupByValue.VERSION);
        expect(result).toBeUndefined();
    });

    test('should group tenant nodes by version when groupByValue is VERSION', () => {
        const versionToColor = new Map([
            ['25-1-1', 'red'],
            ['25-1-2', 'blue'],
            ['25-1-3', 'green'],
        ]);

        const result = getGroupedTenantNodes(nodes, versionToColor, GroupByValue.VERSION);

        expect(result).toHaveLength(3);

        // Check first version group (25-1-1)
        expect(result?.[0].title).toBe('25-1-1');
        expect(result?.[0].versionColor).toBe('red');
        expect(result?.[0].items).toHaveLength(1);
        expect(result?.[0].items?.[0].title).toBe('/Root/db1');
        expect(result?.[0].items?.[0].nodes).toHaveLength(1);
        expect(result?.[0].items?.[0].nodes?.[0].NodeId).toBe(4);

        // Check second version group (25-1-2)
        expect(result?.[1].title).toBe('25-1-2');
        expect(result?.[1].versionColor).toBe('blue');
        expect(result?.[1].items).toHaveLength(1);
        expect(result?.[1].items?.[0].title).toBe('/Root/db2');
        expect(result?.[1].items?.[0].nodes).toHaveLength(1);
        expect(result?.[1].items?.[0].nodes?.[0].NodeId).toBe(5);

        // Check third version group (25-1-3)
        expect(result?.[2].title).toBe('25-1-3');
        expect(result?.[2].versionColor).toBe('green');
        expect(result?.[2].items).toHaveLength(1);
        expect(result?.[2].items?.[0].title).toBe('/Root/db3');
        expect(result?.[2].items?.[0].nodes).toHaveLength(1);
        expect(result?.[2].items?.[0].nodes?.[0].NodeId).toBe(6);
    });

    test('should group tenant nodes by tenant when groupByValue is TENANT', () => {
        const versionToColor = new Map([
            ['25-1-1', 'red'],
            ['25-1-2', 'blue'],
            ['25-1-3', 'green'],
        ]);

        const result = getGroupedTenantNodes(nodes, versionToColor, GroupByValue.TENANT);

        expect(result).toHaveLength(3);

        // Check tenants are sorted alphabetically
        expect(result?.[0].title).toBe('/Root/db1');
        expect(result?.[1].title).toBe('/Root/db2');
        expect(result?.[2].title).toBe('/Root/db3');

        // Check first tenant group (/Root/db1)
        expect(result?.[0].items).toHaveLength(1);
        expect(result?.[0].items?.[0].title).toBe('25-1-1');
        expect(result?.[0].items?.[0].versionColor).toBe('red');
        expect(result?.[0].items?.[0].nodes).toHaveLength(1);
        expect(result?.[0].items?.[0].nodes?.[0].NodeId).toBe(4);

        // Check second tenant group (/Root/db2)
        expect(result?.[1].items).toHaveLength(1);
        expect(result?.[1].items?.[0].title).toBe('25-1-2');
        expect(result?.[1].items?.[0].versionColor).toBe('blue');
        expect(result?.[1].items?.[0].nodes).toHaveLength(1);
        expect(result?.[1].items?.[0].nodes?.[0].NodeId).toBe(5);

        // Check third tenant group (/Root/db3)
        expect(result?.[2].items).toHaveLength(1);
        expect(result?.[2].items?.[0].title).toBe('25-1-3');
        expect(result?.[2].items?.[0].versionColor).toBe('green');
        expect(result?.[2].items?.[0].nodes).toHaveLength(1);
        expect(result?.[2].items?.[0].nodes?.[0].NodeId).toBe(6);
    });
});

describe('getGroupedStorageNodes', () => {
    test('should return undefined when nodes is undefined', () => {
        const result = getGroupedStorageNodes(undefined, undefined);
        expect(result).toBeUndefined();
    });

    test('should return undefined when nodes is empty', () => {
        const result = getGroupedStorageNodes([], undefined);
        expect(result).toBeUndefined();
    });

    test('should group storage nodes by version', () => {
        const versionToColor = new Map([
            ['25-1-1', 'red'],
            ['25-1-2', 'blue'],
            ['25-1-3', 'green'],
        ]);

        const result = getGroupedStorageNodes(nodes, versionToColor);

        expect(result).toHaveLength(3);

        // Check first version group (25-1-1)
        expect(result?.[0].title).toBe('25-1-1');
        expect(result?.[0].versionColor).toBe('red');
        expect(result?.[0].nodes).toHaveLength(1);
        expect(result?.[0].nodes?.[0].NodeId).toBe(1);

        // Check second version group (25-1-2)
        expect(result?.[1].title).toBe('25-1-2');
        expect(result?.[1].versionColor).toBe('blue');
        expect(result?.[1].nodes).toHaveLength(1);
        expect(result?.[1].nodes?.[0].NodeId).toBe(2);

        // Check third version group (25-1-3)
        expect(result?.[2].title).toBe('25-1-3');
        expect(result?.[2].versionColor).toBe('green');
        expect(result?.[2].nodes).toHaveLength(1);
        expect(result?.[2].nodes?.[0].NodeId).toBe(3);
    });
});

describe('getOtherNodes', () => {
    test('should return undefined when nodes is undefined', () => {
        const result = getOtherNodes(undefined, undefined);
        expect(result).toBeUndefined();
    });

    test('should return undefined when nodes is empty', () => {
        const result = getOtherNodes([], undefined);
        expect(result).toBeUndefined();
    });

    test('should group other nodes by version', () => {
        const versionToColor = new Map([
            ['25-1-1', 'red'],
            ['25-1-2', 'blue'],
            ['25-1-3', 'green'],
        ]);

        const result = getOtherNodes(nodes, versionToColor);

        expect(result).toHaveLength(1);

        // Check first version group (25-1-1)
        expect(result?.[0].title).toBe('25-1-1');
        expect(result?.[0].versionColor).toBe('red');
        expect(result?.[0].nodes).toHaveLength(2);

        // The nodes with IDs 7 and 8 should be in the "other" category for version 25-1-1
        const nodeIds = result?.[0].nodes?.map((node) => node.NodeId);
        expect(nodeIds).toContain(7);
        expect(nodeIds).toContain(8);

        // Check that there are no storage or tenant nodes in the result
        result?.forEach((group) => {
            group.nodes?.forEach((node) => {
                expect(node.Roles?.includes('Storage')).toBeFalsy();
                expect(node.Tenants).toBeUndefined();
            });
        });
    });
});
