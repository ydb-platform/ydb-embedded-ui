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

test.each([
    {
        name: 'structured values with separators',
        location: {Rack: 'rack/a=b', DataCenter: 'modern-dc'},
        rack: 'rack/a=b',
        dc: 'modern-dc',
    },
    {
        name: 'structured rack with a legacy data center',
        location: {Rack: 'modern-rack'},
        rack: 'modern-rack',
        dc: 'legacy-dc',
    },
    {
        name: 'structured data center with a legacy rack',
        location: {DataCenter: 'modern-dc'},
        rack: 'legacy-rack',
        dc: 'modern-dc',
    },
    {
        name: 'zero-valued names',
        location: {Rack: '0', DataCenter: '0'},
        rack: '0',
        dc: '0',
    },
    {
        name: 'empty structured values',
        location: {Rack: '', DataCenter: ''},
        rack: 'legacy-rack',
        dc: 'legacy-dc',
    },
    {name: 'empty location', location: {}, rack: 'legacy-rack', dc: 'legacy-dc'},
    {name: 'legacy response', location: undefined, rack: 'legacy-rack', dc: 'legacy-dc'},
])('prepares node metadata for $name', async ({location, rack, dc}) => {
    const store = createStore();
    await store.dispatch(
        nodesListApi.util.upsertQueryData('getNodesList', {database: '/a'}, [
            {
                Id: 1,
                Host: 'node-1',
                Location: location,
                PhysicalLocation: {
                    DataCenterId: 'legacy-dc',
                    Location: 'DC=legacy-dc/R=legacy-rack/U=1/',
                    Rack: 123456,
                },
            },
        ]),
    );

    expect(selectNodesMap(store.getState(), '/a')?.get(1)).toEqual({
        Host: 'node-1',
        Rack: rack,
        DC: dc,
    });
    store.dispatch(api.util.resetApiState());
});

test('reads standalone structured location and leaves unknown metadata unavailable', async () => {
    const store = createStore();
    await store.dispatch(
        nodesListApi.util.upsertQueryData('getNodesList', {database: '/a'}, [
            {Id: 1, Location: {Rack: 'rack-only'}},
            {Id: 2, PhysicalLocation: {Rack: 123456}},
            {Id: 3},
        ]),
    );

    expect(selectNodesMap(store.getState(), '/a')).toEqual(
        new Map([
            [1, {Host: undefined, Rack: 'rack-only', DC: undefined}],
            [2, {Host: undefined, Rack: undefined, DC: undefined}],
            [3, {Host: undefined, Rack: undefined, DC: undefined}],
        ]),
    );
    store.dispatch(api.util.resetApiState());
});
