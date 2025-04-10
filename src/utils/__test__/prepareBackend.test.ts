import {getBackendFromBalancerAndNodeId, prepareHost} from '../prepareBackend';

describe('prepareHost', () => {
    test('should add u- prefix to cloud din nodes', () => {
        const cloudDinNodeInitialHost =
            'vm-cc8mco0j0snqehgh7r2a-ru-central1-c-nlmw-aniq.cc8mco0j0snqehgh7r2a.ydb.mdb.cloud-preprod.net';
        const cloudDinNodeResultHost =
            'u-vm-cc8mco0j0snqehgh7r2a-ru-central1-c-nlmw-aniq.cc8mco0j0snqehgh7r2a.ydb.mdb.cloud-preprod.net';

        const commonNodeHost = 'sas09-ct5-1.cloud.net';

        expect(prepareHost(cloudDinNodeInitialHost)).toBe(cloudDinNodeResultHost);
        expect(prepareHost(commonNodeHost)).toBe(commonNodeHost);
    });
});
describe('getBackendFromBalancerAndNodeId', () => {
    test('should prepare correct backend from balancer and node id', () => {
        const balancer = 'https://viewer.ydb.ru:443/dev02.ydb.net:8765';
        const nodeId = '50016';
        const result = 'https://viewer.ydb.ru:443/dev02.ydb.net:8765/node/50016';

        expect(getBackendFromBalancerAndNodeId(nodeId, balancer)).toBe(result);
    });
});
