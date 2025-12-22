import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

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
