import {configureStore as configureReduxStore} from '@reduxjs/toolkit';
import type {Action, Dispatch, Middleware, Reducer, UnknownAction} from '@reduxjs/toolkit';
import type {History} from 'history';
import {createBrowserHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import {YdbEmbeddedAPI} from '../services/api';
import {uiFactory} from '../uiFactory/uiFactory';
import {parseJson} from '../utils/utils';

import {getUrlData} from './getUrlData';
import rootReducer from './reducers';
import {api as storeApi} from './reducers/api';
import {syncUserSettingsFromLS} from './reducers/settings/settings';
import getLocationMiddleware from './state-url-mapping';

export let backend: string | undefined,
    basename: string,
    clusterName: string | undefined,
    environment: string | undefined;

function _configureStore<
    S = unknown,
    A extends Action = UnknownAction,
    P = S,
    M extends Middleware<{}, S, Dispatch> = Middleware<{}, S, Dispatch>,
>(aRootReducer: Reducer<S, A, P>, history: History, preloadedState: P, middleware: M[]) {
    const {locationMiddleware, reducersWithLocation} = getLocationMiddleware(history, aRootReducer);

    const checksDisabled = Boolean(parseJson(window.react_app_disable_checks));

    const store = configureReduxStore({
        reducer: reducersWithLocation,
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                immutableCheck: checksDisabled ? false : undefined,
                serializableCheck: checksDisabled
                    ? false
                    : {
                          ignoredPaths: ['api'],
                          ignoredActions: ['api/sendQuery/rejected'],
                      },
            }).concat(locationMiddleware, ...middleware),
    });

    syncUserSettingsFromLS(store);

    return store;
}

// Environment variables are injected into the HTML template (index.html) as string literals.
// For example: window.web_version = "<%= !process.env.REACT_APP_BACKEND %>" becomes the string "true" or "false".
// We need to parse these string values back to their proper types (booleans, strings, undefined).
export const webVersion = Boolean(parseJson(window.web_version));
export const customBackend = parseJson(window.custom_backend);
export const metaBackend = parseJson(window.meta_backend);
export const codeAssistBackend = parseJson(window.code_assist_backend);

const isSingleClusterMode = !metaBackend;

export function configureStore({
    aRootReducer = rootReducer,
    singleClusterMode = isSingleClusterMode,
    environments = [] as string[],
    api = new YdbEmbeddedAPI({
        webVersion,
        singleClusterMode: isSingleClusterMode,
        withCredentials: !customBackend,
        proxyMeta: false,
        csrfTokenGetter: undefined,
        useRelativePath: false,
        useMetaSettings: false,
        metaSettingsBaseUrl: uiFactory.settingsBackend?.getEndpoint?.(),
        defaults: undefined,
    }),
} = {}) {
    const params = getUrlData({
        singleClusterMode,
        customBackend,
        allowedEnvironments: environments,
    });
    ({basename, clusterName, environment} = params);
    backend = params.backend;
    const history = createBrowserHistory({basename});

    const store = _configureStore(aRootReducer, history, {singleClusterMode}, [
        storeApi.middleware,
    ]);
    listenForHistoryChange(store, history);

    window.api = api;

    return {history, store};
}
