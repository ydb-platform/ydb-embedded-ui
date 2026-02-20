import {splitNameIntoParts} from '../selectors';

describe('splitNameIntoParts', () => {
    test('splits on underscores', () => {
        expect(splitNameIntoParts('my_cluster')).toEqual(['my', 'cluster']);
    });

    test('splits on dashes', () => {
        expect(splitNameIntoParts('env-dev')).toEqual(['env', 'dev']);
    });

    test('separates digits from letters', () => {
        expect(splitNameIntoParts('vla03')).toEqual(['vla', '03']);
    });

    test('splits on spaces', () => {
        expect(splitNameIntoParts('YDB DEV VLA03')).toEqual(['ydb', 'dev', 'vla', '03']);
    });

    test('splits on parentheses and mixed separators', () => {
        expect(splitNameIntoParts('Cloud Prod YDB Public (ru-central1)')).toEqual([
            'cloud',
            'prod',
            'ydb',
            'public',
            'ru',
            'central',
            '1',
        ]);
    });

    test('handles combined separators', () => {
        expect(splitNameIntoParts('my_cluster env-dev vla03')).toEqual([
            'my',
            'cluster',
            'env',
            'dev',
            'vla',
            '03',
        ]);
    });

    test('returns empty array for undefined', () => {
        expect(splitNameIntoParts(undefined)).toEqual([]);
    });

    test('returns empty array for empty string', () => {
        expect(splitNameIntoParts('')).toEqual([]);
    });

    test('returns empty array for string with only separators', () => {
        expect(splitNameIntoParts('---___   ()')).toEqual([]);
    });
});
