import {extractErrorDetails} from '../extractErrorDetails';

describe('extractErrorDetails', () => {
    test('should return null for null/undefined/string/number', () => {
        expect(extractErrorDetails(null)).toBeNull();
        expect(extractErrorDetails(undefined)).toBeNull();
        expect(extractErrorDetails('some error')).toBeNull();
        expect(extractErrorDetails(42)).toBeNull();
    });

    test('should return null for cancelled requests', () => {
        const error = {isCancelled: true};
        expect(extractErrorDetails(error)).toBeNull();
    });

    test('should return null for objects without useful metadata', () => {
        const error = {message: 'Network Error'};
        expect(extractErrorDetails(error)).toBeNull();
    });

    test('should extract status and statusText from HTTP error', () => {
        const error = {status: 500, statusText: 'Internal Server Error', data: 'error'};
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                status: 500,
                statusText: 'Internal Server Error',
            }),
        );
    });

    test('should extract traceId from traceresponse header', () => {
        const error = {
            status: 400,
            statusText: 'Bad Request',
            data: 'Cluster not found',
            headers: {
                traceresponse: '00-b3d9fbfed1452b574dc654b004ed5b6f-474a6a958ff472fb-00',
                'x-request-id': 'b401739a-019b-41a8-8eaf-e168faa8b13b',
            },
            config: {
                url: '/api/meta3/proxy/cluster/ydb-meta/viewer/capabilities',
                method: 'get',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                status: 400,
                statusText: 'Bad Request',
                traceId: 'b3d9fbfed1452b574dc654b004ed5b6f',
                requestId: 'b401739a-019b-41a8-8eaf-e168faa8b13b',
                requestUrl: '/api/meta3/proxy/cluster/ydb-meta/viewer/capabilities',
                method: 'GET',
            }),
        );
    });

    test('should extract x-trace-id when traceresponse is absent', () => {
        const error = {
            status: 401,
            statusText: 'Unauthorized',
            headers: {
                'x-trace-id': '26d0e0da1cafea7ff0bf3395cffcf647',
                'x-request-id': '7e8c3947-0b84-46b9-9052-0a7d7047f5af',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                traceId: '26d0e0da1cafea7ff0bf3395cffcf647',
                requestId: '7e8c3947-0b84-46b9-9052-0a7d7047f5af',
            }),
        );
    });

    test('should prefer traceresponse over x-trace-id', () => {
        const error = {
            status: 400,
            headers: {
                traceresponse: '00-aaaa-bbbb-00',
                'x-trace-id': 'cccc',
            },
        };
        const details = extractErrorDetails(error);

        expect(details?.traceId).toBe('aaaa');
    });

    test('should extract x-proxy-name and x-worker-name', () => {
        const error = {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
                'x-proxy-name': 'https://ydb-em-2-vm-preprod.ydb.mdb.cloud-preprod.yandex.net:443',
                'x-worker-name':
                    'vm-cc8gh9uqq4hkr3anjmh3-ru-central1-a-wfdp-ypar.cc8gh9uqq4hkr3anjmh3.ydb.mdb.cloud-preprod.yandex.net:8765',
                'x-request-id': 'ba767b14-d97b-45e6-889b-4bcccf5c9e46',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                proxyName: 'https://ydb-em-2-vm-preprod.ydb.mdb.cloud-preprod.yandex.net:443',
                workerName:
                    'vm-cc8gh9uqq4hkr3anjmh3-ru-central1-a-wfdp-ypar.cc8gh9uqq4hkr3anjmh3.ydb.mdb.cloud-preprod.yandex.net:8765',
                requestId: 'ba767b14-d97b-45e6-889b-4bcccf5c9e46',
            }),
        );
    });

    test('should extract requestUrl and method from config', () => {
        const error = {
            status: 503,
            statusText: 'Service Unavailable',
            data: '',
            config: {
                url: '/node/559390/viewer/json/whoami',
                method: 'options',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                requestUrl: '/node/559390/viewer/json/whoami',
                method: 'OPTIONS',
            }),
        );
    });

    test('should extract errorCode and config from network error', () => {
        const error = {
            message: 'Network Error',
            name: 'AxiosError',
            code: 'ERR_NETWORK',
            config: {
                url: '/viewer/json/cluster?tablets=true',
                method: 'get',
            },
            status: null,
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                errorCode: 'ERR_NETWORK',
                requestUrl: '/viewer/json/cluster?tablets=true',
                method: 'GET',
            }),
        );
        expect(details?.status).toBeUndefined();
    });

    test('should extract errorCode for timeout error', () => {
        const error = {
            message: 'timeout of 600000ms exceeded',
            code: 'ECONNABORTED',
            config: {
                url: '/viewer/json/query',
                method: 'post',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                errorCode: 'ECONNABORTED',
                requestUrl: '/viewer/json/query',
                method: 'POST',
            }),
        );
    });

    test('should detect hasIssues for HTTP 429 with issues', () => {
        const error = {
            status: 429,
            statusText: 'Too Many Requests',
            data: {
                issues: [{issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'}],
                error: {issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'},
                status: 'OVERLOADED',
            },
        };
        const details = extractErrorDetails(error);

        expect(details?.hasIssues).toBe(true);
        expect(details?.issues).toHaveLength(1);
        expect(details?.issues?.[0].message).toBe('Throughput limit exceeded');
    });

    test('should not set hasIssues for responses without issues', () => {
        const error = {status: 500, statusText: 'Server Error', data: 'Internal error'};
        const details = extractErrorDetails(error);

        expect(details?.hasIssues).toBeUndefined();
    });

    test('should extract responseBody from string data', () => {
        const error = {status: 400, data: 'Cluster not found'};
        const details = extractErrorDetails(error);

        expect(details?.responseBody).toBe('Cluster not found');
    });

    test('should extract responseBody from object data as JSON', () => {
        const error = {status: 500, data: {error: 'Internal server error'}};
        const details = extractErrorDetails(error);

        expect(details?.responseBody).toBe('{"error":"Internal server error"}');
    });

    test('should not extract responseBody from empty string data', () => {
        const error = {status: 503, statusText: 'Service Unavailable', data: ''};
        const details = extractErrorDetails(error);

        expect(details?.responseBody).toBeUndefined();
    });

    test('should truncate long responseBody', () => {
        const longBody = 'x'.repeat(600);
        const error = {status: 500, data: longBody};
        const details = extractErrorDetails(error);

        expect(details?.responseBody?.length).toBeLessThanOrEqual(501);
        expect(details?.responseBody).toMatch(/…$/);
    });

    test('should handle empty headers object', () => {
        const error = {status: 503, headers: {}};
        const details = extractErrorDetails(error);

        expect(details?.traceId).toBeUndefined();
        expect(details?.requestId).toBeUndefined();
        expect(details?.proxyName).toBeUndefined();
        expect(details?.workerName).toBeUndefined();
    });

    test('should set title from status and statusText for HTTP errors', () => {
        const error = {status: 500, statusText: 'Internal Server Error', data: 'error'};
        const details = extractErrorDetails(error);

        expect(details?.title).toBe('500 Internal Server Error');
    });

    test('should set title from status alone when statusText is missing', () => {
        const error = {status: 403};
        const details = extractErrorDetails(error);

        expect(details?.title).toBe('403');
    });

    test('should set title from message for network errors with errorCode', () => {
        const error = {
            message: 'Network Error',
            code: 'ERR_NETWORK',
            config: {url: '/viewer/json/cluster', method: 'get'},
        };
        const details = extractErrorDetails(error);

        expect(details?.title).toBe('Network Error');
    });

    test('should not set title for objects with only message (no errorCode)', () => {
        const error = {message: 'Network Error'};
        expect(extractErrorDetails(error)).toBeNull();
    });

    test('should extract dataMessage from data.error string', () => {
        const error = {status: 500, data: {error: 'Internal server error'}};
        const details = extractErrorDetails(error);

        expect(details?.dataMessage).toBe('Internal server error');
    });

    test('should extract dataMessage from data.error.message', () => {
        const error = {
            status: 429,
            statusText: 'Too Many Requests',
            data: {
                error: {issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'},
                issues: [{issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'}],
                status: 'OVERLOADED',
            },
        };
        const details = extractErrorDetails(error);

        expect(details?.dataMessage).toBe('Throughput limit exceeded');
        expect(details?.title).toBe('429 Too Many Requests');
    });

    test('should extract dataMessage from data.message', () => {
        const error = {
            status: 429,
            statusText: 'Too Many Requests',
            data: {message: 'Rate limit exceeded'},
        };
        const details = extractErrorDetails(error);

        expect(details?.dataMessage).toBe('Rate limit exceeded');
    });

    test('should extract dataMessage from short string data', () => {
        const error = {status: 400, data: 'Cluster not found'};
        const details = extractErrorDetails(error);

        expect(details?.dataMessage).toBe('Cluster not found');
        expect(details?.responseBody).toBe('Cluster not found');
    });

    test('should not extract dataMessage from long string data', () => {
        const longString = 'x'.repeat(300);
        const error = {status: 500, data: longString};
        const details = extractErrorDetails(error);

        expect(details?.dataMessage).toBeUndefined();
    });

    test('should not extract dataMessage from HTML string data', () => {
        const html = '<html><body><h1>429 Too Many Requests</h1></body></html>';
        const error = {status: 429, statusText: 'Too Many Requests', data: html};
        const details = extractErrorDetails(error);

        expect(details?.dataMessage).toBeUndefined();
        expect(details?.title).toBe('429 Too Many Requests');
    });

    test('should not extract dataMessage from empty data', () => {
        const error = {status: 503, statusText: 'Service Unavailable', data: ''};
        const details = extractErrorDetails(error);

        expect(details?.dataMessage).toBeUndefined();
    });

    test('should handle 503 with x-worker-name from nginx', () => {
        const error = {
            status: 503,
            statusText: 'Service Unavailable',
            data: '',
            headers: {
                'x-worker-name': 'ydb-ru-sas-1109.search.yandex.net:8765',
                server: 'nginx/1.18.0',
            },
            config: {
                url: '/node/559390/viewer/json/whoami',
                method: 'options',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                status: 503,
                statusText: 'Service Unavailable',
                workerName: 'ydb-ru-sas-1109.search.yandex.net:8765',
                requestUrl: '/node/559390/viewer/json/whoami',
                method: 'OPTIONS',
            }),
        );
    });
});
