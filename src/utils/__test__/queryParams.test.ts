import {omitVolatileQueryParamsFromSearch} from '../queryParams';

describe('omitVolatileQueryParamsFromSearch', () => {
    test('returns the search untouched when there are no volatile params', () => {
        expect(omitVolatileQueryParamsFromSearch('?search=a%20b&tag=keep')).toBe(
            '?search=a%20b&tag=keep',
        );
        expect(omitVolatileQueryParamsFromSearch('')).toBe('');
    });

    test('removes utm_referrer and keeps other params', () => {
        expect(
            omitVolatileQueryParamsFromSearch(
                '?search=alpha&utm_referrer=https%3A%2F%2Fexample.test%2Forigin&tag=keep',
            ),
        ).toBe('?search=alpha&tag=keep');
    });

    test('returns an empty search when only volatile params are present', () => {
        expect(omitVolatileQueryParamsFromSearch('?utm_referrer=https%3A%2F%2Fexample.test')).toBe(
            '',
        );
    });
});
