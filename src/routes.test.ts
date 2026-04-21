jest.mock('./store', () => ({
    backend: undefined,
    basename: '/monitoring',
    clusterName: undefined,
    environment: undefined,
    webVersion: false,
}));

jest.mock('./uiFactory/uiFactory', () => ({
    uiFactory: {clustersDomain: undefined},
}));

jest.mock('./utils/hooks/useDatabaseFromQuery', () => ({
    useDatabaseFromQuery: jest.fn(),
}));

import type {Location} from 'history';

import {getClustersPath, getPDiskPagePath, getTenantPath, parseQuery} from './routes';

const PRODUCTION_REPRO_URL =
    'https://ydb.yandex.cloud/tenant?currentMetric=RowUpdates&queryTab=newQuery&diagnosticsTab=nodes&summaryTab=overview&metricsTab=memory&selectedConsumer=bounce_history&clusterName=global&database=etn2qat3kai19q37va1l&tenantPage=query&schema=%2Fglobal%2Fyc.postbox.cloud%2Fetn2qat3kai19q37va1l%2Fdeks&utm_referrer=https%3A%2F%2Fydb.yandex.cloud%2Ftenant%3FcurrentMetric%3DRowUpdates%26queryTab%3DnewQuery%26diagnosticsTab%3Dschema%26summaryTab%3Doverview%26metricsTab%3Dmemory%26selectedConsumer%3Dbounce_history%26clusterName%3Dglobal%26database%3Detn2qat3kai19q37va1l%26tenantPage%3Dquery%26schema%3D%252Fglobal%252Fyc.postbox.cloud%252Fetn2qat3kai19q37va1l%252Faddress_mgmt_addresses%26utm_referrer%3Dhttps%253A%252F%252Fydb.yandex.cloud%252Ftenant%253FcurrentMetric%253DRowUpdates%2526queryTab%253DnewQuery%2526diagnosticsTab%253Doverview%2526summaryTab%253Doverview%2526metricsTab%253Dmemory%2526selectedConsumer%253Dbounce_history%2526clusterName%253Dglobal%2526database%253Detn2qat3kai19q37va1l%2526tenantPage%253Dquery%2526schema%253D%25252Fglobal%25252Fyc.postbox.cloud%25252Fetn2qat3kai19q37va1l%2526utm_referrer%253Dhttps%2525253A%2525252F%2525252Fsso.yandex-team.ru%2525252F%2526monitoringTab%253Ddiagnostics%2526from%253D1771092117420%2526to%253D1771178517420%2526interval%253D1d%26monitoringTab%3Ddiagnostics%26from%3D1771092117420%26to%3D1771178517420%26interval%3D1d&monitoringTab=diagnostics&from=1771092117420&to=1771178517420&interval=1d';

function getSearchParams(path: string) {
    return new URLSearchParams(path.split('?')[1] ?? '');
}

describe('routes', () => {
    describe('getPDiskPagePath', () => {
        test('should create pDisk path without basename by default', () => {
            expect(getPDiskPagePath(1001, 4)).toBe('/pDisk?nodeId=4&pDiskId=1001');
        });

        test('should prepend basename when requested for href-based links', () => {
            expect(getPDiskPagePath(1001, 4, undefined, {withBasename: true})).toBe(
                '/monitoring/pDisk?nodeId=4&pDiskId=1001',
            );
        });
    });

    describe('getTenantPath', () => {
        test('should not expose nested utm_referrer params as top-level params', () => {
            const location = new URL(PRODUCTION_REPRO_URL);
            const query = parseQuery({search: location.search} as Location);
            const path = getTenantPath({...query, diagnosticsTab: 'schema'});
            const searchParams = getSearchParams(path);

            expect(path).not.toContain('utm_referrer');
            expect(searchParams.getAll('clusterName')).toEqual(['global']);
            expect(searchParams.getAll('database')).toEqual(['etn2qat3kai19q37va1l']);
            expect(searchParams.getAll('tenantPage')).toEqual(['query']);
            expect(searchParams.getAll('monitoringTab')).toEqual(['diagnostics']);
            expect(searchParams.get('diagnosticsTab')).toBe('schema');
        });

        test('should encode URL-like query values instead of splitting them into params', () => {
            const path = getTenantPath({
                backend: 'https://proxy.example.test/ydb?x=1&y=2',
                clusterName: 'global',
                database: 'database',
            });
            const searchParams = getSearchParams(path);

            expect(path).not.toContain('&y=2');
            expect(searchParams.get('backend')).toBe('https://proxy.example.test/ydb?x=1&y=2');
            expect(searchParams.getAll('clusterName')).toEqual(['global']);
            expect(searchParams.getAll('database')).toEqual(['database']);
        });
    });

    describe('getClustersPath', () => {
        test('should not add trailing question mark when reset params serialize to empty query', () => {
            expect(getClustersPath({backend: '', clusterName: ''})).toBe('/home/clusters');
        });
    });
});
