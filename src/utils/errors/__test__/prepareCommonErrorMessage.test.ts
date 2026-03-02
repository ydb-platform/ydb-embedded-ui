import {prepareCommonErrorMessage} from '../index';

describe('prepareCommonErrorMessage', () => {
    test('should return string error as-is', () => {
        expect(prepareCommonErrorMessage('Something went wrong')).toBe('Something went wrong');
    });

    test('should return unknown error for null/undefined', () => {
        expect(prepareCommonErrorMessage(null)).toBe('An unknown error occurred');
        expect(prepareCommonErrorMessage(undefined)).toBe('An unknown error occurred');
    });

    test('should return message for network errors', () => {
        const error = {message: 'Network Error', code: 'ERR_NETWORK'};
        expect(prepareCommonErrorMessage(error)).toBe('Network Error');
    });

    test('should return data.error for response errors with error field', () => {
        const error = {
            status: 500,
            data: {error: 'Internal server error'},
        };
        expect(prepareCommonErrorMessage(error)).toBe('Internal server error');
    });

    test('should return data.message for response errors with message field', () => {
        const error = {
            status: 429,
            data: {message: 'Throughput limit exceeded'},
        };
        expect(prepareCommonErrorMessage(error)).toBe('Throughput limit exceeded');
    });

    test('should return data.error.message for response errors with error object', () => {
        const error = {
            status: 429,
            data: {
                error: {issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'},
                issues: [{issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'}],
                status: 'OVERLOADED',
            },
        };
        expect(prepareCommonErrorMessage(error)).toBe('Throughput limit exceeded');
    });

    test('should return data string for response errors with non-empty string data', () => {
        const error = {
            status: 400,
            data: 'Cluster not found',
        };
        expect(prepareCommonErrorMessage(error)).toBe('Cluster not found');
    });

    test('should return statusText for response errors with empty string data', () => {
        const error = {
            status: 503,
            statusText: 'Service Unavailable',
            data: '',
        };
        expect(prepareCommonErrorMessage(error)).toBe('Service Unavailable');
    });

    test('should return statusText for 502 with empty body', () => {
        const error = {
            status: 502,
            statusText: 'Bad Gateway',
            data: '',
        };
        expect(prepareCommonErrorMessage(error)).toBe('Bad Gateway');
    });

    test('should return statusText when data is undefined', () => {
        const error = {
            status: 500,
            statusText: 'Internal Server Error',
        };
        expect(prepareCommonErrorMessage(error)).toBe('Internal Server Error');
    });

    test('should return "Access forbidden" for 403 without data', () => {
        const error = {
            status: 403,
        };
        expect(prepareCommonErrorMessage(error)).toBe('Access forbidden');
    });

    test('should return defaultMessage when provided and no specific message found', () => {
        const error = {status: 418};
        expect(prepareCommonErrorMessage(error, 'Custom default')).toBe('Custom default');
    });

    test('should return Error.message for Error instances', () => {
        const error = new Error('Something broke');
        expect(prepareCommonErrorMessage(error)).toBe('Something broke');
    });

    test('should stringify unknown objects as fallback', () => {
        const error = {foo: 'bar'};
        expect(prepareCommonErrorMessage(error)).toBe('{"foo":"bar"}');
    });
});
