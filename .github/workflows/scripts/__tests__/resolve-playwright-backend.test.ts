import {resolvePlaywrightBackend} from '../resolve-playwright-backend';

describe('resolvePlaywrightBackend', () => {
    test.each(['', '   '])('rejects a missing backend before Docker starts', (backend) => {
        expect(() => resolvePlaywrightBackend(backend)).toThrow(
            'PLAYWRIGHT_APP_BACKEND is required',
        );
    });

    test.each(['/viewer', 'ftp://localhost:8765'])(
        'rejects an unsupported backend URL: %s',
        (backend) => {
            expect(() => resolvePlaywrightBackend(backend)).toThrow(
                'PLAYWRIGHT_APP_BACKEND must be an absolute HTTP URL',
            );
        },
    );

    test('routes an action-owned IPv4 loopback port through fixed container localhost', () => {
        expect(resolvePlaywrightBackend('http://127.0.0.1:43123')).toEqual({
            backendUrl: 'http://localhost:8765',
            proxyTargetUrl: 'http://host.docker.internal:43123',
        });
    });

    test('routes an IPv6 loopback port through fixed container localhost', () => {
        expect(resolvePlaywrightBackend('http://[::1]:43123/viewer?database=%2Flocal')).toEqual({
            backendUrl: 'http://localhost:8765/viewer?database=%2Flocal',
            proxyTargetUrl: 'http://host.docker.internal:43123',
        });
    });

    test('preserves a loopback URL path and query for the browser backend', () => {
        expect(resolvePlaywrightBackend('http://localhost:43123/viewer?database=%2Flocal')).toEqual(
            {
                backendUrl: 'http://localhost:8765/viewer?database=%2Flocal',
                proxyTargetUrl: 'http://host.docker.internal:43123',
            },
        );
    });

    test('uses the protocol default port for a loopback URL without an explicit port', () => {
        expect(resolvePlaywrightBackend('http://localhost')).toEqual({
            backendUrl: 'http://localhost:8765',
            proxyTargetUrl: 'http://host.docker.internal:80',
        });
    });

    test('passes a remote backend through without a proxy', () => {
        expect(resolvePlaywrightBackend(' https://ydb.example.test:9443/base ')).toEqual({
            backendUrl: 'https://ydb.example.test:9443/base',
            proxyTargetUrl: undefined,
        });
    });

    test.each([
        'http://user:password@localhost:8765/viewer',
        'https://user@ydb.example.test:9443/base',
    ])('rejects backend credentials: %s', (backend) => {
        expect(() => resolvePlaywrightBackend(backend)).toThrow(
            'PLAYWRIGHT_APP_BACKEND must not contain credentials',
        );
    });
});
