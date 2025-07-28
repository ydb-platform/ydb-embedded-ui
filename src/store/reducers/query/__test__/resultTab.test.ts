import queryReducer, {setResultTab} from '../query';
import type {QueryState} from '../types';

describe('resultTab functionality', () => {
    const initialState: QueryState = {
        input: '',
        history: {
            queries: [],
            currentIndex: -1,
        },
    };

    test('should set result tab for explain query type', () => {
        const action = setResultTab({queryType: 'explain', tabId: 'json'});
        const newState = queryReducer(initialState, action);

        expect(newState.selectedResultTab).toEqual({
            explain: 'json',
        });
    });

    test('should set result tab for execute query type', () => {
        const action = setResultTab({queryType: 'execute', tabId: 'stats'});
        const newState = queryReducer(initialState, action);

        expect(newState.selectedResultTab).toEqual({
            execute: 'stats',
        });
    });

    test('should maintain separate tabs for different query types', () => {
        const state1 = queryReducer(
            initialState,
            setResultTab({queryType: 'explain', tabId: 'json'}),
        );
        const state2 = queryReducer(state1, setResultTab({queryType: 'execute', tabId: 'stats'}));

        expect(state2.selectedResultTab).toEqual({
            explain: 'json',
            execute: 'stats',
        });
    });

    test('should update existing tab preference', () => {
        const state1 = queryReducer(
            initialState,
            setResultTab({queryType: 'explain', tabId: 'json'}),
        );
        const state2 = queryReducer(state1, setResultTab({queryType: 'explain', tabId: 'ast'}));

        expect(state2.selectedResultTab).toEqual({
            explain: 'ast',
        });
    });
});
