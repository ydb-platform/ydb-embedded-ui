import {getObjectCreationErrorParams} from '../objectCreationMetrics';

describe('getObjectCreationErrorParams', () => {
    test.each([
        ['abort', {name: 'AbortError'}],
        ['request cancellation', {isCancelled: true}],
        ['YDB cancellation', {error: {message: 'Query was cancelled'}, issues: []}],
        [
            'wrapped YDB cancellation',
            {status: 400, data: {error: {message: 'Query was cancelled'}, issues: []}},
        ],
    ])('recognizes %s before other error categories', (_name, error) => {
        expect(getObjectCreationErrorParams(error)).toEqual({errorType: 'cancelled'});
    });

    test.each([
        [{error: {message: 'Table /Root/private already exists'}, issues: []}, {errorType: 'ydb'}],
        [
            {status: 403, data: {message: 'Private error details'}},
            {errorType: 'http', httpStatus: 403},
        ],
        [{status: 0, message: 'Network Error'}, {errorType: 'network'}],
        [{code: 'ECONNABORTED', message: 'timeout of 60000ms exceeded'}, {errorType: 'timeout'}],
        [{code: 'ETIMEDOUT'}, {errorType: 'timeout'}],
        [undefined, {errorType: 'unknown'}],
    ])('extracts only metric fields from %j', (error, expected) => {
        expect(getObjectCreationErrorParams(error)).toEqual(expected);
    });
});
