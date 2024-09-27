import {transformPath} from '../transformPath';

describe('transformPath', () => {
    test.each([
        // Tests with various combinations of path and dbName
        ['/prod/v1/sth', '/prod', 'v1/sth'],
        ['/prod/v1/sth', 'prod', 'v1/sth'],
        ['/prod/v1/sth', '/prod/v1', 'sth'],
        ['/prod/v1/sth', 'prod/v1', 'sth'],
        ['/dev/v1/sth', '/dev', 'v1/sth'],
        ['/dev/v1/sth', 'dev', 'v1/sth'],
        ['/dev', '/dev', '/dev'],
        ['/dev', 'dev', '/dev'],
        ['/', '/dev', '/'],
        ['/', 'dev', '/'],
        ['', '/dev', '/'],
        ['', 'dev', '/'],
        ['/dev/v1/path/with/multiple/segments', '/dev', 'v1/path/with/multiple/segments'],
        ['/dev/v1/path/with/multiple/segments', 'dev', 'v1/path/with/multiple/segments'],
        ['/dev/v1/sth/', '/dev', 'v1/sth'],
        ['///dev/v1/sth', '/dev', 'v1/sth'],
        ['/v1/sth', '/dev', 'v1/sth'],
        ['/prod/v1/sth', '/dev', 'prod/v1/sth'],
        ['/prod/sub/v1/sth', '/prod/sub', 'v1/sth'],
        ['/prod/sub/v1/sth', 'prod/sub', 'v1/sth'],
        ['/prod/sub/v1/sth', '/prod', 'sub/v1/sth'],
        ['/prod/sub/v1/sth', 'prod', 'sub/v1/sth'],
    ])('transforms %s with dbName %s to %s', (input, dbName, expected) => {
        expect(transformPath(input, dbName)).toBe(expected);
    });

    test('handles root dbName', () => {
        expect(transformPath('/v1/sth', '/')).toBe('v1/sth');
        expect(transformPath('/v1/sth', '')).toBe('v1/sth');
        expect(transformPath('/', '/')).toBe('/');
        expect(transformPath('', '')).toBe('/');
    });

    test('handles paths with multiple leading slashes', () => {
        expect(transformPath('///dev/v1/sth', 'dev')).toBe('v1/sth');
        expect(transformPath('///dev/v1/sth', '/dev')).toBe('v1/sth');
    });
});
