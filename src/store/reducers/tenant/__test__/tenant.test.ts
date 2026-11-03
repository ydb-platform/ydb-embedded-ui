import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {parseMetaTenants} from '../../../../services/parsers/parseMetaTenants';
import type {TTenant} from '../../../../types/api/tenant';
import {api} from '../../api';
import {tenantApi} from '../tenant';

jest.mock('../../../../utils/hooks/useDatabaseFromQuery', () => ({
    useClusterNameFromQuery: jest.fn(),
}));
jest.mock('../../../../utils/hooks/useDatabasesV2', () => ({
    useDatabasesV2: jest.fn(),
}));

const queryArgs = {
    database: '/local/database',
    isMetaDatabasesAvailable: false,
};

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

describe('tenantApi.getTenantInfo', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('returns EMPTY_TENANT_INFO when TenantInfo is empty', async () => {
        window.api = {
            viewer: {
                getTenantInfo: jest.fn().mockResolvedValue({TenantInfo: []}),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(queryArgs, {subscribe: false}),
        );

        expect(result).toMatchObject({
            status: 'rejected',
            error: {code: 'EMPTY_TENANT_INFO'},
        });
    });

    test('retains the last valid tenant when an empty refetch is rejected', async () => {
        const tenant: TTenant = {
            Id: '/local/database',
            Name: '/local/database',
            Type: 'Dedicated',
        };
        window.api = {
            viewer: {
                getTenantInfo: jest
                    .fn()
                    .mockResolvedValueOnce({TenantInfo: [tenant]})
                    .mockResolvedValueOnce({TenantInfo: []}),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(queryArgs, {subscribe: false}),
        );
        await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(queryArgs, {
                subscribe: false,
                forceRefetch: true,
            }),
        );

        expect(tenantApi.endpoints.getTenantInfo.select(queryArgs)(store.getState())).toMatchObject(
            {
                status: 'rejected',
                error: {code: 'EMPTY_TENANT_INFO'},
                data: expect.objectContaining({Id: tenant.Id, Name: tenant.Name}),
            },
        );
    });

    test('selects an exact database match when it is not the first item', async () => {
        const firstTenant: TTenant = {Id: '/local/first', Name: '/local/first'};
        const matchingTenant: TTenant = {Id: '/local/database', Name: '/local/database'};
        window.api = {
            viewer: {
                getTenantInfo: jest
                    .fn()
                    .mockResolvedValue({TenantInfo: [firstTenant, matchingTenant]}),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(queryArgs, {subscribe: false}),
        );

        expect(result).toMatchObject({
            status: 'fulfilled',
            data: expect.objectContaining({Id: matchingTenant.Id, Name: matchingTenant.Name}),
        });
    });

    test.each([false, true])(
        'selects a non-first database by CP ID from an unfiltered meta response (V2=%s)',
        async (isMetaDatabasesAvailable) => {
            const firstTenant: TTenant = {
                Id: 'viewer-first',
                Name: '/local/first',
                ControlPlane: {id: 'cp-first'},
            };
            const matchingTenant: TTenant = {
                Id: 'viewer-second',
                Name: '/local/second',
                ControlPlane: {id: 'cp-second'},
            };
            const getTenants = jest
                .fn()
                .mockResolvedValue({TenantInfo: [firstTenant, matchingTenant]});
            window.api = {
                meta: {getTenants, getTenantsV2: getTenants},
            } as unknown as YdbEmbeddedAPI;
            const store = createTestStore();

            const result = await store.dispatch(
                tenantApi.endpoints.getTenantInfo.initiate(
                    {database: 'cp-second', clusterName: 'test-cluster', isMetaDatabasesAvailable},
                    {subscribe: false},
                ),
            );

            expect(getTenants).toHaveBeenCalledWith(
                {database: 'cp-second', clusterName: 'test-cluster'},
                expect.objectContaining({signal: expect.any(AbortSignal)}),
            );
            expect(result).toMatchObject({
                status: 'fulfilled',
                data: expect.objectContaining(matchingTenant),
            });
        },
    );

    test('uses the first database for the legacy meta path when no exact match exists', async () => {
        const firstTenant: TTenant = {Id: '/local/first', Name: '/local/first'};
        const secondTenant: TTenant = {Id: '/local/second', Name: '/local/second'};
        const getTenants = jest.fn().mockResolvedValue({TenantInfo: [firstTenant, secondTenant]});
        window.api = {
            meta: {getTenants},
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(
                {...queryArgs, clusterName: 'test-cluster'},
                {subscribe: false},
            ),
        );

        expect(getTenants).toHaveBeenCalledWith(
            {database: queryArgs.database, clusterName: 'test-cluster'},
            expect.objectContaining({signal: expect.any(AbortSignal)}),
        );
        expect(result).toMatchObject({
            status: 'fulfilled',
            data: expect.objectContaining({Id: firstTenant.Id, Name: firstTenant.Name}),
        });
    });
    const compositeArgs = {...queryArgs, clusterName: 'cluster', isMetaDatabasesAvailable: true};
    const cpTenant: TTenant = {
        Id: 'cp-id',
        Name: queryArgs.database,
        ControlPlane: {id: 'cp-id', name: 'Display'},
    };

    test('keeps CP-only data raw without fabricated runtime counters and preserves partial errors', async () => {
        const getTenantsV2 = jest
            .fn()
            .mockResolvedValue({TenantInfo: [cpTenant], sourceErrors: {viewer: 'Unavailable'}});
        window.api = {meta: {getTenantsV2}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        const result = await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(compositeArgs),
        );
        expect(result.data).toEqual({
            ...cpTenant,
            availability: 'control-plane',
            sourceErrors: {viewer: 'Unavailable'},
        });
        expect(result.data).not.toHaveProperty('nodesCount');
        expect(result.data).not.toHaveProperty('cpu');
        expect(getTenantsV2).toHaveBeenCalledTimes(1);
    });

    test('rejects unrelated CP-only records instead of selecting the first item', async () => {
        window.api = {
            meta: {
                getTenantsV2: jest.fn().mockResolvedValue({
                    TenantInfo: [{...cpTenant, Name: '/other', Id: 'other-id'}],
                    sourceErrors: {viewer: 'Unavailable'},
                }),
            },
        } as unknown as YdbEmbeddedAPI;
        const result = await createTestStore().dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(compositeArgs),
        );
        expect(result).toMatchObject({status: 'rejected', error: {code: 'EMPTY_TENANT_INFO'}});
    });

    test('retains runtime data when only CP fails and supports recovery from CP-only', async () => {
        window.api = {
            meta: {
                getTenantsV2: jest
                    .fn()
                    .mockResolvedValueOnce({
                        TenantInfo: [cpTenant],
                        sourceErrors: {viewer: 'Unavailable'},
                    })
                    .mockResolvedValueOnce({
                        TenantInfo: [{...cpTenant, NodeIds: [1, 2]}],
                        sourceErrors: {control_plane: 'Unavailable'},
                    }),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        await store.dispatch(tenantApi.endpoints.getTenantInfo.initiate(compositeArgs));
        const result = await store.dispatch(
            tenantApi.endpoints.getTenantInfo.initiate(compositeArgs, {forceRefetch: true}),
        );
        expect(result.data).toMatchObject({
            availability: 'runtime',
            nodesCount: 2,
            sourceErrors: {control_plane: 'Unavailable'},
        });
    });

    test('deduplicates direct extension subscribers with existing arguments', async () => {
        const getTenantsV2 = jest
            .fn()
            .mockResolvedValue({TenantInfo: [cpTenant], sourceErrors: {viewer: 'Unavailable'}});
        window.api = {meta: {getTenantsV2}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        await Promise.all([
            store.dispatch(tenantApi.endpoints.getTenantInfo.initiate(compositeArgs)),
            store.dispatch(tenantApi.endpoints.getTenantInfo.initiate({...compositeArgs})),
        ]);
        expect(getTenantsV2).toHaveBeenCalledTimes(1);
    });

    test('late pre-reset responses cannot overwrite a new scope with the same database', async () => {
        let resolvePrevious: (value: unknown) => void = () => undefined;
        const pending = new Promise((resolve) => {
            resolvePrevious = resolve;
        });
        window.api = {
            meta: {
                getTenantsV2: jest
                    .fn()
                    .mockReturnValueOnce(pending)
                    .mockResolvedValueOnce({
                        TenantInfo: [{...cpTenant, ControlPlane: {id: 'new-scope'}}],
                        sourceErrors: {viewer: 'Unavailable'},
                    }),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        const previous = store.dispatch(tenantApi.endpoints.getTenantInfo.initiate(compositeArgs));
        store.dispatch(api.util.resetApiState());
        const current = store.dispatch(tenantApi.endpoints.getTenantInfo.initiate(compositeArgs));
        resolvePrevious({TenantInfo: [cpTenant], sourceErrors: {viewer: 'Unavailable'}});
        await Promise.all([previous, current]);
        expect(
            tenantApi.endpoints.getTenantInfo.select(compositeArgs)(store.getState()).data
                ?.ControlPlane?.id,
        ).toBe('new-scope');
    });
    test.each([undefined, null, '', 'Viewer failed'])(
        'only a normalized nonempty viewer error selects CP: %p',
        async (viewer) => {
            const response = parseMetaTenants({databases: [cpTenant], errors: {viewer}});
            window.api = {
                meta: {getTenantsV2: jest.fn().mockResolvedValue(response)},
            } as unknown as YdbEmbeddedAPI;
            const result = await createTestStore().dispatch(
                tenantApi.endpoints.getTenantInfo.initiate(compositeArgs),
            );
            expect(result.data?.availability).toBe(viewer ? 'control-plane' : 'runtime');
            if (viewer) {
                expect(result.data).not.toHaveProperty('nodesCount');
            }
        },
    );
});
