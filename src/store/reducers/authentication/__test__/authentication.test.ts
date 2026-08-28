import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {api} from '../../api';
import authentication, {authenticationApi} from '../authentication';

function createTestStore() {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            authentication,
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

describe('authenticationApi.whoami', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('sets unauthenticated state when whoami returns 401 with authUrl', async () => {
        window.api = {
            viewer: {
                whoami: jest.fn().mockRejectedValue({
                    status: 401,
                    data: {authUrl: 'https://auth.example.com/login'},
                }),
            },
        } as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        await store.dispatch(
            authenticationApi.endpoints.whoami.initiate(
                {database: '/Root', useMeta: false},
                {subscribe: false},
            ),
        );

        expect(store.getState().authentication.isAuthenticated).toBe(false);
    });
});
