import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {advanceRequestScope} from '../../../requestScope';
import {api} from '../../api';
import {tenantApi} from '../../tenant/tenant';
import authentication, {authenticationApi} from '../authentication';

jest.mock('../../../../utils/hooks/useDatabaseFromQuery', () => ({
    useClusterNameFromQuery: jest.fn(),
}));
jest.mock('../../../../utils/hooks/useDatabasesV2', () => ({
    useDatabasesV2: jest.fn(),
}));

function createStore() {
    return configureStore({
        reducer: {authentication, [api.reducerPath]: api.reducer},
        middleware: (getDefault) => getDefault().concat(api.middleware),
    });
}

test('a late whoami 401 from a previous runtime scope cannot log out the current user', async () => {
    const originalApi = window.api;
    let rejectPrevious: (error: unknown) => void = () => undefined;
    const pending = new Promise((_resolve, reject) => {
        rejectPrevious = reject;
    });
    window.api = {
        viewer: {whoami: jest.fn().mockReturnValue(pending)},
    } as unknown as YdbEmbeddedAPI;
    try {
        const store = createStore();
        const previous = store.dispatch(
            authenticationApi.endpoints.whoami.initiate({database: '/db'}),
        );
        advanceRequestScope();
        store.dispatch(api.util.resetApiState());
        rejectPrevious({status: 401});
        await previous;
        expect(store.getState().authentication.isAuthenticated).toBe(true);
    } finally {
        window.api = originalApi;
    }
});

test('current-scope whoami 401 retains the existing login semantics', async () => {
    const originalApi = window.api;
    window.api = {
        viewer: {whoami: jest.fn().mockRejectedValue({status: 401})},
    } as unknown as YdbEmbeddedAPI;
    try {
        const store = createStore();
        await store.dispatch(authenticationApi.endpoints.whoami.initiate({database: '/db'}));
        expect(store.getState().authentication.isAuthenticated).toBe(false);
    } finally {
        window.api = originalApi;
    }
});

test.each(['authenticate', 'logout'] as const)(
    'successful %s clears CP cached for the previous user',
    async (action) => {
        const originalApi = window.api;
        const args = {database: '/db', clusterName: 'cluster', isMetaDatabasesAvailable: true};
        window.api = {
            meta: {
                getTenantsV2: jest.fn().mockResolvedValue({
                    TenantInfo: [{Id: 'id', Name: '/db', ControlPlane: {id: 'id'}}],
                    sourceErrors: {viewer: 'unavailable'},
                }),
            },
            auth: {
                authenticate: jest.fn().mockResolvedValue({}),
                logout: jest.fn().mockResolvedValue({}),
            },
        } as unknown as YdbEmbeddedAPI;
        try {
            const store = createStore();
            await store.dispatch(
                tenantApi.endpoints.getTenantInfo.initiate(args, {subscribe: false}),
            );
            expect(
                tenantApi.endpoints.getTenantInfo.select(args)(store.getState()).data?.ControlPlane
                    ?.id,
            ).toBe('id');
            if (action === 'authenticate') {
                await store
                    .dispatch(
                        authenticationApi.endpoints.authenticate.initiate({
                            user: 'test',
                            password: 'fake',
                        }),
                    )
                    .unwrap();
            } else {
                await store.dispatch(authenticationApi.endpoints.logout.initiate({})).unwrap();
            }
            expect(
                tenantApi.endpoints.getTenantInfo.select(args)(store.getState()).data,
            ).toBeUndefined();
            expect(store.getState().authentication.isAuthenticated).toBe(action === 'authenticate');
        } finally {
            window.api = originalApi;
        }
    },
);
