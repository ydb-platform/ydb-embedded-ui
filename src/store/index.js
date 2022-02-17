import {createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk';
import getLocationMiddleware from './state-url-mapping';
import {createBrowserHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import rootReducer from './reducers';

import url from 'url';

export const webVersion = window.web_version;

export const customBackend = window.custom_backend;

export const getUrlData = (href, singleClusterMode) => {
    if (!singleClusterMode) {
        const {backend, clusterName} = url.parse(href, true).query;
        return {
            basename: '/',
            backend,
            clusterName,
        };
    } else if (customBackend) {
        const {backend} = url.parse(href, true).query;
        return {
            basename: '/',
            backend: backend || window.custom_backend,
        };
    } else {
        const parsedPrefix = window.location.pathname.match(/.*(?=\/monitoring)/) || [];
        const basenamePrefix = Boolean(parsedPrefix.length) && parsedPrefix[0];
        const basename = [basenamePrefix, 'monitoring'].filter(Boolean).join('/');

        return {
            basename,
            backend: basenamePrefix || '',
        };
    }
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export let backend, basename, clusterName;

function _configureStore(aRootReducer, history, singleClusterMode) {
    const {locationMiddleware, reducersWithLocation} = getLocationMiddleware(history, aRootReducer);
    const middlewares = applyMiddleware(thunkMiddleware, locationMiddleware);

    return composeEnhancers(middlewares)(createStore)(reducersWithLocation, {
        singleClusterMode,
    });
}

export default function configureStore(aRootReducer = rootReducer, singleClusterMode = true) {
    ({backend, basename, clusterName} = getUrlData(window.location.href, singleClusterMode));
    const history = createBrowserHistory({basename});

    const store = _configureStore(aRootReducer, history, singleClusterMode);
    listenForHistoryChange(store, history);
    return {history, store};
}
