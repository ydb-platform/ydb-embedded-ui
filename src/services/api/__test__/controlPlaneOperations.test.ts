jest.mock('../../../store', () => ({
    backend: '/runtime',
    metaBackend: '/meta-backend',
    environment: 'env-a',
}));

import {configureStore} from '@reduxjs/toolkit';
import type {AxiosAdapter, InternalAxiosRequestConfig} from 'axios';

import type {YdbEmbeddedAPI} from '..';
import {operationsApi} from '../../../store/reducers/operations';
import {MetaAPI} from '../meta';

function setup(proxyMeta = true) {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
        requests.push(config);
        const {page_token: token, resource_id: id} = JSON.parse(config.data);
        // An empty page may still have a continuation token (CP permission filtering).
        const data = token
            ? {operations: [{id: `${id}-operation`, done: true}]}
            : {next_page_token: 'opaque-cursor'};
        return {data, status: 200, statusText: 'OK', headers: {}, config};
    };
    const meta = new MetaAPI(
        {config: {adapter}},
        {
            singleClusterMode: false,
            proxyMeta,
            useRelativePath: false,
            csrfTokenGetter: () => 'test-csrf',
        },
    );
    return {meta, requests};
}

const args = {clusterName: 'cluster-a', folderId: 'folder', databaseId: 'database-a'};

test.each([true, false])(
    'CP list uses correct meta route and JSON payload (proxy=%s)',
    async (proxy) => {
        const {meta, requests} = setup(proxy);
        const signal = new AbortController().signal;
        await meta.getControlPlaneOperationList(
            {...args, pageSize: 20, pageToken: 'cursor'},
            {signal},
        );
        expect(requests[0].url).toBe(
            proxy
                ? '/env-a/meta-backend/proxy/cluster/cluster-a/meta/list_operations'
                : '/meta-backend/meta/list_operations',
        );
        expect(requests[0].method).toBe('post');
        expect(requests[0].signal).toBe(signal);
        expect(JSON.parse(requests[0].data)).toEqual({
            cluster_name: 'cluster-a',
            folder_id: 'folder',
            resource_id: 'database-a',
            page_size: 20,
            page_token: 'cursor',
        });
    },
);

test('infinite query continues through an empty page and isolates another database', async () => {
    const {meta, requests} = setup();
    const store = configureStore({
        reducer: {[operationsApi.reducerPath]: operationsApi.reducer},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(operationsApi.middleware),
    });
    const originalApi = window.api;
    window.api = {meta} as YdbEmbeddedAPI;
    try {
        const endpoint = operationsApi.endpoints.getControlPlaneOperationList;
        await store.dispatch(endpoint.initiate(args, {subscribe: false}));
        expect(JSON.parse(requests[0].data).page_size).toBe(100);
        await store.dispatch(endpoint.initiate(args, {subscribe: false, direction: 'forward'}));
        expect(JSON.parse(requests[1].data).page_size).toBe(100);
        const data = endpoint.select(args)(store.getState()).data;
        expect(data?.pages).toEqual([
            {next_page_token: 'opaque-cursor'},
            {operations: [{id: 'database-a-operation', done: true}]},
        ]);
        expect(JSON.parse(requests[1].data).page_token).toBe('opaque-cursor');
        await store.dispatch(
            endpoint.initiate({...args, databaseId: 'database-b'}, {subscribe: false}),
        );
        expect(JSON.parse(requests[2].data)).toMatchObject({resource_id: 'database-b'});
        expect(JSON.parse(requests[2].data).page_token).toBeUndefined();
        for (const scope of [{environment: 'env-b'}, {backend: '/another-backend'}]) {
            const index = requests.length;
            await store.dispatch(endpoint.initiate({...args, ...scope}, {subscribe: false}));
            expect(requests).toHaveLength(index + 1);
            expect(JSON.parse(requests[index].data).page_token).toBeUndefined();
            expect(endpoint.select({...args, ...scope})(store.getState()).data?.pages).toHaveLength(
                1,
            );
        }
    } finally {
        store.dispatch(operationsApi.util.resetApiState());
        window.api = originalApi;
    }
});
