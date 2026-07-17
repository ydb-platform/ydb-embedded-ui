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

import {createHref, getClustersPath, getPDiskPagePath, getTenantPath, parseQuery} from './routes';

const URL_WITH_NESTED_REFERRER =
    'https://monitoring.example.test/database?currentMetric=RowUpdates&queryTab=newQuery&diagnosticsTab=nodes&summaryTab=overview&metricsTab=memory&selectedConsumer=consumer&clusterName=global&database=database&databasePage=query&schema=%2Fglobal%2Fdatabase%2Ftable&utm_referrer=https%3A%2F%2Fmonitoring.example.test%2Fdatabase%3FcurrentMetric%3DRowUpdates%26queryTab%3DnewQuery%26diagnosticsTab%3Dschema%26summaryTab%3Doverview%26metricsTab%3Dmemory%26selectedConsumer%3Dconsumer%26clusterName%3Dglobal%26database%3Ddatabase%26databasePage%3Dquery%26schema%3D%252Fglobal%252Fdatabase%252Fnested_table%26utm_referrer%3Dhttps%253A%252F%252Fsso.example.test%252F%26monitoringTab%3Ddiagnostics%26from%3D1771092117420%26to%3D1771178517420%26interval%3D1d&monitoringTab=diagnostics&from=1771092117420&to=1771178517420&interval=1d';

const URL_WITH_CORRUPTED_DATABASE_PARAMS =
    'https://monitoring.example.test/database?clusterName[0]=old-cluster&clusterName[1]=current-cluster&database[0]=old-db&database[1]=current-db&databasePage[0]=diagnostics&databasePage[1]=query&tenantPage[0]=diagnostics&tenantPage[1]=query&schema[0]=%2Fold-db%2Ftable&schema[1]=%2Fcurrent-db%2Ftable&utm_referrer[0]=about%3Ablank&utm_referrer[1]=https%3A%2F%2Fexample.test&customFilter=one&customFilter=two';

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
        test('should prepend basename when requested for href-based links', () => {
            expect(
                getTenantPath(
                    {database: '/dev02/home/xenoxeno/db1', databasePage: 'query'},
                    {withBasename: true},
                ),
            ).toBe(
                '/monitoring/database?database=%2Fdev02%2Fhome%2Fxenoxeno%2Fdb1&databasePage=query',
            );
        });

        test('should not expose nested utm_referrer params as top-level params', () => {
            const location = new URL(URL_WITH_NESTED_REFERRER);
            const query = parseQuery({search: location.search} as Location);
            const path = getTenantPath({...query, diagnosticsTab: 'schema'});
            const searchParams = getSearchParams(path);

            expect(path).not.toContain('utm_referrer');
            expect(searchParams.getAll('clusterName')).toEqual(['global']);
            expect(searchParams.getAll('database')).toEqual(['database']);
            expect(searchParams.getAll('databasePage')).toEqual(['query']);
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

        test('should canonicalize known scalar database params from a corrupted URL', () => {
            const location = new URL(URL_WITH_CORRUPTED_DATABASE_PARAMS);
            const query = parseQuery({search: location.search} as Location);
            const path = getTenantPath({...query, diagnosticsTab: 'schema'});
            const searchParams = getSearchParams(path);

            expect(searchParams.getAll('clusterName')).toEqual(['current-cluster']);
            expect(searchParams.getAll('database')).toEqual(['current-db']);
            expect(searchParams.getAll('databasePage')).toEqual(['query']);
            expect(searchParams.getAll('tenantPage')).toEqual(['query']);
            expect(searchParams.getAll('schema')).toEqual(['/current-db/table']);
            expect(searchParams.has('utm_referrer')).toBe(false);
            expect(searchParams.getAll('customFilter')).toEqual(['one', 'two']);
            expect([...searchParams.keys()]).not.toEqual(
                expect.arrayContaining([expect.stringMatching(/\[\d+\]$/)]),
            );
        });

        test('should normalize number and boolean arrays without mutating the input query', () => {
            const query = {
                activeOffset: [100, 200],
                showPreview: [false, true],
                customFilter: ['one', 'two'],
            };

            const path = createHref('/database', undefined, query);
            const searchParams = getSearchParams(path);

            expect(searchParams.getAll('activeOffset')).toEqual(['200']);
            expect(searchParams.getAll('showPreview')).toEqual(['true']);
            expect(searchParams.getAll('customFilter')).toEqual(['one', 'two']);
            expect(query).toEqual({
                activeOffset: [100, 200],
                showPreview: [false, true],
                customFilter: ['one', 'two'],
            });
        });
    });

    describe('getClustersPath', () => {
        test('should not add trailing question mark when reset params serialize to empty query', () => {
            expect(getClustersPath({backend: '', clusterName: ''})).toBe('/home/clusters');
        });
    });
});
