import {isQueryCancelledError} from '../isQueryCancelledError';

describe('isQueryCancelledError', () => {
    test('recognizes an AbortError wrapped by an RTK Query error', () => {
        const abortError = Object.assign(new Error('Aborted'), {name: 'AbortError'});

        expect(
            isQueryCancelledError({
                error: abortError,
                extra: {queryStats: {status: 'failed'}},
            }),
        ).toBe(true);
    });
});
