jest.mock('../../../store', () => ({
    backend: undefined,
    clusterName: undefined,
    codeAssistBackend: 'https://code-assist.example.com',
}));

import type {
    AxiosAdapter,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

import {CSRF_TOKEN_HEADER_NAME} from '../base';
import {CodeAssistAPI} from '../codeAssist';

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

function createCodeAssistApi(config: AxiosRequestConfig) {
    return new CodeAssistAPI(
        {config},
        {
            singleClusterMode: true,
            proxyMeta: false,
            useRelativePath: false,
            csrfTokenGetter: () => 'csrf-token',
        },
    );
}

describe('CodeAssistAPI CSRF header', () => {
    test('does not send YDB CSRF token to external code assist backend', async () => {
        const {adapter, requests} = createMockAdapter();
        const api = createCodeAssistApi({adapter, withCredentials: true});

        await api.sendCodeAssistTelemetry({Action: 'test'} as never);

        expect(requests[0].url).toBe('https://code-assist.example.com/code-assist-telemetry');
        expect(requests[0].headers.get(CSRF_TOKEN_HEADER_NAME)).toBeUndefined();
    });
});
