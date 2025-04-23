import {prepareEndpoint} from '../utils';

describe('prepareEndpoint', () => {
    test('should remove all search params', () => {
        const input = 'grpc://example.com:2139/?database=/root/test&param=value';
        const expected = 'grpc://example.com:2139';
        expect(prepareEndpoint(input)).toBe(expected);
    });
    test('should handle URL without path or params', () => {
        const input = 'grpc://example.com:2139';
        const expected = 'grpc://example.com:2139';
        expect(prepareEndpoint(input)).toBe(expected);
    });
    test('should remove trailing slash from path', () => {
        const input = 'grpc://example.com:2139/';
        const expected = 'grpc://example.com:2139';
        expect(prepareEndpoint(input)).toBe(expected);
    });
    test('should handle complex paths', () => {
        const input = 'grpc://example.com:2139/multi/level/path/?database=/root/test';
        const expected = 'grpc://example.com:2139/multi/level/path';
        expect(prepareEndpoint(input)).toBe(expected);
    });
    test('should handle empty string', () => {
        expect(prepareEndpoint('')).toBeUndefined();
    });
    test('should handle undefined input', () => {
        expect(prepareEndpoint()).toBeUndefined();
    });
    test('should return undefined for invalid URL', () => {
        const input = 'invalid-url';
        expect(prepareEndpoint(input)).toBeUndefined();
    });
});
