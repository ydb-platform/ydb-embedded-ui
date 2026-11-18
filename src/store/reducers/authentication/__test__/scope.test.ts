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
