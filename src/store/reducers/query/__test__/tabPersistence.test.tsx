import queryReducer, {setResultTab} from '../query';
import type {QueryState} from '../types';

describe('QueryResultViewer tab persistence integration', () => {
    const initialState: QueryState = {
        activeTabId: 'tab-1',
        tabsOrder: ['tab-1'],
        tabsById: {
            'tab-1': {
                id: 'tab-1',
                title: '',
                input: '',
                isDirty: false,
                createdAt: 0,
                updatedAt: 0,
            },
        },
        newTabCounter: 0,
    };

    test('should save and retrieve tab selection for explain queries', () => {
        // Test that we can set and get the tab preference
        let state = queryReducer(initialState, setResultTab({queryType: 'explain', tabId: 'json'}));

        expect(state.selectedResultTab).toEqual({
            explain: 'json',
        });

        // Test updating the same query type
        state = queryReducer(state, setResultTab({queryType: 'explain', tabId: 'ast'}));

        expect(state.selectedResultTab).toEqual({
            explain: 'ast',
        });
    });

    test('should save and retrieve tab selection for execute queries', () => {
        const state = queryReducer(
            initialState,
            setResultTab({queryType: 'execute', tabId: 'stats'}),
        );

        expect(state.selectedResultTab).toEqual({
            execute: 'stats',
        });
    });

    test('should maintain separate preferences for different query types', () => {
        let state = initialState;

        // Set explain tab
        state = queryReducer(state, setResultTab({queryType: 'explain', tabId: 'json'}));
        expect(state.selectedResultTab).toEqual({
            explain: 'json',
        });

        // Set execute tab - should not override explain
        state = queryReducer(state, setResultTab({queryType: 'execute', tabId: 'stats'}));
        expect(state.selectedResultTab).toEqual({
            explain: 'json',
            execute: 'stats',
        });

        // Update explain tab - should not affect execute
        state = queryReducer(state, setResultTab({queryType: 'explain', tabId: 'ast'}));
        expect(state.selectedResultTab).toEqual({
            explain: 'ast',
            execute: 'stats',
        });
    });

    test('should handle multiple updates to the same query type', () => {
        let state = initialState;

        // Set initial value
        state = queryReducer(state, setResultTab({queryType: 'explain', tabId: 'schema'}));
        expect(state.selectedResultTab?.explain).toBe('schema');

        // Update to different tab
        state = queryReducer(state, setResultTab({queryType: 'explain', tabId: 'json'}));
        expect(state.selectedResultTab?.explain).toBe('json');

        // Update again
        state = queryReducer(state, setResultTab({queryType: 'explain', tabId: 'ast'}));
        expect(state.selectedResultTab?.explain).toBe('ast');
    });
});
