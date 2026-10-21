jest.mock('../../../store', () => ({
    backend: undefined,
    clusterName: undefined,
    environment: undefined,
}));

import type {
    AxiosAdapter,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

import {ViewerAPI} from '../viewer';

function createMockAdapter() {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
        requests.push(config);

        return {
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
        } as AxiosResponse;
    };

    return {adapter, requests};
}

function createViewerApi(config: AxiosRequestConfig) {
    return new ViewerAPI(
        {config},
        {
            singleClusterMode: false,
            proxyMeta: false,
            useRelativePath: false,
            csrfTokenGetter: () => undefined,
        },
    );
}

describe('ViewerAPI database query parameter', () => {
    const originalMetaBackend = window.meta_backend;

    afterEach(() => {
        window.meta_backend = originalMetaBackend;
    });

    test('routes an explicitly selected database cluster through the meta proxy', async () => {
        const {adapter, requests} = createMockAdapter();
        const api = createViewerApi({adapter});
        window.meta_backend = '/api/meta3';

        await api.getHealthcheckInfo({
            database: '/Root/test',
            clusterName: 'test-cluster',
        });

        expect(requests[0].url).toBe(
            '/api/meta3/proxy/cluster/test-cluster/viewer/json/healthcheck?merge_records=true',
        );
        expect(requests[0].params).toEqual({database: '/Root/test'});
    });

    test('preserves the default healthcheck route without a selected cluster', async () => {
        const {adapter, requests} = createMockAdapter();
        const api = createViewerApi({adapter});
        await api.getHealthcheckInfo({database: '/Root/test'});
        expect(requests[0].url).toBe('/viewer/json/healthcheck?merge_records=true');
        expect(requests[0].params).toEqual({database: '/Root/test'});
    });
});
