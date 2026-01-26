import {
    getActionAndSyntaxFromQueryMode,
    isQueryTabsDirtyPersistedState,
    isQueryTabsPersistedState,
} from '../utils';

describe('getActionAndSyntaxFromQueryMode', () => {
    test('Correctly prepares execute action', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('execute', 'script');
        expect(action).toBe('execute-script');
        expect(syntax).toBe('yql_v1');
    });
    test('Correctly prepares execute action with pg syntax', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('execute', 'pg');
        expect(action).toBe('execute-query');
        expect(syntax).toBe('pg');
    });
    test('Correctly prepares explain action', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('explain', 'script');
        expect(action).toBe('explain-script');
        expect(syntax).toBe('yql_v1');
    });
    test('Correctly prepares explain action with pg syntax', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('explain', 'pg');
        expect(action).toBe('explain-query');
        expect(syntax).toBe('pg');
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
