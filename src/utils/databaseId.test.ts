jest.mock('../store', () => ({
    basename: '',
    clusterName: undefined,
    environment: undefined,
    backend: undefined,
    webVersion: false,
}));

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

describe('database navigation ID', () => {
    test.each([
        {isMetaDatabasesAvailable: false, useDatabaseId: false, expected: tenant.Name},
        {isMetaDatabasesAvailable: false, useDatabaseId: true, expected: tenant.Id},
        {isMetaDatabasesAvailable: true, useDatabaseId: false, expected: 'cp-id'},
        {isMetaDatabasesAvailable: true, useDatabaseId: true, expected: 'cp-id'},
    ])(
        'selects the ID for API mode $isMetaDatabasesAvailable and global flag $useDatabaseId',
        ({isMetaDatabasesAvailable, useDatabaseId, expected}) => {
            const link = getTenantLink({tenant, isMetaDatabasesAvailable, useDatabaseId});
            expect(link.database).toBe(expected);
            expect(new URL(link.href, 'https://ui.example.test').searchParams.get('database')).toBe(
                expected,
            );
        },
    );

    test.each([undefined, ''])('falls back without a CP ID (%s)', (id) => {
        const database = {...tenant, ControlPlane: id === undefined ? undefined : {id}};
        expect(getDatabaseNavigationId(database, {isMetaDatabasesAvailable: true})).toBe(
            tenant.Name,
        );
        expect(
            getDatabaseNavigationId(database, {
                isMetaDatabasesAvailable: true,
                useDatabaseId: true,
            }),
        ).toBe(tenant.Id);
    });

    test.each([{use_database_id: false}, {use_meta_proxy: false}])(
        'cluster opt-out overrides CP and global IDs (%j)',
        (settings) => {
            expect(
                getDatabaseNavigationId(tenant, {
                    settings,
                    isMetaDatabasesAvailable: true,
                    useDatabaseId: true,
                }),
            ).toBe(tenant.Name);
        },
    );
});

test('JSON cluster opt-out produces a path-based link', () => {
    const link = getTenantLink({
        tenant,
        isMetaDatabasesAvailable: true,
        useDatabaseId: true,
        settings: parseSettingsField('{"use_database_id":false}'),
    });
    const params = new URL(link.href, 'https://ui.example.test').searchParams;
    expect(params.get('database')).toBe(tenant.Name);
    expect(params.get('clusterName')).toBe(tenant.Cluster);
});

test('mixed-cluster list selects each row ID without cluster settings', () => {
    const rows = [tenant, {...tenant, Cluster: 'other', ControlPlane: undefined}];
    const links = rows.map((row) => getTenantLink({tenant: row, isMetaDatabasesAvailable: true}));
    expect(
        links.map(({href}) =>
            new URL(href, 'https://ui.example.test').searchParams.get('database'),
        ),
    ).toEqual(['cp-id', tenant.Name]);
    expect(new URL(links[1].href, 'https://ui.example.test').searchParams.get('clusterName')).toBe(
        'other',
    );
});

test.each([false, true])('direct backend uses paths with global ID flag=%s', (useDatabaseId) => {
    const prepareTenantBackend = jest.fn(() => 'https://viewer.example.test:8765');
    const link = getTenantLink({
        tenant,
        isMetaDatabasesAvailable: true,
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
    expect(getDatabaseNavigationId(shared, {isMetaDatabasesAvailable: true})).toBe('shared-cp-id');
    expect(
        getDatabaseNavigationId(shared, {
            isMetaDatabasesAvailable: true,
            backend: 'https://viewer.example.test',
        }),
    ).toBe(sharedName);
    expect(
        getDatabaseNavigationId(shared, {
            isMetaDatabasesAvailable: true,
            settings: {use_database_id: false},
        }),
    ).toBe(sharedName);
});

afterEach(() => jest.restoreAllMocks());

test.each([false, true])(
    'inherited backend keeps navigation in-app (webVersion=%s)',
    (webVersion) => {
        const backend = 'https://viewer.example.test:8765';
        const store = jest.requireMock('../store');
        jest.replaceProperty(store, 'backend', backend);
        jest.replaceProperty(store, 'webVersion', webVersion);

        const link = getTenantLink({tenant, isMetaDatabasesAvailable: true});
        const params = new URL(link.href, 'https://ui.example.test').searchParams;

        expect(link.database).toBe(tenant.Name);
        expect(link.isExternalLink).toBe(false);
        expect(params.get('backend')).toBe(webVersion ? backend : null);
    },
);
