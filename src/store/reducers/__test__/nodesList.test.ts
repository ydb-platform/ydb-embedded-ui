import {configureStore} from '@reduxjs/toolkit';

import reducer from '..';
import {api} from '../api';
import {nodesListApi, selectNodesMap} from '../nodesList';

function createStore() {
    return configureStore({
        reducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

test('keeps the nodes map stable across unrelated state and query updates', async () => {
    const store = createStore();
    await store.dispatch(
        nodesListApi.util.upsertQueryData('getNodesList', {database: '/a'}, [{Id: 1, Host: 'a'}]),
    );
    const nodes = selectNodesMap(store.getState(), '/a');
    const state = store.getState();
    expect(selectNodesMap({...state, singleClusterMode: !state.singleClusterMode}, '/a')).toBe(
        nodes,
    );

    await store.dispatch(
        nodesListApi.util.upsertQueryData('getNodesList', {database: '/b'}, [{Id: 2, Host: 'b'}]),
    );
    expect(selectNodesMap(store.getState(), '/a')).toBe(nodes);
    expect(selectNodesMap(store.getState(), '/b')?.get(2)?.Host).toBe('b');
    store.dispatch(api.util.resetApiState());
});

test('updates nodes and data centers when data changes and clears after cache reset', async () => {
    const store = createStore();
    expect(selectNodesMap(store.getState())).toBeUndefined();
    await store.dispatch(
        nodesListApi.util.upsertQueryData('getNodesList', {database: undefined}, [
            {Id: 1, Host: 'old', PhysicalLocation: {DataCenterId: 'dc-1'}},
            {Id: 2, Host: 'removed'},
        ]),
    );
    const before = selectNodesMap(store.getState());
    await store.dispatch(
        nodesListApi.util.upsertQueryData('getNodesList', {database: undefined}, [
            {Id: 1, Host: 'new', PhysicalLocation: {DataCenterId: 'dc-2'}},
        ]),
    );
    const after = selectNodesMap(store.getState());
    expect(after).not.toBe(before);
    expect(after).toEqual(new Map([[1, {Host: 'new', DC: 'dc-2'}]]));

    store.dispatch(api.util.resetApiState());
    expect(selectNodesMap(store.getState())).toBeUndefined();
});
