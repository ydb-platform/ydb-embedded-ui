jest.mock('../../../store', () => ({
    backend: undefined,
    clusterName: undefined,
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
            singleClusterMode: true,
            proxyMeta: false,
            useRelativePath: false,
            csrfTokenGetter: () => undefined,
        },
    );
}

describe('ViewerAPI database query parameter', () => {
    test('sends database in both URL parameters and body for queries', async () => {
        const {adapter, requests} = createMockAdapter();
        const api = createViewerApi({adapter});

        await api.sendQuery({
            database: '/Root/test',
            action: 'execute-scan',
            query: 'SELECT 1',
            base64: false,
        });

        expect(requests[0].url).toBe('/viewer/json/query');
        expect(requests[0].params).toEqual(
            expect.objectContaining({
                database: '/Root/test',
            }),
        );
        expect(JSON.parse(requests[0].data)).toEqual(
            expect.objectContaining({
                database: '/Root/test',
            }),
        );
    });

    test('sends database in both URL parameters and body when committing an offset', async () => {
        const {adapter, requests} = createMockAdapter();
        const api = createViewerApi({adapter});

        await api.commitOffset({
            database: '/Root/test',
            path: {
                path: '/Root/test/topic',
                databaseFullPath: '/Root/test',
            },
            consumer: 'consumer',
            partitionId: 1,
            offset: 42,
        });

        expect(requests[0].url).toBe('/viewer/commit_offset');
        expect(requests[0].params).toEqual({
            database: '/Root/test',
        });
        expect(JSON.parse(requests[0].data)).toEqual(
            expect.objectContaining({
                database: '/Root/test',
            }),
        );
    });
});
