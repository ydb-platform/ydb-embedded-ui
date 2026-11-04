import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
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

function flushQueryLifecycle() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function rejectWhoamiLate(beforeReject: (store: ReturnType<typeof createStore>) => void) {
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
        beforeReject(store);
        rejectPrevious({status: 401});
        await previous;
        await flushQueryLifecycle();
        return store.getState().authentication.isAuthenticated;
    } finally {
        window.api = originalApi;
    }
}

afterEach(() => {
    window.history.replaceState({}, '', '/');
});

test('a late whoami 401 after a cache reset cannot log out the current user', async () => {
    const isAuthenticated = await rejectWhoamiLate((store) => {
        store.dispatch(api.util.resetApiState());
    });
    expect(isAuthenticated).toBe(true);
});

test('a late whoami 401 for a previously selected database cannot log out the user', async () => {
    const isAuthenticated = await rejectWhoamiLate(() => {
        window.history.replaceState({}, '', '/database?database=/other');
    });
    expect(isAuthenticated).toBe(true);
});

test('whoami 401 for the selected database retains the existing login semantics', async () => {
    const isAuthenticated = await rejectWhoamiLate(() => {
        window.history.replaceState({}, '', '/database?database=/db');
    });
    expect(isAuthenticated).toBe(false);
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
