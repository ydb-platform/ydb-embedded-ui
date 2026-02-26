import {extractErrorDetails} from '../extractErrorDetails';

describe('extractErrorDetails', () => {
    test('should return null for null/undefined/string', () => {
        expect(extractErrorDetails(null)).toBeNull();
        expect(extractErrorDetails(undefined)).toBeNull();
        expect(extractErrorDetails('some error')).toBeNull();
        expect(extractErrorDetails(42)).toBeNull();
    });

    test('should extract status and statusText from HTTP error response', () => {
        const error = {status: 500, statusText: 'Internal Server Error', data: 'error'};
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                status: 500,
                statusText: 'Internal Server Error',
            }),
        );
    });

    test('should extract _meta fields from HTTP error response', () => {
        const error = {
            status: 400,
            statusText: 'Bad Request',
            data: 'error',
            _meta: {
                traceId: 'abc123',
                requestUrl: '/viewer/json/query',
                method: 'POST',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                status: 400,
                statusText: 'Bad Request',
                traceId: 'abc123',
                requestUrl: '/viewer/json/query',
                method: 'POST',
            }),
        );
    });

    test('should detect hasIssues for responses with issues array', () => {
        const error = {
            status: 400,
            data: {
                issues: [{message: 'Syntax error'}],
            },
        };
        const details = extractErrorDetails(error);

        expect(details?.hasIssues).toBe(true);
    });

    test('should not set hasIssues for responses without issues', () => {
        const error = {status: 500, statusText: 'Server Error', data: 'Internal error'};
        const details = extractErrorDetails(error);

        expect(details?.hasIssues).toBeUndefined();
    });

    test('should extract from network error', () => {
        const error = {
            message: 'Network Error',
            code: 'ERR_NETWORK',
            config: {
                url: '/viewer/json/cluster',
                method: 'get',
            },
        };
        const details = extractErrorDetails(error);

        expect(details).toEqual(
            expect.objectContaining({
                errorCode: 'ERR_NETWORK',
                requestUrl: '/viewer/json/cluster',
                method: 'GET',
            }),
        );
    });

    test('should return null for network error without config', () => {
        const error = {message: 'Network Error'};
        const details = extractErrorDetails(error);

        expect(details).toBeNull();
    });

    test('should return null for empty response error', () => {
        const error = {isCancelled: true};
        const details = extractErrorDetails(error);

        expect(details).toBeNull();
    });
});
