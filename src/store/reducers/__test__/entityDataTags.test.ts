import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../api';
import {clusterApi} from '../cluster/cluster';
import {clustersApi} from '../clusters/clusters';
import {tenantApi} from '../tenant/tenant';
import {tenantsApi} from '../tenants/tenants';

jest.mock('../../../containers/Cluster/utils', () => ({
    clusterTabsIds: {tenants: 'tenants'},
    isClusterTab: (tab: string) => tab === 'tenants',
}));
jest.mock('../../../utils/hooks/useDatabaseFromQuery', () => ({
    useClusterNameFromQuery: jest.fn(),
}));
jest.mock('../../../utils/hooks/useDatabasesV2', () => ({
    useDatabasesV2: jest.fn(),
}));
jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: jest.fn(),
}));
jest.mock('../../../utils/parseBalancer', () => ({
    prepareBackendFromBalancer: jest.fn(),
}));

type EntityDataTag = Parameters<typeof api.util.selectInvalidatedBy>[1][number];

const DATABASE_LIST_TAG = {type: 'DatabaseData', id: 'LIST'} as const;
const CLUSTER_LIST_TAG = {type: 'ClusterData', id: 'LIST'} as const;

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

function selectInvalidatedQueries(store: ReturnType<typeof createTestStore>, tag: EntityDataTag) {
    return api.util.selectInvalidatedBy(store.getState(), [tag]).map((query) => ({
        endpointName: query.endpointName,
        originalArgs: query.originalArgs,
    }));
}

describe('entity data tags', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('targets database list queries with the database list tag', async () => {
        window.api = {
            meta: {
                getTenants: jest.fn().mockResolvedValue({TenantInfo: []}),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        const listArgs = {
            clusterName: 'cluster-a',
            environmentName: 'production',
            isMetaDatabasesAvailable: false,
        };
        const databaseArgs = {
            clusterName: 'cluster-a',
            database: '/Root/database',
            isMetaDatabasesAvailable: false,
        };

        await store.dispatch(
            tenantsApi.endpoints.getTenantsInfo.initiate(listArgs, {subscribe: false}),
        );
        await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(databaseArgs, {subscribe: false}),
        );

        expect(selectInvalidatedQueries(store, DATABASE_LIST_TAG)).toEqual([
            {endpointName: 'getTenantsInfo', originalArgs: listArgs},
        ]);
    });

    test('scopes a database entity tag by cluster and database', async () => {
        const database = '/Root/database';
        window.api = {
            meta: {
                getTenants: jest.fn().mockResolvedValue({
                    TenantInfo: [{Id: database, Name: database}],
                }),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        const clusterADatabaseArgs = {
            clusterName: 'cluster-a',
            database,
            isMetaDatabasesAvailable: false,
        };
        const clusterBDatabaseArgs = {
            clusterName: 'cluster-b',
            database,
            isMetaDatabasesAvailable: false,
        };

        await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(clusterADatabaseArgs, {subscribe: false}),
        );
        await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(clusterBDatabaseArgs, {subscribe: false}),
        );

        expect(
            selectInvalidatedQueries(store, {
                type: 'DatabaseData',
                id: '["cluster-a","/Root/database"]',
            }),
        ).toEqual([{endpointName: 'getTenantInfo', originalArgs: clusterADatabaseArgs}]);
    });

    test('targets the clusters list with the cluster list tag', async () => {
        window.api = {
            meta: {
                getClustersList: jest.fn().mockResolvedValue({clusters: []}),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            clustersApi.endpoints.getClustersList.initiate(undefined, {subscribe: false}),
        );

        expect(selectInvalidatedQueries(store, CLUSTER_LIST_TAG)).toEqual([
            {endpointName: 'getClustersList', originalArgs: undefined},
        ]);
    });

    test('uses one cluster entity tag for viewer and meta cluster data', async () => {
        window.api = {
            viewer: {
                getClusterInfo: jest.fn().mockResolvedValue({}),
            },
            meta: {
                getClusterBaseInfo: jest.fn().mockResolvedValue({}),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            clusterApi.endpoints.getClusterInfo.initiate('cluster-a', {subscribe: false}),
        );
        await store.dispatch(
            clusterApi.endpoints.getClusterBaseInfo.initiate('cluster-a', {subscribe: false}),
        );
        await store.dispatch(
            clusterApi.endpoints.getClusterInfo.initiate('cluster-b', {subscribe: false}),
        );
        await store.dispatch(
            clusterApi.endpoints.getClusterBaseInfo.initiate('cluster-b', {subscribe: false}),
        );

        expect(selectInvalidatedQueries(store, {type: 'ClusterData', id: 'cluster-a'})).toEqual([
            {endpointName: 'getClusterInfo', originalArgs: 'cluster-a'},
            {endpointName: 'getClusterBaseInfo', originalArgs: 'cluster-a'},
        ]);
    });
});
