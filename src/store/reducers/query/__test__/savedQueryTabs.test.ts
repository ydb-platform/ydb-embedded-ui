import {QUERY_EDITOR_CURRENT_QUERY_KEY} from '../../../../utils/constants';
import queryReducer, {renameSavedQueryTabs} from '../query';
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
                savedQueryName: 'weekly REPORT',
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
