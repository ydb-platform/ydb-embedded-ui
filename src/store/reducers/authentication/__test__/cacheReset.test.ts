import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {api} from '../../api';
import authentication, {authenticationApi} from '../authentication';

function createStore() {
    return configureStore({
        reducer: {authentication, [api.reducerPath]: api.reducer},
        middleware: (getDefault) => getDefault().concat(api.middleware),
    });
}

test.each(['authenticate', 'logout'] as const)(
    'successful %s clears data cached for the previous user',
    async (action) => {
        const originalApi = window.api;
        const args = {database: '/db'};
        window.api = {
            viewer: {whoami: jest.fn().mockResolvedValue({UserSID: 'previous'})},
            auth: {
                authenticate: jest.fn().mockResolvedValue({}),
                logout: jest.fn().mockResolvedValue({}),
            },
        } as unknown as YdbEmbeddedAPI;
        try {
            const store = createStore();
            await store.dispatch(
                authenticationApi.endpoints.whoami.initiate(args, {subscribe: false}),
            );
            expect(authenticationApi.endpoints.whoami.select(args)(store.getState()).data).toEqual({
                UserSID: 'previous',
            });
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
                authenticationApi.endpoints.whoami.select(args)(store.getState()).data,
            ).toBeUndefined();
        } finally {
            window.api = originalApi;
        }
    },
);
