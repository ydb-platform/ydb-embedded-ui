import type {Location} from 'history';

jest.mock('../reducers/heatmap', () => ({
    initialState: {
        sort: false,
        heatmap: false,
        currentMetric: undefined,
    },
}));

jest.mock('../reducers/tenant/tenant', () => ({
    initialState: {
        metricsTab: 'memory',
    },
}));

import {restoreUnknownParams} from '../state-url-mapping';

const MAPPED_SEARCH =
    '?currentMetric=RowUpdates&queryTab=newQuery&diagnosticsTab=schema&summaryTab=overview&metricsTab=memory&selectedConsumer=bounce_history';

const PRODUCTION_CORRUPTED_QUERY_PAGE_SEARCH =
    '?currentMetric=RowUpdates&queryTab=newQuery&diagnosticsTab=schema&summaryTab=overview&metricsTab=memory&selectedConsumer=bounce_history&clusterName%5B0%5D=global&clusterName%5B1%5D=global&database%5B0%5D=etn2qat3kai19q37va1l&database%5B1%5D=etn2qat3kai19q37va1l&tenantPage%5B0%5D=query&tenantPage%5B1%5D=query&tenantPage%5B2%5D=query&schema%5B0%5D=%2Fglobal%2Fyc.postbox.cloud%2Fetn2qat3kai19q37va1l%2Fdeks&schema%5B1%5D=%2Fglobal%2Fyc.postbox.cloud%2Fetn2qat3kai19q37va1l%2Faddress_mgmt_addresses&utm_referrer%5B0%5D=https%3A%2F%2Fydb.yandex.cloud%2Ftenant%3FcurrentMetric%3DRowUpdates&utm_referrer%5B1%5D=https%3A%2F%2Fydb.yandex.cloud%2Ftenant%3FcurrentMetric%3DRowUpdates%26queryTab%3DnewQuery%26diagnosticsTab%3Doverview%26summaryTab%3Doverview%26metricsTab%3Dmemory%26selectedConsumer%3Dbounce_history%26clusterName%3Dglobal%26database%3Detn2qat3kai19q37va1l%26tenantPage%3Dquery%26schema%3D%252Fglobal%252Fyc.postbox.cloud%252Fetn2qat3kai19q37va1l%26utm_referrer%3Dhttps%25253A%25252F%25252Fsso.yandex-team.ru%25252F%26monitoringTab%3Ddiagnostics%26from%3D1771092117420%26to%3D1771178517420%26interval%3D1d&monitoringTab%5B0%5D=diagnostics&monitoringTab%5B1%5D=diagnostics&from%5B0%5D=1771092117420&from%5B1%5D=1771092117420&to%5B0%5D=1771178517420&to%5B1%5D=1771178517420&interval%5B0%5D=1d&interval%5B1%5D=1d&tenantPage=query';

const PRODUCTION_CORRUPTED_DIAGNOSTICS_SEARCH =
    '?currentMetric=RowUpdates&queryTab=newQuery&diagnosticsTab=schema&summaryTab=overview&metricsTab=memory&selectedConsumer=bounce_history&clusterName%5B0%5D=global&clusterName%5B1%5D=global&database%5B0%5D=etn2qat3kai19q37va1l&database%5B1%5D=etn2qat3kai19q37va1l&tenantPage%5B0%5D=diagnostics&tenantPage%5B1%5D=query&tenantPage%5B2%5D=diagnostics&tenantPage%5B3%5D=diagnostics&schema%5B0%5D=%2Fglobal%2Fyc.postbox.cloud%2Fetn2qat3kai19q37va1l&schema%5B1%5D=%2Fglobal%2Fyc.postbox.cloud%2Fetn2qat3kai19q37va1l%2Faddress_mgmt_addresses&utm_referrer%5B0%5D=https%3A%2F%2Fydb.yandex.cloud%2Ftenant%3FcurrentMetric%3DRowUpdates&utm_referrer%5B1%5D=https%3A%2F%2Fydb.yandex.cloud%2Ftenant%3FcurrentMetric%3DRowUpdates%26queryTab%3DnewQuery%26diagnosticsTab%3Doverview%26summaryTab%3Doverview%26metricsTab%3Dmemory%26selectedConsumer%3Dbounce_history%26clusterName%3Dglobal%26database%3Detn2qat3kai19q37va1l%26tenantPage%3Dquery%26schema%3D%252Fglobal%252Fyc.postbox.cloud%252Fetn2qat3kai19q37va1l%26utm_referrer%3Dhttps%25253A%25252F%25252Fsso.yandex-team.ru%25252F%26monitoringTab%3Ddiagnostics%26from%3D1771092117420%26to%3D1771178517420%26interval%3D1d&monitoringTab%5B0%5D=diagnostics&monitoringTab%5B1%5D=diagnostics&from%5B0%5D=1771092117420&from%5B1%5D=1771092117420&to%5B0%5D=1771178517420&to%5B1%5D=1771178517420&interval%5B0%5D=1d&interval%5B1%5D=1d&tenantPage=diagnostics';

