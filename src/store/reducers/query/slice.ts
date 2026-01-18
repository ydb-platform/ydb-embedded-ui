import {createSelector, createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import {v4 as uuidv4} from 'uuid';

import {loadFromSessionStorage, saveToSessionStorage} from '../../../utils';
import {QUERY_EDITOR_CURRENT_QUERY_KEY, QUERY_EDITOR_DIRTY_KEY} from '../../../utils/constants';

import {
    addStreamingChunks as addStreamingChunksReducer,
    setStreamQueryResponse as setStreamQueryResponseReducer,
    setStreamSession as setStreamSessionReducer,
} from './streaming/reducers';
import type {QueryResult, QueryState, QueryTabState} from './types';
import {isQueryTabsDirtyPersistedState, isQueryTabsPersistedState} from './utils';
import type {
    QueryTabPersistedState,
    QueryTabsDirtyPersistedState,
    QueryTabsPersistedState,
} from './utils';

function persistTabsStateToSessionStorage(state: QueryState) {
    const persistedTabsById: Record<string, QueryTabPersistedState> = {};
    for (const [tabId, tab] of Object.entries(state.tabsById)) {
        persistedTabsById[tabId] = {
            id: tabId,
            title: tab.title,
            input: tab.input,
            createdAt: tab.createdAt,
            updatedAt: tab.updatedAt,
        };
    }

    const persistedState: QueryTabsPersistedState = {
        activeTabId: state.activeTabId,
        tabsOrder: state.tabsOrder,
        tabsById: persistedTabsById,
    };

    saveToSessionStorage(QUERY_EDITOR_CURRENT_QUERY_KEY, persistedState);
}

function persistDirtyStateToSessionStorage(state: QueryState) {
    const persistedDirty: QueryTabsDirtyPersistedState = {};
    for (const [tabId, tab] of Object.entries(state.tabsById)) {
        persistedDirty[tabId] = tab.isDirty;
    }
    saveToSessionStorage(QUERY_EDITOR_DIRTY_KEY, persistedDirty);
}

function createDefaultTabState({
    tabId,
    title = '',
    input = '',
}: {
    tabId: string;
    title?: string;
    input?: string;
}): QueryTabState {
    const now = Date.now();
    return {
        id: tabId,
        title,
        input,
        isDirty: false,
        createdAt: now,
        updatedAt: now,
    };
}

function createTabStateFromPersisted({
    tabId,
    persistedTab,
    isDirty,
}: {
    tabId: string;
    persistedTab: QueryTabPersistedState;
    isDirty: boolean;
}): QueryTabState {
    return {
        id: tabId,
        title: persistedTab.title,
        input: persistedTab.input,
        isDirty,
        createdAt: persistedTab.createdAt,
        updatedAt: persistedTab.updatedAt,
    };
}

function createInitialTabsState(): Pick<QueryState, 'activeTabId' | 'tabsOrder' | 'tabsById'> {
    const rawTabs = loadFromSessionStorage(QUERY_EDITOR_CURRENT_QUERY_KEY);
    const persistedTabs = isQueryTabsPersistedState(rawTabs) ? rawTabs : undefined;

    const rawDirty = loadFromSessionStorage(QUERY_EDITOR_DIRTY_KEY);
    const persistedDirty = isQueryTabsDirtyPersistedState(rawDirty) ? rawDirty : undefined;

    if (!persistedTabs || Object.keys(persistedTabs.tabsById).length === 0) {
        const tabId = uuidv4();
        return {
            activeTabId: tabId,
            tabsOrder: [tabId],
            tabsById: {
                [tabId]: createDefaultTabState({tabId}),
            },
        };
    }

    const normalizedTabsOrder = persistedTabs.tabsOrder.filter((tabId) => {
        return Boolean(persistedTabs.tabsById[tabId]);
    });
    const tabsOrder =
        normalizedTabsOrder.length > 0 ? normalizedTabsOrder : Object.keys(persistedTabs.tabsById);

    if (tabsOrder.length === 0) {
        const tabId = uuidv4();
        return {
            activeTabId: tabId,
            tabsOrder: [tabId],
            tabsById: {
                [tabId]: createDefaultTabState({tabId}),
            },
        };
    }

    const tabsById: Record<string, QueryTabState> = {};
    for (const tabId of tabsOrder) {
        const persistedTab = persistedTabs.tabsById[tabId];
        if (!persistedTab) {
            continue;
        }
        tabsById[tabId] = createTabStateFromPersisted({
            tabId,
            persistedTab,
            isDirty: persistedDirty?.[tabId] ?? false,
        });
    }

    const activeTabId = tabsById[persistedTabs.activeTabId]
        ? persistedTabs.activeTabId
        : tabsOrder[0];

    return {
        activeTabId,
        tabsOrder,
        tabsById,
    };
}

function getActiveTab(state: QueryState): QueryTabState | undefined {
    return state.tabsById[state.activeTabId];
}

const initialTabsState = createInitialTabsState();

const initialState: QueryState = {
    ...initialTabsState,

    historyFilter: '',
    historyCurrentQueryId: undefined,
};

const slice = createSlice({
    name: 'query',
    initialState,
    reducers: {
        changeUserInput: (state, action: PayloadAction<{input: string}>) => {
            const tab = getActiveTab(state);
            if (!tab) {
                return;
            }

            tab.input = action.payload.input;
            tab.updatedAt = Date.now();
            persistTabsStateToSessionStorage(state);
        },
        setIsDirty: (state, action: PayloadAction<boolean>) => {
            const tab = getActiveTab(state);
            if (!tab) {
                return;
            }

            tab.isDirty = action.payload;
            persistDirtyStateToSessionStorage(state);
        },
        setQueryResult: (
            state,
            action: PayloadAction<{tabId: string; result: QueryResult | undefined}>,
        ) => {
            const tab = state.tabsById[action.payload.tabId];
            if (!tab) {
                return;
            }

            tab.result = action.payload.result;
        },
        setLastExecutedQueryText: (
            state,
            action: PayloadAction<{tabId: string; queryText: string}>,
        ) => {
            const tab = state.tabsById[action.payload.tabId];
            if (!tab) {
                return;
            }

            tab.lastExecutedQueryText = action.payload.queryText;
        },
        addQueryTab: (
            state,
            action: PayloadAction<{
                tabId: string;
                title: string;
                input?: string;
                makeActive?: boolean;
            }>,
        ) => {
            const {tabId, title, input = '', makeActive = true} = action.payload;

            if (state.tabsById[tabId]) {
                if (makeActive) {
                    state.activeTabId = tabId;
                    persistTabsStateToSessionStorage(state);
                }
                return;
            }

            const now = Date.now();
            state.tabsById[tabId] = {
                id: tabId,
                title,
                input,
                isDirty: false,
                createdAt: now,
                updatedAt: now,
            };
            state.tabsOrder.push(tabId);

            if (makeActive) {
                state.activeTabId = tabId;
            }

            persistTabsStateToSessionStorage(state);
            persistDirtyStateToSessionStorage(state);
        },
        closeQueryTab: (state, action: PayloadAction<{tabId: string}>) => {
            const {tabId} = action.payload;

            if (!state.tabsById[tabId]) {
                return;
            }

            const isLastTab = state.tabsOrder.length <= 1;
            if (isLastTab) {
                const tab = state.tabsById[tabId];
                tab.input = '';
                tab.isDirty = false;
                tab.result = undefined;
                tab.lastExecutedQueryText = undefined;
                tab.updatedAt = Date.now();

                persistTabsStateToSessionStorage(state);
                persistDirtyStateToSessionStorage(state);
                return;
            }

            const index = state.tabsOrder.indexOf(tabId);
            state.tabsOrder = state.tabsOrder.filter((id) => id !== tabId);
            delete state.tabsById[tabId];

            if (state.activeTabId === tabId) {
                const nextTabId =
                    state.tabsOrder[index] ?? state.tabsOrder[index - 1] ?? state.tabsOrder[0];
                state.activeTabId = nextTabId;
            }

            persistTabsStateToSessionStorage(state);
            persistDirtyStateToSessionStorage(state);
        },
        renameQueryTab: (state, action: PayloadAction<{tabId: string; title: string}>) => {
            const {tabId, title} = action.payload;
            const tab = state.tabsById[tabId];
            if (!tab) {
                return;
            }

            tab.title = title;
            tab.updatedAt = Date.now();
            persistTabsStateToSessionStorage(state);
        },
        setActiveQueryTab: (state, action: PayloadAction<{tabId: string}>) => {
            const {tabId} = action.payload;
            if (!state.tabsById[tabId]) {
                return;
            }

            state.activeTabId = tabId;
            persistTabsStateToSessionStorage(state);
        },
        setTenantPath: (state, action: PayloadAction<string>) => {
            state.tenantPath = action.payload;
        },
        setQueryHistoryFilter: (state, action: PayloadAction<string>) => {
            state.historyFilter = action.payload;
        },
        setHistoryCurrentQueryId: (state, action: PayloadAction<string | undefined>) => {
            state.historyCurrentQueryId = action.payload;
        },
        setResultTab: (
            state,
            action: PayloadAction<{queryType: 'execute' | 'explain'; tabId: string}>,
        ) => {
            const {queryType, tabId} = action.payload;
            if (!state.selectedResultTab) {
                state.selectedResultTab = {};
            }
            state.selectedResultTab[queryType] = tabId;
        },
        setStreamSession: setStreamSessionReducer,
        addStreamingChunks: addStreamingChunksReducer,
        setStreamQueryResponse: setStreamQueryResponseReducer,
    },
    selectors: {
        selectActiveTabId: (state) => state.activeTabId,
        selectTabsOrder: (state) => state.tabsOrder,
        selectTabsById: (state) => state.tabsById,
        selectActiveTab: (state) => state.tabsById[state.activeTabId],
        selectQueriesHistoryFilter: (state) => state.historyFilter || '',
        selectHistoryCurrentQueryId: (state) => state.historyCurrentQueryId,
        selectTenantPath: (state) => state.tenantPath,
        selectResult: (state) => state.tabsById[state.activeTabId]?.result,
        selectStartTime: (state) => state.tabsById[state.activeTabId]?.result?.startTime,
        selectEndTime: (state) => state.tabsById[state.activeTabId]?.result?.endTime,
        selectUserInput: (state) => state.tabsById[state.activeTabId]?.input || '',
        selectIsDirty: (state) => state.tabsById[state.activeTabId]?.isDirty || false,
        selectResultTab: (state) => state.selectedResultTab,
        selectLastExecutedQueryText: (state) =>
            state.tabsById[state.activeTabId]?.lastExecutedQueryText,
    },
});

export const selectQueryDuration = createSelector(
    slice.selectors.selectStartTime,
    slice.selectors.selectEndTime,
    (startTime, endTime) => {
        return {
            startTime,
            endTime,
        };
    },
);

export default slice.reducer;

export const {
    changeUserInput,
    setQueryResult,
    setLastExecutedQueryText,
    addQueryTab,
    closeQueryTab,
    renameQueryTab,
    setActiveQueryTab,
    setTenantPath,
    setQueryHistoryFilter,
    setHistoryCurrentQueryId,
    addStreamingChunks,
    setStreamQueryResponse,
    setStreamSession,
    setIsDirty,
    setResultTab,
} = slice.actions;

export const {
    selectActiveTabId,
    selectTabsOrder,
    selectTabsById,
    selectActiveTab,
    selectQueriesHistoryFilter,
    selectHistoryCurrentQueryId,
    selectTenantPath,
    selectResult,
    selectUserInput,
    selectIsDirty,
    selectResultTab,
    selectLastExecutedQueryText,
} = slice.selectors;
