import {getTenantLink} from '../components/TenantNameWrapper/utils';
import {parseSettingsField} from '../store/reducers/cluster/parseFields';
import type {PreparedTenant} from '../store/reducers/tenants/types';
import {prepareTenants} from '../store/reducers/tenants/utils';

import {getDatabaseNavigationId} from './databaseId';

const tenant: PreparedTenant = {
    Name: '/vault-sam/agent_states/prod/state',
    Id: 'viewer-id',
    Cluster: 'vault-sam',
    ControlPlane: {id: 'cp-id'},
    controlPlaneName: 'prod/state',
    sharedTenantName: undefined,
    sharedNodeIds: undefined,
    cpu: undefined,
    memory: undefined,
    storage: undefined,
    nodesCount: 0,
    groupsCount: 0,
};

describe.each(['object', 'JSON'])('database navigation (%s settings)', (format) => {
    test.each([
        {
            name: 'CP ID takes precedence over viewer ID',
            cpId: 'cp-id',
            global: false,
            settings: {},
            expected: 'cp-id',
        },
        {
            name: 'CP ID takes precedence over global flag',
            cpId: 'cp-id',
            global: true,
            settings: {},
            expected: 'cp-id',
        },
        {
            name: 'no CP keeps paths',
            cpId: undefined,
            global: false,
            settings: {},
            expected: tenant.Name,
        },
        {
            name: 'empty CP ID keeps paths',
            cpId: '',
            global: false,
            settings: {},
            expected: tenant.Name,
        },
        {
            name: 'global flag keeps legacy IDs',
            cpId: undefined,
            global: true,
            settings: {},
            expected: 'viewer-id',
        },
        {
            name: 'cluster opt-out overrides CP and global flag',
            cpId: 'cp-id',
            global: true,
            settings: {use_database_id: false},
            expected: tenant.Name,
        },
        {
            name: 'disabled meta proxy keeps paths',
            cpId: 'cp-id',
            global: true,
            settings: {use_meta_proxy: false},
            expected: tenant.Name,
        },
    ])('$name', ({cpId, global, settings, expected}) => {
        const parsed = parseSettingsField(format === 'JSON' ? JSON.stringify(settings) : settings);
        const link = getTenantLink({
            tenant: {...tenant, ControlPlane: cpId === undefined ? undefined : {id: cpId}},
            useDatabaseId: global,
            settings: parsed,
        });
        const params = new URL(link.href, 'https://ui.example.test').searchParams;
        expect(link.database).toBe(expected);
        expect(params.get('database')).toBe(expected);
        expect(params.get('clusterName')).toBe('vault-sam');
    });
});

test('mixed-cluster list selects each row ID without cluster settings', () => {
    const rows = [tenant, {...tenant, Cluster: 'other', ControlPlane: undefined}];
    const links = rows.map((row) => getTenantLink({tenant: row}));
    expect(links.map(({database}) => database)).toEqual(['cp-id', tenant.Name]);
    expect(new URL(links[1].href, 'https://ui.example.test').searchParams.get('clusterName')).toBe(
        'other',
    );
});

test.each([false, true])('direct backend uses paths with global ID flag=%s', (useDatabaseId) => {
    const prepareTenantBackend = jest.fn(() => 'https://viewer.example.test:8765');
    const link = getTenantLink({
        tenant,
        useDatabaseId,
        additionalTenantsProps: {prepareTenantBackend},
    });
    const params = new URL(link.href, 'https://ui.example.test').searchParams;
    expect(link.database).toBe(tenant.Name);
    expect(params.get('database')).toBe(tenant.Name);
    expect(params.get('backend')).toBe('https://viewer.example.test:8765');
    expect(prepareTenantBackend).toHaveBeenCalledTimes(1);
});

test('missing IDs fall back to the path even when globally enabled', () => {
    expect(getDatabaseNavigationId({Name: tenant.Name}, {useDatabaseId: true})).toBe(tenant.Name);
});

test('shared navigation uses the shared database CP ID, not the serverless ID', () => {
    const sharedName = '/vault-sam/shared';
    const [serverless] = prepareTenants([
        {...tenant, Type: 'Serverless', ResourceId: 'shared-viewer-id'},
        {
            Name: sharedName,
            Id: 'shared-viewer-id',
            Type: 'Shared',
            ControlPlane: {id: 'shared-cp-id'},
        },
    ]);
    const shared = {
        Name: serverless.sharedTenantName,
        Id: serverless.ResourceId,
        ControlPlane: serverless.sharedControlPlane,
    };
    expect(getDatabaseNavigationId(shared)).toBe('shared-cp-id');
    expect(getDatabaseNavigationId(shared, {backend: 'https://viewer.example.test'})).toBe(
        sharedName,
    );
    expect(getDatabaseNavigationId(shared, {settings: {use_database_id: false}})).toBe(sharedName);
});
