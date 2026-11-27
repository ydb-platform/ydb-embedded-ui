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

describe('a cluster that fails to list its presets', () => {
    async function load(listResourcePresets: jest.Mock) {
        const store = configureStore({
            reducer: {[resourcePresetsApi.reducerPath]: resourcePresetsApi.reducer},
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware({serializableCheck: false}).concat(
                    resourcePresetsApi.middleware,
                ),
        });
        const originalApi = window.api;
        window.api = {meta: {listResourcePresets}} as unknown as YdbEmbeddedAPI;
        jest.useFakeTimers();
        try {
            const request = store.dispatch(
                resourcePresetsApi.endpoints.listResourcePresets.initiate(
                    {clusterName: 'cluster-a'},
                    {subscribe: false},
                ),
            );
            await jest.runAllTimersAsync();
            return await request;
        } finally {
            jest.useRealTimers();
            store.dispatch(resourcePresetsApi.util.resetApiState());
            window.api = originalApi;
        }
    }

    test('is asked again after a server error', async () => {
        const presets = {resource_presets: [{id: 'small', cores: '2', memory: '8'}]};
        const listResourcePresets = jest
            .fn()
            .mockRejectedValueOnce({status: 503})
            .mockRejectedValueOnce({message: 'Network Error'})
            .mockResolvedValue(presets);

        expect((await load(listResourcePresets)).data).toEqual(presets);
        expect(listResourcePresets).toHaveBeenCalledTimes(3);
    });

    test('gives up after the last retry', async () => {
        const listResourcePresets = jest.fn().mockRejectedValue({status: 503});

        expect((await load(listResourcePresets)).error).toEqual({status: 503});
        expect(listResourcePresets).toHaveBeenCalledTimes(3);
    });

    test.each([
        ['is refused', {status: 403}],
        ['is refused without CORS headers', {status: 403, message: 'Network Error'}],
    ])('is not asked again when the request %s', async (_case, error) => {
        const listResourcePresets = jest.fn().mockRejectedValue(error);

        expect((await load(listResourcePresets)).isError).toBe(true);
        expect(listResourcePresets).toHaveBeenCalledTimes(1);
    });
});
