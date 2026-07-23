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

        test('should canonicalize repeated and indexed single-value params', () => {
            const location = new URL(
                'https://monitoring.example.test/database?clusterName=stale&clusterName=global' +
                    '&database%5B0%5D=stale&database%5B21%5D=db' +
                    '&databasePage=database&databasePage=diagnostics' +
                    '&schema%5B0%5D=%2Fdb%2Fstale&schema%5B1%5D=%2Fdb%2Ftable',
            );
            const path = getTenantPath({...parseQuery({search: location.search} as Location)});
            const params = getSearchParams(path);

            expect(params.getAll('clusterName')).toEqual(['global']);
            expect(params.getAll('database')).toEqual(['db']);
            expect(params.getAll('databasePage')).toEqual(['diagnostics']);
            expect(params.getAll('schema')).toEqual(['/db/table']);
            expect(Array.from(params.keys()).some((key) => key.includes('['))).toBe(false);
        });

        test('should canonicalize known database scalars during link generation', () => {
            const location = new URL(
                'https://monitoring.example.test/database?withProblems=0&withProblems=1' +
                    '&topSort%5B0%5D=old&topSort%5B99%5D=new' +
                    '&runningSort=old&runningSort%5Bnested%5D=new',
            );
            const path = getTenantPath({...parseQuery({search: location.search} as Location)});
            const params = getSearchParams(path);

            expect(params.getAll('withProblems')).toEqual(['1']);
            expect(params.getAll('topSort')).toEqual(['new']);
            expect(params.getAll('runningSort')).toEqual(['new']);
        });

        test('should keep an unknown multi-value param in repeat format', () => {
            const query = parseQuery({search: '?tag=one&tag=two'} as Location);
            const path = getTenantPath(query);
            const params = getSearchParams(path);

            expect(params.getAll('tag')).toEqual(['one', 'two']);
            expect(path).not.toContain('%5B');
        });
    });

    describe('getClustersPath', () => {
        test('should not add trailing question mark when reset params serialize to empty query', () => {
            expect(getClustersPath({backend: '', clusterName: ''})).toBe('/home/clusters');
        });

        test('should not apply database scalar normalization to another route', () => {
            const path = createHref('/cluster', undefined, {database: ['old', 'new']});

            expect(getSearchParams(path).getAll('database')).toEqual(['old', 'new']);
        });
    });
});
