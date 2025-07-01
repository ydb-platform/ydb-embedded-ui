import {
    getCleanBalancerValue,
    parseBalancer,
    prepareBackendFromBalancer,
    removePort,
    removeProtocol,
    removeViewerPathname,
} from '../parseBalancer';

describe('parseBalancer', () => {
    test('should parse balancer with viewer proxy', () => {
        const rawValue =
            'https://viewer.ydb.ru:443/ydb-testing-0000.search.ydb.net:8765/viewer/json';
        const balancer = 'ydb-testing-0000.search.ydb.net:8765';
        const proxy = 'viewer.ydb.ru:443';

        const parsedBalancerWithViewer = parseBalancer(rawValue);

        expect(parsedBalancerWithViewer.balancer).toBe(balancer);
        expect(parsedBalancerWithViewer.proxy).toBe(proxy);
    });
    test('should parse balancer with bastion proxy', () => {
        const rawValue = 'https://ydb.bastion.cloud.ru:443/ydbproxy.ydb.cloud.net:8765/viewer/json';
        const balancer = 'ydbproxy.ydb.cloud.net:8765';
        const proxy = 'ydb.bastion.cloud.ru:443';

        const parsedBalancerWithBastion = parseBalancer(rawValue);

        expect(parsedBalancerWithBastion.balancer).toBe(balancer);
        expect(parsedBalancerWithBastion.proxy).toBe(proxy);
    });
    test('should parse balancer with custom proxy', () => {
        const rawValue =
            'https://proxy.ydb.mdb.cloud-preprod.net:443/ydbproxy-public.ydb.cloud-preprod.net:8765/viewer/json';
        const balancer = 'ydbproxy-public.ydb.cloud-preprod.net:8765';
        const proxy = 'proxy.ydb.mdb.cloud-preprod.net:443';

        const parsedBalancerWithCustomProxy = parseBalancer(rawValue);

        expect(parsedBalancerWithCustomProxy.balancer).toBe(balancer);
        expect(parsedBalancerWithCustomProxy.proxy).toBe(proxy);
    });
    test('should parse balancer without proxy', () => {
        const rawValue = 'https://ydb-testing-0000.search.net:8765/viewer/json';
        const balancer = 'ydb-testing-0000.search.net:8765';

        const parsedBalancerWithoutProxy = parseBalancer(rawValue);

        expect(parsedBalancerWithoutProxy.balancer).toBe(balancer);
        expect(parsedBalancerWithoutProxy.proxy).toBe(undefined);
    });

    test('should parse pure balancer', () => {
        const pureBalancer = 'ydb-testing-0000.search.net:8765';

        const parsedPureBalancer = parseBalancer(pureBalancer);

        expect(parsedPureBalancer.balancer).toBe(pureBalancer);
        expect(parsedPureBalancer.proxy).toBe(undefined);
    });
});

describe('removeViewerPathname', () => {
    test('should remove /viewer/json pathname', () => {
        const initialValue = 'https://ydb-testing-0000.search.net:8765/viewer/json';
        const result = 'https://ydb-testing-0000.search.net:8765';

        expect(removeViewerPathname(initialValue)).toBe(result);
    });
    test('should remove /viewer pathname', () => {
        const initialValue = 'https://ydb-testing-0000.search.net:8765/viewer';
        const result = 'https://ydb-testing-0000.search.net:8765';

        expect(removeViewerPathname(initialValue)).toBe(result);
    });
    test('should not change input if there is no /viewer or /viewer/json', () => {
        const initialValue = 'https://ydb-testing-0000.search.net:8765';

        expect(removeViewerPathname(initialValue)).toBe(initialValue);
    });
});
describe('removeProtocol', () => {
    test('should remove protocol from start', () => {
        const initialValue = 'https://ydb-testing-0000.search.net:8765/viewer/json';
        const result = 'ydb-testing-0000.search.net:8765/viewer/json';

        expect(removeProtocol(initialValue)).toBe(result);
    });
    test('should not remove protocol string in the middle', () => {
        const initialValue = 'proxy/host/https:ydb-testing-0000.search.net';

        expect(removeProtocol(initialValue)).toBe(initialValue);
    });
});
describe('removePort', () => {
    test('should remove port', () => {
        const initialValue = 'ydb-testing-0000.search.net:8765';
        const result = 'ydb-testing-0000.search.net';

        expect(removePort(initialValue)).toBe(result);
    });
});
describe('getCleanBalancerValue', () => {
    test('should return balancer value without protocol, proxy, port and pathname', () => {
        const initialValue =
            'https://ydb.bastion.cloud.ru:443/ydbproxy.ydb.cloud.net:8765/viewer/json';
        const result = 'ydbproxy.ydb.cloud.net';

        expect(getCleanBalancerValue(initialValue)).toBe(result);
    });
});
describe('prepareBackendFromBalancer', () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');

    afterEach(() => {
        windowSpy.mockClear();
    });
    afterAll(() => {
        windowSpy.mockRestore();
    });

    test('should not change full balancer value - only remove viewer pathname', () => {
        const initialValue = 'https://ydb-testing-0000.search.net:8765/viewer/json';
        const result = 'https://ydb-testing-0000.search.net:8765';

        expect(prepareBackendFromBalancer(initialValue)).toBe(result);
    });

    test('should add meta backend for relative balancer value', () => {
        const initialValue = '/proxy/host/ydb-testing-0000.search.net/viewer/json';
        const result = 'https://my-host.ru/proxy/host/ydb-testing-0000.search.net';

        windowSpy.mockImplementation(() => {
            return {
                meta_backend: 'https://my-host.ru',
            } as Window & typeof globalThis;
        });

        expect(prepareBackendFromBalancer(initialValue)).toBe(result);
    });
    test('should add relative meta backend for relative balancer value', () => {
        const initialValue = '/proxy/host/ydb-testing-0000.search.net/viewer/json';
        const result = '/meta/proxy/host/ydb-testing-0000.search.net';

        windowSpy.mockImplementation(() => {
            return {
                meta_backend: '/meta',
            } as Window & typeof globalThis;
        });

        expect(prepareBackendFromBalancer(initialValue)).toBe(result);
    });
    test('should not add empty meta backend for relative balancer value', () => {
        const initialValue = '/proxy/host/ydb-testing-0000.search.net/viewer/json';
        const result = '/proxy/host/ydb-testing-0000.search.net';

        windowSpy.mockImplementation(() => {
            return {
                meta_backend: '',
            } as Window & typeof globalThis;
        });

        expect(prepareBackendFromBalancer(initialValue)).toBe(result);
    });
    test('should not add undefined meta backend for relative balancer value', () => {
        const initialValue = '/proxy/host/ydb-testing-0000.search.net/viewer/json';
        const result = '/proxy/host/ydb-testing-0000.search.net';

        windowSpy.mockImplementation(() => {
            return {
                meta_backend: undefined,
            } as Window & typeof globalThis;
        });

        expect(prepareBackendFromBalancer(initialValue)).toBe(result);
    });
});
