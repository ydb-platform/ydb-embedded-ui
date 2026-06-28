jest.mock('../../../store', () => ({
    backend: undefined,
    clusterName: undefined,
}));

jest.mock('@mjackson/multipart-parser', () => ({
    parseMultipart: jest.fn(async () => undefined),
}));

import {CSRF_TOKEN_HEADER_NAME} from '../base';
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

describe('StreamingAPI CSRF header', () => {
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
});
