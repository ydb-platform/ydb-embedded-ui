import {QUERY_EDITOR_CURRENT_QUERY_KEY} from '../../../../utils/constants';
import queryReducer, {
    changeUserInput,
    setActiveQueryTab,
    setQueryPlanView,
    setQueryResult,
    setResultTab,
} from '../query';
import type {QueryResult, QueryState} from '../types';

const result: QueryResult = {
    executionId: 'run-1',
    queryId: 'query',
    isLoading: false,
    type: 'explain',
};
function initialState(): QueryState {
    const tab = {title: '', input: '', createdAt: 0, updatedAt: 0, isDirty: false, result};
    return {
        activeTabId: 'one',
        tabsOrder: ['one', 'two'],
        tabsById: {one: {...tab, id: 'one'}, two: {...tab, id: 'two'}},
        newTabCounter: 2,
    };
}

test('preserves the representation across result and editor tabs without leaking into another editor tab', () => {
    let state = queryReducer(
        initialState(),
        setQueryPlanView({tabId: 'one', executionId: 'run-1', view: 'graph'}),
    );
    state = queryReducer(state, setResultTab({queryType: 'explain', tabId: 'ast'}));
    state = queryReducer(state, setActiveQueryTab({tabId: 'two'}));
    expect(state.tabsById.two.queryPlanView).toBeUndefined();
    state = queryReducer(state, setActiveQueryTab({tabId: 'one'}));
    expect(state.tabsById.one.queryPlanView).toBe('graph');
    state = queryReducer(
        state,
        setQueryResult({tabId: 'one', executionId: 'run-1', result: {...result, isLoading: true}}),
    );
    expect(state.tabsById.one.queryPlanView).toBe('graph');
    state = queryReducer(
        state,
        setQueryResult({tabId: 'one', result: {...result, executionId: 'run-2'}}),
    );
    expect(state.tabsById.one.queryPlanView).toBe('table');
    state = queryReducer(
        state,
        setQueryPlanView({tabId: 'one', executionId: 'run-1', view: 'json'}),
    );
    expect(state.tabsById.one.queryPlanView).toBe('table');
});

test('does not persist the representation with editor contents', () => {
    let state = queryReducer(
        initialState(),
        setQueryPlanView({tabId: 'one', executionId: 'run-1', view: 'json'}),
    );
    state = queryReducer(state, changeUserInput({input: 'SELECT 2;'}));
    expect(state.tabsById.one.queryPlanView).toBe('json');
    expect(sessionStorage.getItem(QUERY_EDITOR_CURRENT_QUERY_KEY)).not.toContain('queryPlanView');
});
