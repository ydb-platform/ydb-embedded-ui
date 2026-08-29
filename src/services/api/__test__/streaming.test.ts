jest.mock('../../../store', () => ({
    backend: undefined,
    clusterName: undefined,
}));

jest.mock('@mjackson/multipart-parser', () => ({
    parseMultipart: jest.fn(async () => undefined),
}));

import {CSRF_TOKEN_HEADER_NAME} from '../base';
import {YdbEmbeddedAPI} from '../index';
import {StreamingAPI} from '../streaming';

function createStreamingApi(csrfTokenGetter: () => string | undefined = () => undefined) {
    return new StreamingAPI(
        {config: {withCredentials: true}},
        {
            singleClusterMode: true,
            proxyMeta: false,
            useRelativePath: false,
            csrfTokenGetter,
        },
    );
}

function createStreamQueryOptions() {
    return {
        onStreamDataChunk: jest.fn(),
        onQueryResponseChunk: jest.fn(),
        onSessionChunk: jest.fn(),
    };
}

function createFetchResponseMock() {
    return {
        ok: true,
        body: {},
        headers: {
            get: jest.fn(() => null),
        },
    } as unknown as Response;
}

function createUnauthorizedFetchResponseMock() {
    return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        url: 'https://viewer.example.com/viewer/query',
        headers: new Headers(),
        text: jest.fn(async () => JSON.stringify({authUrl: 'https://auth.example.com/login'})),
    } as unknown as Response;
}

describe('StreamingAPI requests', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    test('uses manually set CSRF token when cookie getter returns empty value', async () => {
        const api = createStreamingApi();
        api.setCSRFToken('manual-token');
        const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>(async () =>
            Promise.resolve(createFetchResponseMock()),
        );
        global.fetch = fetchMock as typeof fetch;

        await api.streamQuery(
            {
                base64: false,
            } as never,
            createStreamQueryOptions(),
        );

        const headers = fetchMock.mock.calls[0][1].headers;

        expect(headers).toBeInstanceOf(Headers);
        expect((headers as Headers).get(CSRF_TOKEN_HEADER_NAME)).toBe('manual-token');
    });

    test('uses current cookie getter token before manually set fallback', async () => {
        const api = createStreamingApi(() => 'cookie-token');
        api.setCSRFToken('manual-token');
        const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>(async () =>
            Promise.resolve(createFetchResponseMock()),
        );
        global.fetch = fetchMock as typeof fetch;

        await api.streamQuery(
            {
                base64: false,
            } as never,
            createStreamQueryOptions(),
        );

        const headers = fetchMock.mock.calls[0][1].headers;

        expect(headers).toBeInstanceOf(Headers);
        expect((headers as Headers).get(CSRF_TOKEN_HEADER_NAME)).toBe('cookie-token');
    });

    test('sends database in both URL parameters and body for streaming queries', async () => {
        const api = createStreamingApi();
        const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>(async () =>
            Promise.resolve(createFetchResponseMock()),
        );
        global.fetch = fetchMock as typeof fetch;

        await api.streamQuery(
            {
                database: '/Root/test',
                base64: false,
            },
            createStreamQueryOptions(),
        );

        const [url, request] = fetchMock.mock.calls[0];

        expect(new URL(url, 'http://localhost').searchParams.get('database')).toBe('/Root/test');
        expect(JSON.parse(request.body as string)).toEqual(
            expect.objectContaining({
                database: '/Root/test',
            }),
        );
    });

    test('rejects a streaming authUrl response after reporting authentication required', async () => {
        const api = new YdbEmbeddedAPI({
            webVersion: false,
            withCredentials: false,
            singleClusterMode: true,
            proxyMeta: false,
            useRelativePath: false,
            useMetaSettings: false,
            csrfTokenGetter: undefined,
            defaults: undefined,
        });
        const onUnauthenticated = jest.fn();
        api.setOnUnauthenticated(onUnauthenticated);
        global.fetch = jest.fn(async () => createUnauthorizedFetchResponseMock());

        await expect(
            api.streaming.streamQuery({base64: false} as never, createStreamQueryOptions()),
        ).rejects.toMatchObject({
            message: '401 Unauthorized',
            status: 401,
            statusText: 'Unauthorized',
            data: {authUrl: 'https://auth.example.com/login'},
            config: {url: 'https://viewer.example.com/viewer/query', method: 'POST'},
        });

        expect(onUnauthenticated).toHaveBeenCalledTimes(1);
        expect(onUnauthenticated).toHaveBeenCalledWith();
    });
});
