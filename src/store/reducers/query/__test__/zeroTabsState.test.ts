import {QUERY_EDITOR_CURRENT_QUERY_KEY, QUERY_EDITOR_DIRTY_KEY} from '../../../../utils/constants';

describe('Query zero-tabs state', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.resetModules();
    });

    test('creates a default tab when there is no persisted state', async () => {
        const {default: queryReducer} = await import('../query');

        const state = queryReducer(undefined, {type: 'query/init'});

        expect(state.tabsOrder).toHaveLength(1);
        expect(state.activeTabId).toBe(state.tabsOrder[0]);
        expect(state.newTabCounter).toBe(1);
    });

    test('restores a persisted zero-tabs state', async () => {
        sessionStorage.setItem(
            QUERY_EDITOR_CURRENT_QUERY_KEY,
            JSON.stringify({
                activeTabId: undefined,
                tabsOrder: [],
                tabsById: {},
                newTabCounter: 0,
            }),
        );
        sessionStorage.setItem(QUERY_EDITOR_DIRTY_KEY, JSON.stringify({}));

        const {default: queryReducer} = await import('../query');

        const state = queryReducer(undefined, {type: 'query/init'});

        expect(state.activeTabId).toBeUndefined();
        expect(state.tabsOrder).toEqual([]);
        expect(state.tabsById).toEqual({});
        expect(state.newTabCounter).toBe(0);
    });

    test('closing the last tab switches reducer state to zero tabs', async () => {
        const {closeQueryTab, default: queryReducer} = await import('../query');

        const initialState = queryReducer(undefined, {type: 'query/init'});
        const lastTabId = initialState.tabsOrder[0];

        const state = queryReducer(initialState, closeQueryTab({tabId: lastTabId}));

        expect(state.activeTabId).toBeUndefined();
        expect(state.tabsOrder).toEqual([]);
        expect(state.tabsById).toEqual({});
        expect(state.newTabCounter).toBe(0);

        const persistedStateRaw = sessionStorage.getItem(QUERY_EDITOR_CURRENT_QUERY_KEY);
        const persistedState = persistedStateRaw ? JSON.parse(persistedStateRaw) : null;
        expect('activeTabId' in persistedState).toBe(false);
        expect(persistedState).toEqual({
            tabsOrder: [],
            tabsById: {},
            newTabCounter: 0,
        });
    });
});
