import {configureStore} from '@reduxjs/toolkit';

import reducer from '..';
import type {YdbEmbeddedAPI} from '../../../services/api';
import type {TEvNodesInfo} from '../../../types/api/nodesList';
import {configureUIFactory, uiFactory} from '../../../uiFactory/uiFactory';
import {api} from '../api';
import {setIsAuthenticated} from '../authentication/authentication';
import {createDatacenterRegistrar} from '../datacenters';
import {nodesListApi} from '../nodesList';

function createStore() {
    return configureStore({
        reducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

describe('datacenter registry', () => {
    const originalApi = window.api;
    const originalIndexes = uiFactory.datacenterColorIndexes;
    const getNodesList = jest.fn();
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        getNodesList.mockReset();
        configureUIFactory({datacenterColorIndexes: undefined});
        window.api = {viewer: {getNodesList}} as unknown as YdbEmbeddedAPI;
        store = createStore();
    });

    afterEach(() => {
        store.dispatch(api.util.resetApiState());
        window.api = originalApi;
        configureUIFactory({datacenterColorIndexes: originalIndexes});
    });

    async function fetchNodes(database: string) {
        return store
            .dispatch(nodesListApi.endpoints.getNodesList.initiate({database}, {subscribe: false}))
            .unwrap();
    }

    test('registers normalized structured and legacy identities from a fulfilled request', async () => {
        configureUIFactory({datacenterColorIndexes: {'DC-PINNED': 7}});
        const nodes = [
            {Id: 1, Location: {DataCenter: 'dc-a'}},
            {Id: 2, PhysicalLocation: {DataCenterId: 'DC-A'}},
            {Id: 3, Location: {BridgePileName: 'pile-a', DataCenter: 'dc-b'}},
            {Id: 4},
        ];
        getNodesList.mockResolvedValue(nodes);
        await expect(fetchNodes('/db-a')).resolves.toEqual(nodes);
        expect(store.getState().datacenters.indexes).toEqual({
            'DC-PINNED': 7,
            'DC-A': 8,
            'P=PILE-A/DC-B': 9,
        });
        expect(
            nodesListApi.endpoints.getNodesList.select({database: '/db-a'})(store.getState()).data,
        ).toEqual(nodes);
    });

    test('accumulates names without renumbering or invalidating unchanged indexes', async () => {
        getNodesList.mockResolvedValueOnce([{Id: 1, Location: {DataCenter: 'DC-B'}}]);
        await fetchNodes('/db-a');
        getNodesList.mockResolvedValueOnce([{Id: 2, Location: {DataCenter: 'DC-A'}}]);
        await fetchNodes('/db-b');
        const indexes = store.getState().datacenters.indexes;
        expect(indexes).toEqual({'DC-B': 1, 'DC-A': 2});

        getNodesList.mockResolvedValueOnce([{Id: 1, Location: {DataCenter: 'dc-b'}}]);
        await fetchNodes('/db-c');
        expect(store.getState().datacenters.indexes).toBe(indexes);
    });

    test('gives configured assignments priority over accumulated indexes', async () => {
        getNodesList.mockResolvedValueOnce([{Id: 1, Location: {DataCenter: 'DC-A'}}]);
        await fetchNodes('/db-a');
        configureUIFactory({datacenterColorIndexes: {'DC-A': 5}});
        getNodesList.mockResolvedValueOnce([{Id: 2, Location: {DataCenter: 'DC-B'}}]);
        await fetchNodes('/db-b');
        expect(store.getState().datacenters.indexes).toEqual({'DC-A': 5, 'DC-B': 6});
    });

    test.each([{}, 'unexpected', null])('ignores non-array nodelist data %p', async (payload) => {
        getNodesList.mockResolvedValue(payload);
        await fetchNodes('/db-a');
        expect(store.getState().datacenters.indexes).toEqual({});
        expect(
            nodesListApi.endpoints.getNodesList.select({database: '/db-a'})(store.getState())
                .status,
        ).toBe('fulfilled');
    });

    test('ignores responses started before logout and accepts the new session', async () => {
        let finishRequest: (nodes: TEvNodesInfo) => void = () => {
            throw new Error('The request has not started');
        };
        getNodesList.mockImplementationOnce(
            () =>
                new Promise<TEvNodesInfo>((resolve) => {
                    finishRequest = resolve;
                }),
        );
        const pending = fetchNodes('/db-a');
        store.dispatch(setIsAuthenticated(false));
        finishRequest([{Id: 1, Location: {DataCenter: 'DC-OLD'}}]);
        await pending;
        expect(store.getState().datacenters).toEqual({indexes: {}, generation: 1});

        getNodesList.mockResolvedValueOnce([{Id: 2, Location: {DataCenter: 'DC-NEW'}}]);
        await fetchNodes('/db-b');
        expect(store.getState().datacenters.indexes).toEqual({'DC-NEW': 1});
    });

    test('does not register cache-only updates without request metadata', async () => {
        await store.dispatch(
            nodesListApi.util.upsertQueryData('getNodesList', {database: '/db-a'}, [
                {Id: 1, Location: {DataCenter: 'DC-OLD'}},
            ]),
        );
        expect(store.getState().datacenters.indexes).toEqual({});
    });

    test('applies the same generation guard to paginated node fetchers', () => {
        const register = createDatacenterRegistrar(store);
        register(['dc-a']);
        expect(store.getState().datacenters.indexes).toEqual({'DC-A': 1});
        store.dispatch(setIsAuthenticated(false));
        register(['DC-OLD']);
        expect(store.getState().datacenters.indexes).toEqual({});
        createDatacenterRegistrar(store)(['DC-NEW']);
        expect(store.getState().datacenters.indexes).toEqual({'DC-NEW': 1});
    });
});
