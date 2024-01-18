import {prepareHost, getBackendFromNodeHost, getBackendFromRawNodeData} from '../prepareBackend';

describe('prepareHost', () => {
    it('should add vm prefix to cloud din nodes', () => {
        const cloudDinNodeInitialHost =
            'vm-cc8mco0j0snqehgh7r2a-ru-central1-c-nlmw-aniq.cc8mco0j0snqehgh7r2a.ydb.mdb.cloud-preprod.net';
        const cloudDinNodeResultHost =
            'u-vm-cc8mco0j0snqehgh7r2a-ru-central1-c-nlmw-aniq.cc8mco0j0snqehgh7r2a.ydb.mdb.cloud-preprod.net';

        const commonNodeHost = 'sas09-ct5-1.cloud.net';

        expect(prepareHost(cloudDinNodeInitialHost)).toBe(cloudDinNodeResultHost);
        expect(prepareHost(commonNodeHost)).toBe(commonNodeHost);
    });
});
describe('getBackendFromNodeHost', () => {
    it('should prepare correct backend value from node host', () => {
        const balancer = 'https://viewer.ydb.ru:443/vla-dev02.ydb.net:8765';
        const nodeHost = 'ydb-vla-dev02-001.search.net:31012';
        const result = 'https://viewer.ydb.ru:443/ydb-vla-dev02-001.search.net:31012';

        expect(getBackendFromNodeHost(nodeHost, balancer)).toBe(result);
    });
});
describe('getBackendFromRawNodeData', () => {
    it('should prepare correct backend value from raw node data', () => {
        const balancer = 'https://viewer.ydb.ru:443/vla-dev02.ydb.net:8765';
        const node = {
            Host: 'ydb-dev02-000.search.net',
            Endpoints: [
                {
                    Name: 'http-mon',
                    Address: ':8765',
                },
                {
                    Name: 'ic',
                    Address: ':19001',
                },
                {
                    Name: 'grpc',
                    Address: ':2135',
                },
            ],
        };
        const result = 'https://viewer.ydb.ru:443/ydb-dev02-000.search.net:8765/';

        expect(getBackendFromRawNodeData(node, balancer)).toBe(result);
    });
});
