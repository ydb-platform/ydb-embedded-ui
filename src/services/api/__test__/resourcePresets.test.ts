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
