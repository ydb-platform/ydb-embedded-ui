import queryReducer, {applyExternalQueryToActiveTab} from '../query';
import type {QueryState} from '../types';

describe('external query actions', () => {
    test('applies pending snippet to the active single-tab editor state', () => {
        const initialState: QueryState = {
            activeTabId: 'tab-1',
            tabsOrder: ['tab-1'],
            tabsById: {
                'tab-1': {
                    id: 'tab-1',
                    title: 'Dirty query',
                    input: 'SELECT 1;',
                    savedInput: 'SELECT 0;',
                    isDirty: true,
                    isTouched: true,
                    createdAt: 1,
                    updatedAt: 1,
                    lastExecutedQueryText: 'SELECT 1;',
                    result: {
                        type: 'execute',
                        queryId: 'query-1',
                        isLoading: false,
                    },
                },
            },
            newTabCounter: 1,
        };

        const state = queryReducer(
            initialState,
            applyExternalQueryToActiveTab({
                title: 'Select query',
                input: '',
                pendingSnippet: 'SELECT *\nFROM `log_writer_test`\nLIMIT 10;',
            }),
        );

        expect(state.activeTabId).toBe('tab-1');
        expect(state.tabsOrder).toEqual(['tab-1']);
        expect(Object.keys(state.tabsById)).toEqual(['tab-1']);
        expect(state.tabsById['tab-1']).toMatchObject({
            title: 'Select query',
            input: '',
            savedInput: '',
            isDirty: false,
            isTouched: undefined,
            pendingSnippet: 'SELECT *\nFROM `log_writer_test`\nLIMIT 10;',
            result: undefined,
            lastExecutedQueryText: undefined,
        });
    });

    test('creates a new single-tab editor state when there is no active tab', () => {
        const initialState: QueryState = {
            activeTabId: undefined,
            tabsOrder: [],
            tabsById: {},
            newTabCounter: 0,
        };

        const state = queryReducer(
            initialState,
            applyExternalQueryToActiveTab({
                title: 'Select query',
                input: '',
                pendingSnippet: 'SELECT *\nFROM `log_writer_test`\nLIMIT 10;',
            }),
        );

        expect(state.tabsOrder).toHaveLength(1);
        expect(state.activeTabId).toBe(state.tabsOrder[0]);

        const createdTabId = state.tabsOrder[0];
        expect(state.tabsById[createdTabId]).toMatchObject({
            title: 'Select query',
            input: '',
            savedInput: '',
            isDirty: false,
            pendingSnippet: 'SELECT *\nFROM `log_writer_test`\nLIMIT 10;',
        });
        expect(state.tabsById[createdTabId]?.isTouched).toBeUndefined();
        expect(state.tabsById[createdTabId]?.result).toBeUndefined();
        expect(state.tabsById[createdTabId]?.lastExecutedQueryText).toBeUndefined();
    });
});
