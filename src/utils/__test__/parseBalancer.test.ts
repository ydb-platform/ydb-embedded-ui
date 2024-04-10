import {
    getCleanBalancerValue,
    parseBalancer,
    removePort,
    removeProtocol,
    removeViewerPathname,
} from '../parseBalancer';

describe('parseBalancer', () => {
    it('should parse balancer with viewer proxy', () => {
        const rawValue =
            'https://viewer.ydb.ru:443/ydb-testing-0000.search.ydb.net:8765/viewer/json';
        const balancer = 'ydb-testing-0000.search.ydb.net:8765';
        const proxy = 'viewer.ydb.ru:443';

        const parsedBalancerWithViewer = parseBalancer(rawValue);

        expect(parsedBalancerWithViewer.balancer).toBe(balancer);
        expect(parsedBalancerWithViewer.proxy).toBe(proxy);
    });
    it('should parse balancer with bastion proxy', () => {
        const rawValue = 'https://ydb.bastion.cloud.ru:443/ydbproxy.ydb.cloud.net:8765/viewer/json';
        const balancer = 'ydbproxy.ydb.cloud.net:8765';
        const proxy = 'ydb.bastion.cloud.ru:443';

        const parsedBalancerWithBastion = parseBalancer(rawValue);

        expect(parsedBalancerWithBastion.balancer).toBe(balancer);
        expect(parsedBalancerWithBastion.proxy).toBe(proxy);
    });
    it('should parse balancer with custom proxy', () => {
        const rawValue =
            'https://proxy.ydb.mdb.cloud-preprod.net:443/ydbproxy-public.ydb.cloud-preprod.net:8765/viewer/json';
        const balancer = 'ydbproxy-public.ydb.cloud-preprod.net:8765';
        const proxy = 'proxy.ydb.mdb.cloud-preprod.net:443';

        const parsedBalancerWithCustomProxy = parseBalancer(rawValue);

        expect(parsedBalancerWithCustomProxy.balancer).toBe(balancer);
        expect(parsedBalancerWithCustomProxy.proxy).toBe(proxy);
    });
    it('should parse balancer without proxy', () => {
        const rawValue = 'https://ydb-testing-0000.search.net:8765/viewer/json';
        const balancer = 'ydb-testing-0000.search.net:8765';

        const parsedBalancerWithoutProxy = parseBalancer(rawValue);

        expect(parsedBalancerWithoutProxy.balancer).toBe(balancer);
        expect(parsedBalancerWithoutProxy.proxy).toBe(undefined);
    });

    it('should parse pure balancer', () => {
        const pureBalancer = 'ydb-testing-0000.search.net:8765';

        const parsedPureBalancer = parseBalancer(pureBalancer);

        expect(parsedPureBalancer.balancer).toBe(pureBalancer);
        expect(parsedPureBalancer.proxy).toBe(undefined);
    });
});

describe('removeViewerPathname', () => {
    it('should remove pathname', () => {
        const initialValue = 'https://ydb-testing-0000.search.net:8765/viewer/json';
        const result = 'https://ydb-testing-0000.search.net:8765';

        expect(removeViewerPathname(initialValue)).toBe(result);
    });
});
describe('removeProtocol', () => {
    it('should remove protocol', () => {
        const initialValue = 'https://ydb-testing-0000.search.net:8765/viewer/json';
        const result = 'ydb-testing-0000.search.net:8765/viewer/json';

        expect(removeProtocol(initialValue)).toBe(result);
    });
});
describe('removePort', () => {
    it('should remove port', () => {
        const initialValue = 'ydb-testing-0000.search.net:8765';
        const result = 'ydb-testing-0000.search.net';

        expect(removePort(initialValue)).toBe(result);
    });
});
describe('getCleanBalancerValue', () => {
    it('should return balancer value without protocol, proxy, port and pathname', () => {
        const initialValue =
            'https://ydb.bastion.cloud.ru:443/ydbproxy.ydb.cloud.net:8765/viewer/json';
        const result = 'ydbproxy.ydb.cloud.net';

        expect(getCleanBalancerValue(initialValue)).toBe(result);
    });
});
