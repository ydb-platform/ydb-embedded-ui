import {EPathType} from '../../../../types/api/schema';
import {isDomain, transformPath} from '../transformPath';

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

describe('isDomain', () => {
    test('should return true for valid domain paths', () => {
        expect(isDomain('/domain', EPathType.EPathTypeDir)).toBe(true);
        expect(isDomain('/another-domain', EPathType.EPathTypeDir)).toBe(true);
    });

    test('should return false for non-directory paths', () => {
        expect(isDomain('/domain', EPathType.EPathTypeColumnStore)).toBe(false);
        expect(isDomain('/domain', undefined)).toBe(false);
    });

    test('should return false for paths without slash', () => {
        expect(isDomain('domain', EPathType.EPathTypeDir)).toBe(false);
    });

    test('should return false for paths with multiple slashes', () => {
        expect(isDomain('/domain/subdomain', EPathType.EPathTypeDir)).toBe(false);
        expect(isDomain('/domain/', EPathType.EPathTypeDir)).toBe(false);
    });

    test('should return false for empty paths', () => {
        expect(isDomain('', EPathType.EPathTypeDir)).toBe(false);
    });

    test('should return true for root path', () => {
        expect(isDomain('/', EPathType.EPathTypeDir)).toBe(true);
    });
});
