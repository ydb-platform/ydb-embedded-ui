import {createBrowserHistory} from 'history';

import {
    canonicalizeDatabaseQueryString,
    installDatabaseQueryCanonicalization,
} from '../queryParams';

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
        const numericParams = new Set(['selectedOffset', 'startTimestamp', 'activeOffset']);
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
            .flatMap((param) => {
                if (param === 'selectedRow') {
                    return [
                        `${param}=${encodeURIComponent(JSON.stringify({queryHash: 'stale'}))}`,
                        `${param}%5B999%5D=${encodeURIComponent(
                            JSON.stringify({queryHash: 'fresh'}),
                        )}`,
                    ];
                }
                if (numericParams.has(param)) {
                    return [`${param}=1`, `${param}%5B999%5D=2`];
                }
                return [`${param}=stale`, `${param}%5B999%5D=fresh`];
            })
            .join('&');

        const result = new URLSearchParams(canonicalizeDatabaseQueryString(`?${search}`));

        scalarParams.forEach((param) => {
            if (param === 'selectedRow') {
                expect(JSON.parse(decodeURIComponent(result.get(param) ?? ''))).toEqual({
                    queryHash: 'fresh',
                });
            } else if (numericParams.has(param)) {
                expect(result.getAll(param)).toEqual(['2']);
            } else {
                expect(result.getAll(param)).toEqual(['fresh']);
            }
        });
    });

    test('preserves unknown repeated and indexed parameters', () => {
        expect(
            canonicalizeDatabaseQueryString(
                '?tag=one&tag=two&external%5B0%5D=first&external%5B99%5D=last',
            ),
        ).toBe('?tag=one&tag=two&external%5B0%5D=first&external%5B99%5D=last');
    });

    test('keeps the last valid selectedRow value', () => {
        const validSelectedRow = encodeURIComponent(
            JSON.stringify({rank: '1', queryHash: 'valid'}),
        );
        const searchParams = new URLSearchParams();
        searchParams.append('selectedRow', validSelectedRow);
        searchParams.append('selectedRow', 'not-json');

        const result = new URLSearchParams(
            canonicalizeDatabaseQueryString(`?${searchParams.toString()}`),
        );

        expect(result.getAll('selectedRow')).toEqual([validSelectedRow]);
    });

    test('drops selectedRow when it has no valid value', () => {
        expect(canonicalizeDatabaseQueryString('?selectedRow=not-json')).toBe('');
    });

    test.each(['selectedOffset', 'startTimestamp', 'activeOffset'])(
        'keeps the last valid numeric %s value',
        (param) => {
            expect(canonicalizeDatabaseQueryString(`?${param}=42&${param}%5B99%5D=oops`)).toBe(
                `?${param}=42`,
            );
        },
    );

    test('drops numeric params when they have no valid value', () => {
        expect(
            canonicalizeDatabaseQueryString(
                '?selectedOffset=oops&startTimestamp%5B0%5D=Infinity&activeOffset=',
            ),
        ).toBe('');
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

describe('installDatabaseQueryCanonicalization', () => {
    test('keeps the active history and every listener on the canonical database location', () => {
        window.history.replaceState(null, '', '/monitoring/cluster');
        const history = createBrowserHistory({basename: '/monitoring'});
        installDatabaseQueryCanonicalization(history);
        const receivedSearches: string[] = [];
        const firstUnlisten = history.listen((location) => {
            receivedSearches.push(location.search);
        });
        const secondUnlisten = history.listen((location) => {
            receivedSearches.push(location.search);
        });

        history.push({
            pathname: '/database',
            search: '?database%5B21%5D=old&database=%2Fprod',
            hash: '#details',
            state: {preserved: true},
        });

        expect(receivedSearches).toEqual(['?database=%2Fprod', '?database=%2Fprod']);
        expect(history.location).toMatchObject({
            pathname: '/database',
            search: '?database=%2Fprod',
            hash: '#details',
            state: {preserved: true},
        });
        expect(window.location.search).toBe('?database=%2Fprod');
        expect(window.location.pathname).toBe('/monitoring/database');
        expect(window.location.hash).toBe('#details');
        expect(window.history.state.state).toEqual({preserved: true});

        firstUnlisten();
        secondUnlisten();
    });

    test('leaves another route unchanged', () => {
        window.history.replaceState(null, '', '/cluster');
        const history = createBrowserHistory();
        installDatabaseQueryCanonicalization(history);
        const listener = jest.fn();
        const unlisten = history.listen(listener);

        history.push('/cluster?database=old&database=new');

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: '/cluster',
                search: '?database=old&database=new',
            }),
            'PUSH',
        );
        expect(history.location.search).toBe('?database=old&database=new');
        expect(window.location.search).toBe('?database=old&database=new');

        unlisten();
    });
});
