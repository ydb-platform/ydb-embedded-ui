import {getTenantLink} from '../components/TenantNameWrapper/utils';
import {parseSettingsField} from '../store/reducers/cluster/parseFields';
import type {PreparedTenant} from '../store/reducers/tenants/types';

import {shouldUseDatabaseId} from './databaseId';

const tenant: PreparedTenant = {
    Name: '/vault-sam/agent_states/prod/state',
    Id: 'cp-database-id',
    Cluster: 'vault-sam',
    controlPlaneName: 'prod/state',
    sharedTenantName: undefined,
    sharedNodeIds: undefined,
    cpu: undefined,
    memory: undefined,
    storage: undefined,
    nodesCount: 0,
    groupsCount: 0,
};

const controlPlane = 'grpcs://ydbcp.yandex.net:8787';

describe.each(['object', 'JSON'])('database navigation (%s settings)', (format) => {
    test.each([
        {name: 'CP enables IDs', cp: controlPlane, global: false, settings: {}, id: true},
        {name: 'no CP keeps paths', cp: undefined, global: false, settings: {}, id: false},
        {name: 'empty CP keeps paths', cp: '', global: false, settings: {}, id: false},
        {name: 'global flag keeps IDs', cp: undefined, global: true, settings: {}, id: true},
        {
            name: 'cluster opt-out overrides CP',
            cp: controlPlane,
            global: false,
            settings: {use_database_id: false},
            id: false,
        },
        {
            name: 'cluster opt-out overrides global flag',
            cp: controlPlane,
            global: true,
            settings: {use_database_id: false},
            id: false,
        },
        {
            name: 'ID opt-in still requires CP or global flag',
            cp: undefined,
            global: false,
            settings: {use_database_id: true},
            id: false,
        },
        {
            name: 'disabled meta proxy keeps paths',
            cp: controlPlane,
            global: true,
            settings: {use_meta_proxy: false},
            id: false,
        },
    ])('$name', ({cp, global, settings, id}) => {
        const parsed = parseSettingsField(format === 'JSON' ? JSON.stringify(settings) : settings);
        const link = getTenantLink({
            tenant,
            useDatabaseId: shouldUseDatabaseId({control_plane: cp, settings: parsed}, global),
        });
        const params = new URL(link.href, 'https://ui.example.test').searchParams;

        expect(link.database).toBe(id ? tenant.Id : tenant.Name);
        expect(params.get('database')).toBe(id ? tenant.Id : tenant.Name);
        expect(params.get('clusterName')).toBe('vault-sam');
    });
});

test('missing cluster data keeps paths unless globally enabled', () => {
    expect(shouldUseDatabaseId({})).toBe(false);
    expect(shouldUseDatabaseId({}, true)).toBe(true);
});
