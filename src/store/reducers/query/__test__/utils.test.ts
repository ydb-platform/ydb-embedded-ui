import {QUERY_ACTIONS, STATISTICS_MODES} from '../../../../utils/query';
import {
    getActionAndSyntaxFromQueryMode,
    getEffectiveQueryDataForAction,
    getEffectiveQuerySettingsForAction,
    getUniqueTabTitle,
    isQueryTabsDirtyPersistedState,
    isQueryTabsPersistedState,
} from '../utils';

describe('getActionAndSyntaxFromQueryMode', () => {
    test('defines frontend-only explain analyze action', () => {
        expect(QUERY_ACTIONS.explainAnalyze).toBe('explain-analyze');
    });

    test('Correctly prepares execute action', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('execute', 'script');
        expect(action).toBe('execute-script');
        expect(syntax).toBe('yql_v1');
    });
    test('Correctly prepares explain action', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('explain', 'script');
        expect(action).toBe('explain-script');
        expect(syntax).toBe('yql_v1');
    });
    test.each([
        ['query', 'execute-query', 'yql_v1'],
        ['script', 'execute-script', 'yql_v1'],
        ['scan', 'execute-scan', 'yql_v1'],
        ['data', 'execute-data', 'yql_v1'],
    ] as const)(
        'maps explain analyze in %s mode to execute-shaped backend action',
        (mode, action, syntax) => {
            const result = getActionAndSyntaxFromQueryMode(QUERY_ACTIONS.explainAnalyze, mode);

            expect(result.action).toBe(action);
            expect(result.syntax).toBe(syntax);
        },
    );
});

describe('getEffectiveQueryDataForAction', () => {
    const data = {
        stats: {DurationUs: '10'},
        resultSets: [
            {
                columns: [{name: 'value', type: 'Int32'}],
                result: [{value: 1}],
            },
        ],
    };

    test('keeps regular execute data unchanged', () => {
        expect(getEffectiveQueryDataForAction(QUERY_ACTIONS.execute, data)).toBe(data);
    });

    test('hides result sets for explain analyze without mutating source data', () => {
        const result = getEffectiveQueryDataForAction(QUERY_ACTIONS.explainAnalyze, data);

        expect(result).toEqual({
            stats: {DurationUs: '10'},
            resultSets: undefined,
        });
        expect(data.resultSets).toHaveLength(1);
    });
});

describe('getEffectiveQuerySettingsForAction', () => {
    test('keeps regular execute settings unchanged', () => {
        const querySettings = {
            queryMode: 'query' as const,
            limitRows: 100,
            statisticsMode: STATISTICS_MODES.profile,
        };

        expect(getEffectiveQuerySettingsForAction(QUERY_ACTIONS.execute, querySettings)).toBe(
            querySettings,
        );
    });

    test('overrides explain analyze request settings without mutating source settings', () => {
        const querySettings = {
            queryMode: 'query' as const,
            limitRows: 100,
            statisticsMode: STATISTICS_MODES.none,
        };

        const result = getEffectiveQuerySettingsForAction(
            QUERY_ACTIONS.explainAnalyze,
            querySettings,
        );

        expect(result).toEqual({
            queryMode: 'query',
            limitRows: 1,
            statisticsMode: STATISTICS_MODES.full,
        });
        expect(querySettings).toEqual({
            queryMode: 'query',
            limitRows: 100,
            statisticsMode: STATISTICS_MODES.none,
        });
    });
});

