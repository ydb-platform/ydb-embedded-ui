import {configureStore as configureReduxStore} from '@reduxjs/toolkit';
import type {Action, Dispatch, Middleware, Reducer, UnknownAction} from '@reduxjs/toolkit';
import type {History} from 'history';
import {createBrowserHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import {createApi} from '../services/api';

import {getUrlData} from './getUrlData';
import rootReducer from './reducers';
import {api as storeApi} from './reducers/api';
import {UPDATE_REF} from './reducers/tooltip';
import getLocationMiddleware from './state-url-mapping';

export let backend: string | undefined, basename: string, clusterName: string | undefined;

function _configureStore<
    S = any,
    A extends Action = UnknownAction,
    P = S,
    M extends Middleware<{}, S, Dispatch> = any,
>(aRootReducer: Reducer<S, A, P>, history: History, preloadedState: P, middleware: M[]) {
    const {locationMiddleware, reducersWithLocation} = getLocationMiddleware(history, aRootReducer);

    const store = configureReduxStore({
        reducer: reducersWithLocation,
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                immutableCheck: {
                    ignoredPaths: ['tooltip.currentHoveredRef'],
                },
                serializableCheck: {
                    ignoredPaths: ['tooltip.currentHoveredRef', 'api'],
                    ignoredActions: [UPDATE_REF, 'api/executeQuery/rejected'],
                },
            }).concat(locationMiddleware, ...middleware),
    });

    return store;
}

export const webVersion = window.web_version;
export const customBackend = window.custom_backend;
export const metaBackend = window.meta_backend;

const isSingleClusterMode = `${metaBackend}` === 'undefined';

export function configureStore({
    aRootReducer = rootReducer,
    singleClusterMode = isSingleClusterMode,
    api = createApi({webVersion, withCredentials: !customBackend}),
} = {}) {
    ({backend, basename, clusterName} = getUrlData({
        href: window.location.href,
        singleClusterMode,
        customBackend,
    }));
    const history = createBrowserHistory({basename});

    const store = _configureStore(aRootReducer, history, {singleClusterMode}, [
        storeApi.middleware,
    ]);
    listenForHistoryChange(store, history);

    // Interceptor to process OIDC auth
    // @ts-expect-error
    api._axios.interceptors.response.use(
        function (response) {
            return Promise.resolve(response);
        },
        function (error) {
            const response = error.response;

            // OIDC proxy returns 401 response with authUrl in it
            // authUrl - external auth service link, after successful auth additional cookies will be appended
            // that will allow access to clusters where OIDC proxy is a balancer
            if (response && response.status === 401 && response.data?.authUrl) {
                return window.location.assign(response.data.authUrl);
            }

            return Promise.reject(error);
        },
    );

    window.api = api;

    return {history, store};
}
