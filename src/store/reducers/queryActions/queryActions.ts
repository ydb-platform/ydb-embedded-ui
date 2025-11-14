import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

import {settingsManager} from '../../../services/settings';
import type {SavedQuery} from '../../../types/store/query';
import type {AppDispatch, GetState} from '../../defaultStore';
import {SETTING_KEYS} from '../settings/constants';
import {getSettingValue, setSettingValue} from '../settings/settings';

import type {QueryActions, QueryActionsState} from './types';

const initialState: QueryActionsState = {
    queryName: null,
    queryAction: 'idle',
    savedQueriesFilter: '',
};

const slice = createSlice({
    name: 'queryActions',
    initialState,
    reducers: {
        setQueryNameToEdit: (state, action: PayloadAction<string>) => {
            state.queryName = action.payload;
        },
        clearQueryNameToEdit: (state) => {
            state.queryName = null;
        },
        setQueryAction: (state, action: PayloadAction<QueryActions>) => {
            state.queryAction = action.payload;
        },
        setSavedQueriesFilter: (state, action: PayloadAction<string>) => {
            state.savedQueriesFilter = action.payload;
        },
    },
    selectors: {
        selectQueryName: (state) => state.queryName,
        selectQueryAction: (state) => state.queryAction,
        selectSavedQueriesFilter: (state) => state.savedQueriesFilter,
    },
});

export default slice.reducer;
export const {setQueryNameToEdit, clearQueryNameToEdit, setQueryAction, setSavedQueriesFilter} =
    slice.actions;
export const {selectQueryName, selectQueryAction, selectSavedQueriesFilter} = slice.selectors;

export function deleteSavedQuery(queryName: string) {
    return function deleteSavedQueryThunk(dispatch: AppDispatch, getState: GetState) {
        const state = getState();
        const savedQueries =
            (getSettingValue(state, SETTING_KEYS.SAVED_QUERIES) as SavedQuery[]) ?? [];
        const newSavedQueries = savedQueries.filter(
            (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
        );
        dispatch(setSettingValue(SETTING_KEYS.SAVED_QUERIES, newSavedQueries));
        settingsManager.setUserSettingsValue(SETTING_KEYS.SAVED_QUERIES, newSavedQueries);
    };
}

export function saveQuery(queryName: string | null) {
    return function saveQueryThunk(dispatch: AppDispatch, getState: GetState) {
        const state = getState();
        const savedQueries =
            (getSettingValue(state, SETTING_KEYS.SAVED_QUERIES) as SavedQuery[]) ?? [];
        const queryBody = state.query.input;
        if (queryName === null) {
            return;
        }
        const nextSavedQueries = [...savedQueries];

        const query = nextSavedQueries.find(
            (el) => el.name.toLowerCase() === queryName.toLowerCase(),
        );

        if (query) {
            query.body = queryBody;
        } else {
            nextSavedQueries.push({name: queryName, body: queryBody});
        }

        dispatch(setSettingValue(SETTING_KEYS.SAVED_QUERIES, nextSavedQueries));
        settingsManager.setUserSettingsValue(SETTING_KEYS.SAVED_QUERIES, nextSavedQueries);
    };
}