describe('isQueryTabsPersistedState', () => {
    test('accepts a valid persisted state', () => {
        const value = {
            activeTabId: 'tab-1',
            tabsOrder: ['tab-1'],
            tabsById: {
                'tab-1': {
                    id: 'tab-1',
                    title: 'Title',
                    input: 'SELECT 1;',
                    createdAt: 1700000000000,
                    updatedAt: 1700000000001,
                },
            },
        };

        expect(isQueryTabsPersistedState(value)).toBe(true);
    });

    test('rejects non-objects', () => {
        expect(isQueryTabsPersistedState(null)).toBe(false);
        expect(isQueryTabsPersistedState(undefined)).toBe(false);
        expect(isQueryTabsPersistedState('nope')).toBe(false);
        expect(isQueryTabsPersistedState(123)).toBe(false);
        expect(isQueryTabsPersistedState(() => null)).toBe(false);
        expect(isQueryTabsPersistedState([])).toBe(false);
    });

    test('rejects malformed top-level fields', () => {
        expect(
            isQueryTabsPersistedState({
                activeTabId: 1,
                tabsOrder: ['tab-1'],
                tabsById: {},
            }),
        ).toBe(false);

        expect(
            isQueryTabsPersistedState({
                activeTabId: 'tab-1',
                tabsOrder: ['tab-1', 2],
                tabsById: {},
            }),
        ).toBe(false);

        expect(
            isQueryTabsPersistedState({
                activeTabId: 'tab-1',
                tabsOrder: ['tab-1'],
                tabsById: 1,
            }),
        ).toBe(false);
    });

    test('rejects malformed tab entries in tabsById', () => {
        expect(
            isQueryTabsPersistedState({
                activeTabId: 'tab-1',
                tabsOrder: ['tab-1'],
                tabsById: {
                    'tab-1': null,
                },
            }),
        ).toBe(false);

        expect(
            isQueryTabsPersistedState({
                activeTabId: 'tab-1',
                tabsOrder: ['tab-1'],
                tabsById: {
                    'tab-1': {
                        id: 'tab-1',
                        title: 'Title',
                        input: 'SELECT 1;',
                        createdAt: 1700000000000,
                        updatedAt: '1700000000001',
                    },
                },
            }),
        ).toBe(false);
    });
});

describe('isQueryTabsDirtyPersistedState', () => {
    test('accepts an empty object', () => {
        expect(isQueryTabsDirtyPersistedState({})).toBe(true);
    });

    test('accepts a valid dirty map', () => {
        expect(isQueryTabsDirtyPersistedState({'tab-1': true, 'tab-2': false})).toBe(true);
    });

    test('rejects arrays (malformed session storage data)', () => {
        expect(isQueryTabsDirtyPersistedState([true, false] as unknown)).toBe(false);
    });

    test('rejects non-objects and non-boolean values', () => {
        expect(isQueryTabsDirtyPersistedState(null)).toBe(false);
        expect(isQueryTabsDirtyPersistedState(undefined)).toBe(false);
        expect(isQueryTabsDirtyPersistedState('nope')).toBe(false);
        expect(isQueryTabsDirtyPersistedState(123)).toBe(false);
        expect(isQueryTabsDirtyPersistedState(() => null)).toBe(false);
        expect(isQueryTabsDirtyPersistedState({'tab-1': 'true'})).toBe(false);
    });
});

describe('getUniqueTabTitle', () => {
    test('returns baseTitle when no tabs exist', () => {
        expect(getUniqueTabTitle({}, 'Select query')).toBe('Select query');
    });

    test('returns baseTitle when no conflict', () => {
        const tabsById = {
            'tab-1': {title: 'Other query'},
        };
        expect(getUniqueTabTitle(tabsById, 'Select query')).toBe('Select query');
    });

    test('appends counter when baseTitle is taken', () => {
        const tabsById = {
            'tab-1': {title: 'Select query'},
        };
        expect(getUniqueTabTitle(tabsById, 'Select query')).toBe('Select query 2');
    });

    test('increments counter to find first available', () => {
        const tabsById = {
            'tab-1': {title: 'Select query'},
            'tab-2': {title: 'Select query 2'},
            'tab-3': {title: 'Select query 3'},
        };
        expect(getUniqueTabTitle(tabsById, 'Select query')).toBe('Select query 4');
    });

    test('handles gaps in counter sequence', () => {
        const tabsById = {
            'tab-1': {title: 'Select query'},
            'tab-3': {title: 'Select query 3'},
        };
        expect(getUniqueTabTitle(tabsById, 'Select query')).toBe('Select query 2');
    });
});
