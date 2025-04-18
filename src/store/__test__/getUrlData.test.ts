import {getUrlData} from '../getUrlData';

describe('getUrlData', () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');

    afterEach(() => {
        windowSpy.mockClear();
    });
    afterAll(() => {
        windowSpy.mockRestore();
    });

    describe('multi-cluster version', () => {
        test('should parse pathname with folder', () => {
            windowSpy.mockImplementation(() => {
                return {
                    location: {
                        href: 'http://ydb-ui/ui/cluster?clusterName=my_cluster&backend=http://my-node:8765',
                        pathname: '/ui/cluster?clusterName=my_cluster&backend=http://my-node:8765',
                    },
                } as Window & typeof globalThis;
            });
            const result = getUrlData({singleClusterMode: false, customBackend: undefined});
            expect(result).toEqual({
                basename: '/ui',
                backend: 'http://my-node:8765',
                clusterName: 'my_cluster',
            });
        });
        test('should parse pathname with folder and some prefix', () => {
            windowSpy.mockImplementation(() => {
                return {
                    location: {
                        href: 'http://ydb-ui/monitoring/ui/cluster?clusterName=my_cluster&backend=http://my-node:8765',
                        pathname:
                            '/monitoring/ui/cluster?clusterName=my_cluster&backend=http://my-node:8765',
                    },
                } as Window & typeof globalThis;
            });
            const result = getUrlData({singleClusterMode: false, customBackend: undefined});
            expect(result).toEqual({
                basename: '/monitoring/ui',
                backend: 'http://my-node:8765',
                clusterName: 'my_cluster',
            });
        });
        test('should parse pathname with folder and some prefix', () => {
            windowSpy.mockImplementation(() => {
                return {
                    location: {
                        href: 'http://ydb-ui/cluster?clusterName=my_cluster&backend=http://my-node:8765',
                        pathname: '/cluster?clusterName=my_cluster&backend=http://my-node:8765',
                    },
                } as Window & typeof globalThis;
            });
            const result = getUrlData({singleClusterMode: false, customBackend: undefined});
            expect(result).toEqual({
                basename: '',
                backend: 'http://my-node:8765',
                clusterName: 'my_cluster',
            });
        });
    });
    describe('single-cluster version with custom backend', () => {
        test('should parse correclty parse pathname', () => {
            windowSpy.mockImplementation(() => {
                return {
                    location: {
                        href: 'http://localhost:3000/cluster',
                        pathname: '/cluster',
                    },
                } as Window & typeof globalThis;
            });
            const result = getUrlData({
                singleClusterMode: true,
                customBackend: 'http://my-node:8765',
            });
            expect(result).toEqual({
                basename: '',
                backend: 'http://my-node:8765',
            });
        });
    });
    describe('single-cluster embedded version', () => {
        test('should parse pathname with folder', () => {
            windowSpy.mockImplementation(() => {
                return {
                    location: {
                        href: 'http://my-node:8765/monitoring/cluster',
                        pathname: '/monitoring/cluster',
                    },
                } as Window & typeof globalThis;
            });
            const result = getUrlData({singleClusterMode: true, customBackend: undefined});
            expect(result).toEqual({
                basename: '/monitoring',
                backend: '',
            });
        });
        test('should parse pathname with folder and some prefix', () => {
            windowSpy.mockImplementation(() => {
                return {
                    location: {
                        href: 'http://my-node:8765/node/12/monitoring/cluster',
                        pathname: '/node/12/monitoring/cluster',
                    },
                } as Window & typeof globalThis;
            });
            const result = getUrlData({singleClusterMode: true, customBackend: undefined});
            expect(result).toEqual({
                basename: '/node/12/monitoring',
                backend: '/node/12',
            });
        });
    });
});
