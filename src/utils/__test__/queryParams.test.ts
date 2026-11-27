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

    test('keeps names of other params, including bracket notation', () => {
        const search = '?search%5B%5D=secondary&search=alpha';

        expect(omitVolatileQueryParamsFromSearch(search)).toBe(search);
        expect(omitVolatileQueryParamsFromSearch(`${search}&utm_referrer=x`)).toBe(search);
    });

    test('returns an empty search when only volatile params are present', () => {
        expect(omitVolatileQueryParamsFromSearch('?utm_referrer=https%3A%2F%2Fexample.test')).toBe(
            '',
        );
    });
});