function createLocation(search: string): Location {
    return {
        pathname: '/tenant',
        search,
        hash: '',
        state: undefined,
    };
}

function getSearchParams(search: string) {
    return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

function expectNoBracketKeys(search: string) {
    const params = getSearchParams(search);

    Array.from(params.keys()).forEach((key) => {
        expect(key).not.toMatch(/\[\d+\]$/);
    });
}

describe('state-url-mapping', () => {
    describe('restoreUnknownParams', () => {
        test('should not convert repeated scalar params into indexed bracket params', () => {
            const result = restoreUnknownParams(
                createLocation('?currentMetric=RowUpdates'),
                createLocation(
                    '?tenantPage=query&tenantPage=diagnostics&database=db&database=db&clusterName=global&clusterName=global&currentMetric=Old',
                ),
            );
            const params = getSearchParams(result.search);

            expectNoBracketKeys(result.search);
            expect(params.getAll('tenantPage')).toEqual(['diagnostics']);
            expect(params.getAll('database')).toEqual(['db']);
            expect(params.getAll('clusterName')).toEqual(['global']);
            expect(params.get('currentMetric')).toBe('RowUpdates');
        });

        test('should normalize existing bracket-corrupted URLs', () => {
            const result = restoreUnknownParams(
                createLocation('?currentMetric=RowUpdates&diagnosticsTab=schema'),
                createLocation(
                    '?currentMetric=Old&clusterName%5B0%5D=global&clusterName%5B1%5D=global&database%5B0%5D=db&database%5B1%5D=db&tenantPage%5B0%5D=diagnostics&tenantPage%5B1%5D=query&tenantPage=query&schema%5B0%5D=%2Fdb%2Ftable1&schema%5B1%5D=%2Fdb%2Ftable2',
                ),
            );
            const params = getSearchParams(result.search);

            expectNoBracketKeys(result.search);
            expect(params.getAll('clusterName')).toEqual(['global']);
            expect(params.getAll('database')).toEqual(['db']);
            expect(params.getAll('tenantPage')).toEqual(['query']);
            expect(params.getAll('schema')).toEqual(['/db/table2']);
        });

        test('should normalize high-index bracket scalar params parsed as objects', () => {
            const result = restoreUnknownParams(
                createLocation('?currentMetric=RowUpdates'),
                createLocation(
                    '?currentMetric=Old&clusterName%5B0%5D=stale&clusterName%5B21%5D=global&database%5B21%5D=db&tenantPage%5B0%5D=query&tenantPage%5B21%5D=diagnostics&schema%5B21%5D=%2Fdb%2Ftable',
                ),
            );
            const params = getSearchParams(result.search);

            expectNoBracketKeys(result.search);
            expect(params.getAll('clusterName')).toEqual(['global']);
            expect(params.getAll('database')).toEqual(['db']);
            expect(params.getAll('tenantPage')).toEqual(['diagnostics']);
            expect(params.getAll('schema')).toEqual(['/db/table']);
        });

        test('should normalize mixed scalar arrays that contain indexed objects', () => {
            const result = restoreUnknownParams(
                createLocation('?currentMetric=RowUpdates'),
                createLocation(
                    '?currentMetric=Old&tenantPage=query&tenantPage%5B21%5D=diagnostics&clusterName=global&clusterName%5B21%5D=global',
                ),
            );
            const params = getSearchParams(result.search);

            expectNoBracketKeys(result.search);
            expect(params.getAll('tenantPage')).toEqual(['diagnostics']);
            expect(params.getAll('clusterName')).toEqual(['global']);
        });

        test('should not add a dangling delimiter when all previous params are mapped', () => {
            const result = restoreUnknownParams(
                createLocation('?currentMetric=RowUpdates'),
                createLocation('?currentMetric=Old'),
            );

            expect(result.search).toBe('?currentMetric=RowUpdates');
        });

        test.each([
            ['query page', PRODUCTION_CORRUPTED_QUERY_PAGE_SEARCH, 'query'],
            ['diagnostics page', PRODUCTION_CORRUPTED_DIAGNOSTICS_SEARCH, 'diagnostics'],
        ])(
            'should not grow cardinality for the production corrupted %s URL',
            (_, prevSearch, page) => {
                const result = restoreUnknownParams(
                    createLocation(MAPPED_SEARCH),
                    createLocation(prevSearch),
                );
                const params = getSearchParams(result.search);

                expectNoBracketKeys(result.search);
                expect(params.getAll('clusterName')).toEqual(['global']);
                expect(params.getAll('database')).toEqual(['etn2qat3kai19q37va1l']);
                expect(params.getAll('tenantPage')).toEqual([page]);
                expect(params.getAll('monitoringTab')).toEqual(['diagnostics']);
                expect(params.getAll('from')).toEqual(['1771092117420']);
                expect(params.getAll('to')).toEqual(['1771178517420']);
                expect(params.getAll('interval')).toEqual(['1d']);
            },
        );
    });
});
