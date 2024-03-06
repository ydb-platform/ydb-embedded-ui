import {configureStore as configureReduxStore} from '@reduxjs/toolkit';
import {History, createBrowserHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import {getUrlData} from './getUrlData';
import getLocationMiddleware from './state-url-mapping';
import rootReducer from './reducers';
import {createApi} from '../services/api';

import type {Action, Reducer, UnknownAction} from '@reduxjs/toolkit';
import {UPDATE_REF} from './reducers/tooltip';

export let backend: string | undefined, basename: string, clusterName: string | undefined;

function _configureStore<S = any, A extends Action = UnknownAction, P = S>(
    aRootReducer: Reducer<S, A, P>,
    history: History,
    preloadedState: P,
) {
    const {locationMiddleware, reducersWithLocation} = getLocationMiddleware(history, aRootReducer);

    const store = configureReduxStore({
        reducer: reducersWithLocation,
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                immutableCheck: {ignoredPaths: ['tooltip.currentHoveredRef']},
                serializableCheck: {
                    ignoredPaths: ['tooltip.currentHoveredRef'],
                    ignoredActions: [UPDATE_REF],
                },
            }).concat(locationMiddleware),
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

    const store = _configureStore(aRootReducer, history, {singleClusterMode});
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
    window.store = store; // TODO: check is it really needed

    return {history, store};
}
