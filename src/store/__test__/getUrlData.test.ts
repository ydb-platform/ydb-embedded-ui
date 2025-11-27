import {getUrlData} from '../getUrlData';

describe('getUrlData', () => {
    describe('multi-cluster version', () => {
        test('should parse pathname with folder', () => {
            window.history.pushState(
                {},
                '',
                '/ui/cluster?clusterName=my_cluster&backend=http://my-node:8765',
            );
            const result = getUrlData({singleClusterMode: false, customBackend: undefined});
            expect(result).toEqual({
                basename: '/ui',
                backend: 'http://my-node:8765',
                clusterName: 'my_cluster',
            });
        });
        test('should parse pathname with folder and some prefix', () => {
            window.history.pushState(
                {},
                '',
                '/monitoring/ui/cluster?clusterName=my_cluster&backend=http://my-node:8765',
            );
            const result = getUrlData({singleClusterMode: false, customBackend: undefined});
            expect(result).toEqual({
                basename: '/monitoring/ui',
                backend: 'http://my-node:8765',
                clusterName: 'my_cluster',
            });
        });
        test('should parse pathname without folder', () => {
            window.history.pushState(
                {},
                '',
                '/cluster?clusterName=my_cluster&backend=http://my-node:8765',
            );

            const result = getUrlData({singleClusterMode: false, customBackend: undefined});
            expect(result).toEqual({
                basename: '',
                backend: 'http://my-node:8765',
                clusterName: 'my_cluster',
            });
        });
        test('should extract environment from first segment', () => {
            window.history.pushState(
                {},
                '',
                '/cloud-prod/cluster?clusterName=my_cluster&backend=http://my-node:8765',
            );

            const result = getUrlData({
                singleClusterMode: false,
                customBackend: undefined,
                allowedEnvironments: ['cloud-prod', 'cloud-preprod'],
            });
            expect(result).toEqual({
                basename: '',
                backend: 'http://my-node:8765',
                clusterName: 'my_cluster',
                environment: 'cloud-prod',
            });
        });
        test('should extract environment from first segment with monitoring folder', () => {
            window.history.pushState(
                {},
                '',
                '/cloud-preprod/api/meta3/proxy/cluster/pre-prod_global/monitoring/cluster/tenants',
            );

            const result = getUrlData({
                singleClusterMode: false,
                customBackend: undefined,
                allowedEnvironments: ['cloud-prod', 'cloud-preprod'],
            });
            expect(result).toEqual({
                basename: '/cloud-preprod/api/meta3/proxy/cluster/pre-prod_global/monitoring',
                backend: undefined,
                clusterName: undefined,
                environment: 'cloud-preprod',
            });
        });
        test('should not extract environment if not in allowed list', () => {
            window.history.pushState({}, '', '/cluster/tenants?clusterName=my_cluster');

            const result = getUrlData({
                singleClusterMode: false,
                customBackend: undefined,
                allowedEnvironments: ['cloud-prod', 'cloud-preprod'],
            });
            expect(result).toEqual({
                basename: '',
                backend: undefined,
                clusterName: 'my_cluster',
                environment: undefined,
            });
        });
        test('should not extract environment without allowedEnvironments list', () => {
            window.history.pushState({}, '', '/my-env/cluster?clusterName=my_cluster');

            const result = getUrlData({
                singleClusterMode: false,
                customBackend: undefined,
            });
            expect(result).toEqual({
                basename: '',
                backend: undefined,
                clusterName: 'my_cluster',
                environment: undefined,
            });
        });
    });
    describe('single-cluster version with custom backend', () => {
        test('should parse correclty parse pathname', () => {
            window.history.pushState({}, '', '/cluster');

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
            window.history.pushState({}, '', '/monitoring/cluster');

            const result = getUrlData({singleClusterMode: true, customBackend: undefined});
            expect(result).toEqual({
                basename: '/monitoring',
                backend: '',
            });
        });
        test('should parse pathname with folder and some prefix', () => {
            window.history.pushState({}, '', '/node/12/monitoring/cluster');

            const result = getUrlData({singleClusterMode: true, customBackend: undefined});
            expect(result).toEqual({
                basename: '/node/12/monitoring',
                backend: '/node/12',
            });
        });
    });
});
