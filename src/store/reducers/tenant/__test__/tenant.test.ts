import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
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
});
