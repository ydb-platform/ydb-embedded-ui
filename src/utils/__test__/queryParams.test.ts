import {canonicalizeDatabaseQueryString} from '../queryParams';

describe('canonicalizeDatabaseQueryString', () => {
    test('keeps only the last repeated database scalar value', () => {
        expect(canonicalizeDatabaseQueryString('?database=stale&database=%2Flocal')).toBe(
            '?database=%2Flocal',
        );
    });

    test.each([
        '?database%5B%5D=stale&database%5B99%5D=%2Flocal',
        '?database=stale&database%5B21%5D=%2Flocal',
        '?database%5Bnested%5D%5B0%5D=stale&database%5Bnested%5D%5B1%5D=%2Flocal',
    ])('canonicalizes bracket aliases in %s', (search) => {
        expect(canonicalizeDatabaseQueryString(search)).toBe('?database=%2Flocal');
    });

    test('removes volatile aliases without matching similar unknown keys', () => {
        expect(
            canonicalizeDatabaseQueryString(
                '?utm_referrer=direct&utm_referrer%5B0%5D=nested&utm_referrerSource=keep',
            ),
        ).toBe('?utm_referrerSource=keep');
    });

    // The list intentionally duplicates the source set: adding or removing a known
    // single-value parameter must be an explicit, review-visible decision.
    test('canonicalizes every known database scalar parameter', () => {
        const scalarParams = [
            'backend',
            'clusterName',
            'database',
            'databasePage',
            'tenantPage',
            'schema',
            'name',
            'sort',
            'heatmap',
            'currentMetric',
            'queryTab',
            'diagnosticsTab',
            'summaryTab',
            'metricsTab',
            'shardsMode',
            'shardsDateFrom',
            'shardsDateTo',
            'topQueriesDateFrom',
            'topQueriesDateTo',
            'selectedConsumer',
            'showHealthcheck',
            'view',
            'issuesFilter',
            'showGrantAccess',
            'aclSubject',
            'queryMode',
            'timeFrame',
            'selectedRow',
            'selectedPartition',
            'selectedOffset',
            'startTimestamp',
            'topicDataFilter',
            'activeOffset',
            'withProblems',
            'topSort',
            'runningSort',
            'showPreview',
            // Monitoring dashboard parameters declared by embedding applications
            'monitoringTab',
            'from',
            'to',
            'interval',
        ];
        const search = scalarParams
            .flatMap((param) => [`${param}=stale`, `${param}%5B999%5D=fresh`])
            .join('&');

        const result = new URLSearchParams(canonicalizeDatabaseQueryString(`?${search}`));

        scalarParams.forEach((param) => {
            expect(result.getAll(param)).toEqual(['fresh']);
        });
    });

    test('preserves unknown repeated and indexed parameters', () => {
        expect(
            canonicalizeDatabaseQueryString(
                '?tag=one&tag=two&external%5B0%5D=first&external%5B99%5D=last',
            ),
        ).toBe('?tag=one&tag=two&external%5B0%5D=first&external%5B99%5D=last');
    });

    test('is idempotent and preserves an empty winning scalar value', () => {
        const first = canonicalizeDatabaseQueryString(
            '?database=%2Flocal&database%5B999%5D=&tag=one&tag=two',
        );

        expect(first).toBe('?database=&tag=one&tag=two');
        expect(canonicalizeDatabaseQueryString(first)).toBe(first);
    });

    test('keeps the question mark prefix only when the result is not empty', () => {
        expect(canonicalizeDatabaseQueryString('?utm_referrer=volatile')).toBe('');
        expect(canonicalizeDatabaseQueryString('utm_referrer=volatile')).toBe('');
        expect(canonicalizeDatabaseQueryString('database=%2Flocal')).toBe('database=%2Flocal');
        expect(canonicalizeDatabaseQueryString('')).toBe('');
    });
});
