import {configureStore, createNextState} from '@reduxjs/toolkit';
import {createMemoryHistory} from 'history';
import {listenForHistoryChange} from 'redux-location-state';

import getLocationMiddleware from './state-url-mapping';

jest.mock('./reducers/heatmap', () => ({
    initialState: {sort: false, heatmap: false, currentMetric: 'cpu'},
}));
jest.mock('./reducers/tenant/tenant', () => ({initialState: {metricsTab: 'overview'}}));

const identity = 'clusterName=test&backend=https%3A%2F%2Fbackend.test&schema=%2FRoot%2Ftable';

function setup() {
    const initial = createNextState(
        {
            api: {queries: {nodes: {data: [{NodeId: 1, PDisks: [{PDiskId: 1}]}]}}},
            tenant: {queryTab: 'query', metricsTab: 'overview', unrelated: {value: 42}},
            heatmap: {sort: false, heatmap: false, currentMetric: 'cpu'},
        },
        () => {},
    );
    const history = createMemoryHistory({initialEntries: [`/cluster/nodes?${identity}`]});
    const reducer = (state = initial, action: {type: string}) =>
        action.type === 'test/select-plan'
            ? {...state, tenant: {...state.tenant, queryTab: 'plan'}}
            : state;
    const {locationMiddleware, reducersWithLocation} = getLocationMiddleware(history, reducer);
    const store = configureStore({
        reducer: reducersWithLocation,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(locationMiddleware),
    });
    listenForHistoryChange(store, history);
    return {initial, history, store};
}

test('navigation without mapped URL changes preserves the entire cached state', () => {
    const {initial, history, store} = setup();
    const state = store.getState();

    history.push(`/cluster/network?${identity}`);

    expect(store.getState()).toBe(state);
    expect(store.getState().api).toBe(initial.api);
});

test('URL changes and browser history update mapped fields without copying API data', () => {
    const {initial, history, store} = setup();
    history.push(`/database?${identity}&queryTab=results&sort=true&metricsTab=storage`);

    expect(store.getState().tenant.queryTab).toBe('results');
    expect(store.getState().tenant.metricsTab).toBe('storage');
    expect(store.getState().heatmap.sort).toBe(true);
    expect(store.getState().tenant.unrelated).toBe(initial.tenant.unrelated);
    expect(store.getState().api).toBe(initial.api);

    store.dispatch({type: 'test/select-plan'});
    const query = new URLSearchParams(history.location.search);
    expect(query.get('queryTab')).toBe('plan');
    expect(query.get('clusterName')).toBe('test');
    expect(query.get('backend')).toBe('https://backend.test');
    expect(query.get('schema')).toBe('/Root/table');

    history.push(`/database?${identity}&queryTab=query`);
    history.goBack();
    expect(store.getState().tenant.queryTab).toBe('plan');
    history.goForward();
    expect(store.getState().tenant.queryTab).toBe('query');
    expect(store.getState().api).toBe(initial.api);
    expect(initial.tenant.queryTab).toBe('query');
    expect(initial.heatmap.sort).toBe(false);
});
