jest.mock('../../../store', () => ({
    backend: undefined,
    clusterName: undefined,
}));

import {isRedirectToAuth} from '../../../utils/response';
import {handleBaseApiResponseError, recoverXhrResponseFromNetworkError} from '../base';
import * as needResetModule from '../utils/needReset';

interface XhrRequestMockParams {
    readyState?: number;
    status?: number;
    statusText?: string;
    responseText?: string;
    responseURL?: string;
    rawHeaders?: string;
}

interface NetworkErrorMock {
    name: string;
    message: string;
    code: string;
    config: {
        url: string;
        method: string;
    };
    request?: unknown;
    response?: unknown;
    status?: number;
}

function createXhrRequestMock({
    readyState = 4,
    status = 504,
    statusText = 'Deadline Exceeded',
    responseText = '',
    responseURL = 'https://oidc-proxy-preprod.example.net/viewer/json/whoami?database=%2Fdb',
    rawHeaders = '',
}: XhrRequestMockParams = {}) {
    return {
        readyState,
        status,
        statusText,
        responseText,
        responseURL,
        getAllResponseHeaders: () => rawHeaders,
    };
}

function createNetworkError(request?: unknown): NetworkErrorMock {
    return {
        name: 'AxiosError',
        message: 'Network Error',
        code: 'ERR_NETWORK',
        config: {
            url: '/viewer/json/whoami?database=%2Fdb',
            method: 'get',
        },
        request,
    };
}

describe('recoverXhrResponseFromNetworkError', () => {
    test('restores HTTP response details from recoverable XHR network error', () => {
        const error = createNetworkError(
            createXhrRequestMock({
                rawHeaders: [
                    'Content-Type: text/plain; charset=utf-8',
                    'X-Worker-Name: oidc-proxy-1-vm-preprod.example.net',
                    'X-Trace-Id: trace-id-504',
                ].join('\r\n'),
            }),
        );

        const response = recoverXhrResponseFromNetworkError(error);

        expect(response).toEqual(
            expect.objectContaining({
                status: 504,
                statusText: 'Deadline Exceeded',
                data: '',
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'x-worker-name': 'oidc-proxy-1-vm-preprod.example.net',
                    'x-trace-id': 'trace-id-504',
                },
                config: expect.objectContaining({
                    url: 'https://oidc-proxy-preprod.example.net/viewer/json/whoami?database=%2Fdb',
                    method: 'get',
                }),
                code: 'ERR_NETWORK',
                message: 'Network Error',
            }),
        );
        expect(error.response).toBe(response);
        expect(error.status).toBe(504);
    });

    test.each([
        {
            title: 'status is zero',
            request: createXhrRequestMock({status: 0}),
        },
        {
            title: 'readyState is not done',
            request: createXhrRequestMock({readyState: 3}),
        },
        {
            title: 'request does not expose headers reader',
            request: {
                readyState: 4,
                status: 504,
                statusText: 'Deadline Exceeded',
            },
        },
        {
            title: 'request is missing entirely',
            request: undefined,
        },
    ])('does not restore response when $title', ({request}) => {
        const error = createNetworkError(request);

        const response = recoverXhrResponseFromNetworkError(error);

        expect(response).toBeUndefined();
        expect(error.response).toBeUndefined();
    });
});

describe('handleBaseApiResponseError', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('restores recovered auth response in shape compatible with redirect-to-auth checks', () => {
        const error = createNetworkError(
            createXhrRequestMock({
                status: 401,
                statusText: 'Unauthorized',
                responseText: JSON.stringify({authUrl: 'https://auth.example.com/login'}),
                rawHeaders: 'Content-Type: application/json',
            }),
        );

        const response = recoverXhrResponseFromNetworkError(error);

        expect(response).toEqual(
            expect.objectContaining({
                status: 401,
                data: {authUrl: 'https://auth.example.com/login'},
            }),
        );
        expect(isRedirectToAuth(response)).toBe(true);
    });

    test('preserves NEED_RESET behavior after recovered response JSON parsing', async () => {
        const visibilityStateDescriptor = Object.getOwnPropertyDescriptor(
            document,
            'visibilityState',
        );
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });

        const processNeedResetSpy = jest
            .spyOn(needResetModule, 'processNeedReset')
            .mockImplementation(jest.fn());
        const error = createNetworkError(
            createXhrRequestMock({
                status: 401,
                statusText: 'Unauthorized',
                responseText: JSON.stringify({code: 'NEED_RESET'}),
                rawHeaders: 'Content-Type: application/json',
            }),
        );

        await expect(handleBaseApiResponseError(error)).rejects.toBe(error);

        expect(processNeedResetSpy).toHaveBeenCalledTimes(1);

        if (visibilityStateDescriptor) {
            Object.defineProperty(document, 'visibilityState', visibilityStateDescriptor);
        } else {
            Reflect.deleteProperty(document, 'visibilityState');
        }
    });
});
