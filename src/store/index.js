import {createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createBrowserHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import {getUrlData} from './getUrlData';
import getLocationMiddleware from './state-url-mapping';
import rootReducer from './reducers';

export let backend, basename, clusterName;

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

function _configureStore(aRootReducer, history, singleClusterMode) {
    const {locationMiddleware, reducersWithLocation} = getLocationMiddleware(history, aRootReducer);
    const middlewares = applyMiddleware(thunkMiddleware, locationMiddleware);

    return composeEnhancers(middlewares)(createStore)(reducersWithLocation, {
        singleClusterMode,
    });
}

function configureStore(aRootReducer = rootReducer, singleClusterMode = true) {
    ({backend, basename, clusterName} = getUrlData(window.location.href, singleClusterMode));
    const history = createBrowserHistory({basename});

    const store = _configureStore(aRootReducer, history, singleClusterMode);
    listenForHistoryChange(store, history);
    return {history, store};
}

export const webVersion = window.web_version;
export const customBackend = window.custom_backend;

export * from "./reducers"

export default configureStore;
