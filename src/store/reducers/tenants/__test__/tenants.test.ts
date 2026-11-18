import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {parseMetaTenants} from '../../../../services/parsers/parseMetaTenants';
import type {TTenant} from '../../../../types/api/tenant';
import {extractErrorDetails} from '../../../../utils/errors';
import {api} from '../../api';
import {tenantsApi} from '../tenants';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

describe('tenantsApi.getTenantsInfo', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('preserves partial meta errors in the prepared database list', async () => {
        const response = {
            databases: [{Id: 'database-id', Name: '/local/database'}],
            errors: {
                control_plane: 'Simulated CP outage: database-id',
                viewer: 'Viewer unavailable',
            },
        };
        window.api = {
            meta: {
                getTenantsV2: jest.fn().mockResolvedValue(parseMetaTenants(response)),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        const args = {clusterName: 'test-cluster', isMetaDatabasesAvailable: true};

        await store.dispatch(
            tenantsApi.endpoints.getTenantsInfo.initiate(args, {subscribe: false}),
        );

        expect(tenantsApi.endpoints.getTenantsInfo.select(args)(store.getState())).toMatchObject({
            status: 'fulfilled',
            data: [
                {
                    Id: 'database-id',
                    Name: '/local/database',
                    metaErrors: {
                        control_plane: 'Simulated CP outage: database-id',
                        viewer: 'Viewer unavailable',
                    },
                },
            ],
        });
    });

    test.each([
        {
            databases: undefined,
            errors: {control_plane: 'Control plane unavailable'},
            message: 'control_plane: Control plane unavailable',
        },
        {
            databases: [],
            errors: {viewer: 'Viewer unavailable'},
            message: 'viewer: Viewer unavailable',
        },
        {
            databases: [],
            errors: {
                control_plane: 'Control plane unavailable',
                viewer: 'Viewer unavailable',
            },
            message: 'control_plane: Control plane unavailable\nviewer: Viewer unavailable',
        },
    ])(
        'exposes meta errors as a displayable message: $message',
        async ({databases, errors, message}) => {
            window.api = {
                meta: {
                    getTenantsV2: jest.fn().mockResolvedValue(
                        parseMetaTenants({
                            databases,
                            errors,
                        }),
                    ),
                },
            } as unknown as YdbEmbeddedAPI;
            const store = createTestStore();

            const result = await store.dispatch(
                tenantsApi.endpoints.getTenantsInfo.initiate(
                    {clusterName: 'test-cluster', isMetaDatabasesAvailable: true},
                    {subscribe: false},
                ),
            );

            expect(result).toMatchObject({
                status: 'rejected',
                error: {
                    code: 'EMPTY_TENANT_INFO',
                    metaErrors: errors,
                    message,
                },
            });
            expect(extractErrorDetails(result.error)?.title).toBe(message);
        },
    );
});

describe('tenantsApi.getSharedDatabase', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('preserves the destination nodes from the storage-free lookup', async () => {
        const resourceId = '42';
        const serverlessDatabase: TTenant = {
            Id: 'serverless-id',
            Name: '/local/serverless',
            Type: 'Serverless',
            ResourceId: resourceId,
            NodeIds: [3],
        };
        const sharedDatabase: TTenant = {
            Id: resourceId,
            Name: '/local/shared',
            Type: 'Shared',
            NodeIds: [7],
        };
        window.api = {
            viewer: {
                getTenants: jest.fn().mockResolvedValue({
                    TenantInfo: [serverlessDatabase, sharedDatabase],
                }),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            tenantsApi.endpoints.getSharedDatabase.initiate(
                {
                    database: serverlessDatabase.Name,
                    isMonitoringAllowed: false,
                    resourceId,
                },
                {subscribe: false},
            ),
        );

        expect(result).toMatchObject({
            status: 'fulfilled',
            data: {
                name: sharedDatabase.Name,
                nodeIds: sharedDatabase.NodeIds,
            },
        });
    });

    test('skips describe when destination nodes are required', async () => {
        const resourceId = '42';
        const getTabletDescribe = jest.fn().mockResolvedValue({Path: '/local/shared'});
        const getTenants = jest.fn().mockResolvedValue({
            TenantInfo: [
                {
                    Id: resourceId,
                    Name: '/local/shared',
                    Type: 'Shared',
                    NodeIds: [7],
                },
            ],
        });
        window.api = {
            viewer: {getTabletDescribe, getTenants},
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            tenantsApi.endpoints.getSharedDatabase.initiate(
                {
                    database: '/local/serverless',
                    isMonitoringAllowed: true,
                    needNodeIds: true,
                    resourceId,
                },
                {subscribe: false},
            ),
        );

        expect(result).toMatchObject({
            status: 'fulfilled',
            data: {name: '/local/shared', nodeIds: [7]},
        });
        expect(getTabletDescribe).not.toHaveBeenCalled();
        expect(getTenants).toHaveBeenCalledWith(
            {clusterName: undefined, metadataCache: false, storage: false},
            expect.objectContaining({signal: expect.any(AbortSignal)}),
        );
    });
});
