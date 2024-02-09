import {createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createBrowserHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import {getUrlData} from './getUrlData';
import getLocationMiddleware from './state-url-mapping';
import rootReducer from './reducers';
import {createApi} from '../services/api';

export let backend, basename, clusterName;

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

function _configureStore(aRootReducer, history, singleClusterMode) {
    const {locationMiddleware, reducersWithLocation} = getLocationMiddleware(history, aRootReducer);
    const middlewares = applyMiddleware(thunkMiddleware, locationMiddleware);

    return composeEnhancers(middlewares)(createStore)(reducersWithLocation, {
        singleClusterMode,
    });
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

    const store = _configureStore(aRootReducer, history, singleClusterMode);
    listenForHistoryChange(store, history);

    // Interceptor to process OIDC auth
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

export * from './reducers';
