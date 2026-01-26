import {QUERY_EDITOR_CURRENT_QUERY_KEY, QUERY_EDITOR_DIRTY_KEY} from '../../../../utils/constants';

describe('Query tabs sessionStorage migration', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.resetModules();
    });

    test('migrates legacy current query string into a single tab without losing text', async () => {
        sessionStorage.setItem(QUERY_EDITOR_CURRENT_QUERY_KEY, JSON.stringify('SELECT 1;'));

        const {default: queryReducer} = await import('../query');

        const state = queryReducer(undefined, {type: 'query/init'});

        expect(state.tabsOrder).toHaveLength(1);
        expect(state.activeTabId).toBe(state.tabsOrder[0]);
        expect(state.tabsById[state.activeTabId]?.input).toBe('SELECT 1;');

        const migratedRaw = sessionStorage.getItem(QUERY_EDITOR_CURRENT_QUERY_KEY);
        expect(migratedRaw).toBeTruthy();
        const migrated = migratedRaw ? JSON.parse(migratedRaw) : null;
        expect(typeof migrated).toBe('object');
        expect(migrated.activeTabId).toBe(state.activeTabId);
    });

    test('migrates legacy dirty boolean into per-tab dirty map', async () => {
        sessionStorage.setItem(QUERY_EDITOR_CURRENT_QUERY_KEY, JSON.stringify('SELECT 2;'));
        sessionStorage.setItem(QUERY_EDITOR_DIRTY_KEY, JSON.stringify(true));

        const {default: queryReducer} = await import('../query');

        const state = queryReducer(undefined, {type: 'query/init'});

        expect(state.tabsOrder).toHaveLength(1);
        expect(state.tabsById[state.activeTabId]?.isDirty).toBe(true);

        const migratedDirtyRaw = sessionStorage.getItem(QUERY_EDITOR_DIRTY_KEY);
        expect(migratedDirtyRaw).toBeTruthy();
        const migratedDirty = migratedDirtyRaw ? JSON.parse(migratedDirtyRaw) : null;
        expect(migratedDirty).toEqual({[state.activeTabId]: true});
    });
});
