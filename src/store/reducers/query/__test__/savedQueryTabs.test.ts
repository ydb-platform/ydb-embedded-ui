import {QUERY_EDITOR_CURRENT_QUERY_KEY, QUERY_EDITOR_DIRTY_KEY} from '../../../../utils/constants';
import queryReducer, {
    detachSavedQueryTabs,
    renameSavedQueryTabs,
    syncSavedQueryTabsAfterUpdate,
} from '../query';
import type {QueryState} from '../types';

test('renames all tabs bound to a saved query without changing tab state', () => {
    const initialState: QueryState = {
        activeTabId: 'tab-2',
        tabsOrder: ['tab-1', 'tab-2', 'tab-3'],
        tabsById: {
            'tab-1': {
                id: 'tab-1',
                title: 'Weekly report',
                input: 'SELECT 1;',
                savedInput: 'SELECT 0;',
                isDirty: true,
                isTouched: true,
                createdAt: 1,
                updatedAt: 2,
                savedQueryName: ' Weekly report ',
                lastExecutedQueryText: 'SELECT 1;',
                pendingSnippet: 'SELECT 1;\n',
                result: {
                    executionId: 'execution-1',
                    type: 'execute',
                    queryId: 'query-1',
                    isLoading: false,
                },
            },
            'tab-2': {
                id: 'tab-2',
                title: 'weekly REPORT',
                input: 'SELECT 2;',
                savedInput: 'SELECT 2;',
                isDirty: false,
                isTouched: true,
                createdAt: 3,
                updatedAt: 4,
                savedQueryName: ' Weekly report ',
                lastExecutedQueryText: 'SELECT 2;',
                pendingSnippet: 'SELECT 2;\n',
                result: {
                    executionId: 'execution-2',
                    type: 'execute',
                    queryId: 'query-2',
                    isLoading: false,
                },
            },
            'tab-3': {
                id: 'tab-3',
                title: 'Capacity',
                input: 'SELECT 3;',
                savedInput: 'SELECT 3;',
                isDirty: false,
                createdAt: 5,
                updatedAt: 6,
                savedQueryName: 'Capacity',
            },
        },
        newTabCounter: 3,
    };

    const state = queryReducer(
        initialState,
        renameSavedQueryTabs({previousName: ' Weekly report ', nextName: 'Daily report'}),
    );

    expect(state.tabsById['tab-1']).toEqual({
        ...initialState.tabsById['tab-1'],
        title: 'Daily report',
        savedQueryName: 'Daily report',
    });
    expect(state.tabsById['tab-2']).toEqual({
        ...initialState.tabsById['tab-2'],
        title: 'Daily report',
        savedQueryName: 'Daily report',
    });
    expect(state.tabsById['tab-3']).toBe(initialState.tabsById['tab-3']);
    expect(state.tabsOrder).toEqual(initialState.tabsOrder);
    expect(state.activeTabId).toBe(initialState.activeTabId);

    expect(JSON.parse(sessionStorage.getItem(QUERY_EDITOR_CURRENT_QUERY_KEY) ?? '')).toMatchObject({
        tabsById: {
            'tab-1': {
                title: 'Daily report',
                savedQueryName: 'Daily report',
            },
            'tab-2': {
                title: 'Daily report',
                savedQueryName: 'Daily report',
            },
            'tab-3': {
                title: 'Capacity',
                savedQueryName: 'Capacity',
            },
        },
    });
});

