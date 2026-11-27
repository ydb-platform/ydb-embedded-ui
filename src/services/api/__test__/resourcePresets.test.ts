jest.mock('../../../store', () => ({
    metaBackend: '/meta-backend',
    environment: 'env-a',
}));

import {configureStore} from '@reduxjs/toolkit';
import type {AxiosAdapter, InternalAxiosRequestConfig} from 'axios';

import type {YdbEmbeddedAPI} from '..';
import {resourcePresetsApi} from '../../../store/reducers/resourcePresets';
import {MetaAPI} from '../meta';

test.each([true, false])(
    'loads a cluster catalog in its environment (proxy=%s)',
    async (proxyMeta) => {
        const requests: InternalAxiosRequestConfig[] = [];
        const adapter: AxiosAdapter = async (config) => {
            requests.push(config);
            const data = {
                resource_presets: [{id: 'small', cores: '2', memory: String(requests.length)}],
            };
            return {data, status: 200, statusText: 'OK', headers: {}, config};
        };
        const meta = new MetaAPI(
            {config: {adapter}},
            {
                singleClusterMode: false,
                proxyMeta,
                useRelativePath: false,
                csrfTokenGetter: () => '',
            },
        );
        const store = configureStore({
            reducer: {[resourcePresetsApi.reducerPath]: resourcePresetsApi.reducer},
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware().concat(resourcePresetsApi.middleware),
        });
        const originalApi = window.api;
        window.api = {meta} as YdbEmbeddedAPI;
        try {
            const endpoint = resourcePresetsApi.endpoints.listResourcePresets;
            const args = {clusterName: 'cluster-a', environment: 'Primary'};
            const otherEnv = {...args, environment: 'Secondary'};
            for (const scope of [args, args, otherEnv]) {
                await store.dispatch(endpoint.initiate(scope, {subscribe: false})).unwrap();
            }
            expect(requests).toHaveLength(2);
            expect(requests[0]).toMatchObject({
                url: proxyMeta
                    ? '/env-a/meta-backend/proxy/cluster/cluster-a/meta/list_resource_presets'
                    : '/meta-backend/meta/list_resource_presets',
                method: 'post',
            });
            expect(requests[0].signal).toBeDefined();
            expect(JSON.parse(requests[0].data)).toEqual({cluster_name: 'cluster-a'});

            await store
                .dispatch(endpoint.initiate({...args, cloudId: 'cloud-1'}, {subscribe: false}))
                .unwrap();
            expect(JSON.parse(requests[2].data)).toEqual({
                cluster_name: 'cluster-a',
                cloud_id: 'cloud-1',
            });
            expect(endpoint.select(args)(store.getState()).data?.resource_presets?.[0].memory).toBe(
                '1',
            );
            expect(
                endpoint.select(otherEnv)(store.getState()).data?.resource_presets?.[0].memory,
            ).toBe('2');
        } finally {
            store.dispatch(resourcePresetsApi.util.resetApiState());
            window.api = originalApi;
        }
    },
);

test('reads a catalog page by page until there is no next page token', async () => {
    const pages: Record<string, object> = {
        first: {resource_presets: [{id: 'small', cores: '2', memory: '8'}], next_page_token: 'p2'},
        p2: {resource_presets: [{id: 'large', cores: '8', memory: '32'}], next_page_token: ''},
    };
    const listResourcePresets = jest.fn(
        async ({pageToken}: {pageToken?: string}) => pages[pageToken ?? 'first'],
    );
    const store = configureStore({
        reducer: {[resourcePresetsApi.reducerPath]: resourcePresetsApi.reducer},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}).concat(resourcePresetsApi.middleware),
    });
    const originalApi = window.api;
    window.api = {meta: {listResourcePresets}} as unknown as YdbEmbeddedAPI;
    try {
        const {data} = await store.dispatch(
            resourcePresetsApi.endpoints.listResourcePresets.initiate(
                {clusterName: 'cluster-a', cloudId: 'cloud-1'},
                {subscribe: false},
            ),
        );

        expect(data?.resource_presets?.map(({id}) => id)).toEqual(['small', 'large']);
        expect(listResourcePresets.mock.calls.map(([params]) => params)).toEqual([
            {clusterName: 'cluster-a', cloudId: 'cloud-1', pageToken: undefined},
            {clusterName: 'cluster-a', cloudId: 'cloud-1', pageToken: 'p2'},
        ]);
    } finally {
        store.dispatch(resourcePresetsApi.util.resetApiState());
        window.api = originalApi;
    }
});
