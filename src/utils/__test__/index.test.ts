import {normalizePathSlashes} from '../';

describe('normalizePathSlashes', () => {
    test('should handle empty strings', () => {
        expect(normalizePathSlashes('')).toBe('');
    });
    test('should handle strings without slashes', () => {
        expect(normalizePathSlashes('path')).toBe('path');
    });
    test('should handle paths with single slash', () => {
        expect(normalizePathSlashes('/path')).toBe('/path');
    });
    test('should handle paths with trailing slash', () => {
        expect(normalizePathSlashes('path/')).toBe('path/');
    });
    test('should handle paths with multiple trailing slashes', () => {
        expect(normalizePathSlashes('path////')).toBe('path/');
    });
    test('should handle full paths with normal slashes', () => {
        expect(normalizePathSlashes('http://example.com/path/to/resource')).toBe(
            'http://example.com/path/to/resource',
        );
    });
    test('should replace multiple slashes with a single slash', () => {
        expect(normalizePathSlashes('http://example.com//path//to////resource')).toBe(
            'http://example.com/path/to/resource',
        );
    });
    test('should replace slashes more than two slashes after a colon', () => {
        expect(normalizePathSlashes('http://///example.com/path/to/resource')).toBe(
            'http://example.com/path/to/resource',
        );
    });
});
