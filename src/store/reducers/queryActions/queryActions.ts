import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

import type {SavedQuery} from '../../../types/store/query';
import {SAVED_QUERIES_KEY} from '../../../utils/constants';
import type {AppDispatch, GetState} from '../../defaultStore';
import {getSettingValue, setSettingValue} from '../settings/settings';

import type {QueryActions, QueryActionsState} from './types';

const initialState: QueryActionsState = {
    queryName: null,
    queryAction: 'idle',
    savedQueriesFilter: '',
};

export const slice = createSlice({
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
        const savedQueries = (getSettingValue(state, SAVED_QUERIES_KEY) as SavedQuery[]) ?? [];
        const newSavedQueries = savedQueries.filter(
            (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
        );
        dispatch(setSettingValue(SAVED_QUERIES_KEY, newSavedQueries));
    };
}

export function saveQuery(queryName: string | null) {
    return function saveQueryThunk(dispatch: AppDispatch, getState: GetState) {
        const state = getState();
        const savedQueries = (getSettingValue(state, SAVED_QUERIES_KEY) as SavedQuery[]) ?? [];
        const queryBody = state.executeQuery.input;
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

        dispatch(setSettingValue(SAVED_QUERIES_KEY, nextSavedQueries));
    };
}