test('renames and detaches only tabs bound to the exact legacy duplicate', () => {
    const initialState: QueryState = {
        activeTabId: 'tab-2',
        tabsOrder: ['tab-1', 'tab-2'],
        tabsById: {
            'tab-1': {
                id: 'tab-1',
                title: ' Report ',
                input: 'SELECT 1;',
                savedInput: 'SELECT 1;',
                isDirty: false,
                createdAt: 1,
                updatedAt: 2,
                savedQueryName: ' Report ',
            },
            'tab-2': {
                id: 'tab-2',
                title: 'Report',
                input: 'SELECT 2;',
                savedInput: 'SELECT 2;',
                isDirty: false,
                createdAt: 3,
                updatedAt: 4,
                savedQueryName: 'Report',
            },
        },
        newTabCounter: 2,
    };

    const renamedState = queryReducer(
        initialState,
        renameSavedQueryTabs({previousName: 'Report', nextName: 'Summary'}),
    );

    expect(renamedState.tabsById['tab-1']).toEqual(initialState.tabsById['tab-1']);
    expect(renamedState.tabsById['tab-2']).toMatchObject({
        title: 'Summary',
        savedQueryName: 'Summary',
    });

    const detachedState = queryReducer(
        initialState,
        detachSavedQueryTabs({savedQueryName: 'Report'}),
    );

    expect(detachedState.tabsById['tab-1']).toEqual(initialState.tabsById['tab-1']);
    expect(detachedState.tabsById['tab-2']).toMatchObject({
        savedQueryName: undefined,
        savedInput: undefined,
        isDirty: true,
    });
});

test('syncs the saved body into clean tabs and preserves stale local input', () => {
    const initialState: QueryState = {
        activeTabId: 'source-tab',
        tabsOrder: ['source-tab', 'clean-tab', 'stale-tab', 'other-tab'],
        tabsById: {
            'source-tab': {
                id: 'source-tab',
                title: 'Report draft',
                input: 'SELECT new;',
                savedInput: 'SELECT old;',
                isDirty: true,
                createdAt: 1,
                updatedAt: 2,
                savedQueryName: 'Report',
            },
            'clean-tab': {
                id: 'clean-tab',
                title: 'Report',
                input: 'SELECT old;',
                savedInput: 'SELECT old;',
                isDirty: false,
                createdAt: 3,
                updatedAt: 4,
                savedQueryName: 'Report',
            },
            'stale-tab': {
                id: 'stale-tab',
                title: 'Report',
                input: 'SELECT local;',
                savedInput: 'SELECT local;',
                isDirty: false,
                createdAt: 5,
                updatedAt: 6,
                savedQueryName: 'Report',
            },
            'other-tab': {
                id: 'other-tab',
                title: 'Capacity',
                input: 'SELECT capacity;',
                savedInput: 'SELECT capacity;',
                isDirty: false,
                createdAt: 7,
                updatedAt: 8,
                savedQueryName: 'Capacity',
            },
        },
        newTabCounter: 4,
    };

    const state = queryReducer(
        initialState,
        syncSavedQueryTabsAfterUpdate({
            sourceTabId: 'source-tab',
            previousName: 'Report',
            nextName: 'Summary',
            previousBody: 'SELECT old;',
            nextBody: 'SELECT new;',
        }),
    );

    expect(state.tabsById['source-tab']).toMatchObject({
        title: 'Summary',
        input: 'SELECT new;',
        savedInput: 'SELECT new;',
        savedQueryName: 'Summary',
        isDirty: false,
    });
    expect(state.tabsById['clean-tab']).toMatchObject({
        title: 'Summary',
        input: 'SELECT new;',
        savedInput: 'SELECT new;',
        savedQueryName: 'Summary',
        isDirty: false,
    });
    expect(state.tabsById['stale-tab']).toMatchObject({
        title: 'Summary',
        input: 'SELECT local;',
        savedInput: 'SELECT new;',
        savedQueryName: 'Summary',
        isDirty: true,
    });
    expect(state.tabsById['other-tab']).toEqual(initialState.tabsById['other-tab']);

    expect(JSON.parse(sessionStorage.getItem(QUERY_EDITOR_CURRENT_QUERY_KEY) ?? '')).toMatchObject({
        tabsById: {
            'source-tab': {input: 'SELECT new;', savedInput: 'SELECT new;'},
            'clean-tab': {input: 'SELECT new;', savedInput: 'SELECT new;'},
            'stale-tab': {input: 'SELECT local;', savedInput: 'SELECT new;'},
        },
    });
    expect(JSON.parse(sessionStorage.getItem(QUERY_EDITOR_DIRTY_KEY) ?? '')).toMatchObject({
        'source-tab': false,
        'clean-tab': false,
        'stale-tab': true,
    });
});
