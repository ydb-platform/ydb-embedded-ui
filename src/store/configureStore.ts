import {configureStore as configureReduxStore} from '@reduxjs/toolkit';
import type {Action, Dispatch, Middleware, Reducer, UnknownAction} from '@reduxjs/toolkit';
import type {History} from 'history';
import {createBrowserHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import {YdbEmbeddedAPI} from '../services/api';

import {getUrlData} from './getUrlData';
import rootReducer from './reducers';
import {api as storeApi} from './reducers/api';
import {syncUserSettingsFromLS} from './reducers/settings/settings';
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
                immutableCheck: window.react_app_disable_checks
                    ? false
                    : {
                          ignoredPaths: ['tooltip.currentHoveredRef'],
                      },
                serializableCheck: window.react_app_disable_checks
                    ? false
                    : {
                          ignoredPaths: ['tooltip.currentHoveredRef', 'api'],
                          ignoredActions: [UPDATE_REF, 'api/sendQuery/rejected'],
                      },
            }).concat(locationMiddleware, ...middleware),
    });

    syncUserSettingsFromLS(store);

    return store;
}

export const webVersion = window.web_version;
export const customBackend = window.custom_backend;
export const metaBackend = window.meta_backend;
export const codeAssistBackend = window.code_assist_backend;

const isSingleClusterMode = `${metaBackend}` === 'undefined';

export function configureStore({
    aRootReducer = rootReducer,
    singleClusterMode = isSingleClusterMode,
    api = new YdbEmbeddedAPI({webVersion, withCredentials: !customBackend}),
} = {}) {
    ({backend, basename, clusterName} = getUrlData({
        singleClusterMode,
        customBackend,
    }));
    const history = createBrowserHistory({basename});

    const store = _configureStore(aRootReducer, history, {singleClusterMode}, [
        storeApi.middleware,
    ]);
    listenForHistoryChange(store, history);

    window.api = api;

    return {history, store};
}
