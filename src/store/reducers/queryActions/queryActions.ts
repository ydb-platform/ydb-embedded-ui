import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

import type {QueryActions, QueryActionsState} from './types';

const initialState: QueryActionsState = {
    queryAction: 'idle',
    savedQueriesFilter: '',
};

const slice = createSlice({
    name: 'queryActions',
    initialState,
    reducers: {
        setQueryAction: (state, action: PayloadAction<QueryActions>) => {
            state.queryAction = action.payload;
        },
        setSavedQueriesFilter: (state, action: PayloadAction<string>) => {
            state.savedQueriesFilter = action.payload;
        },
    },
    selectors: {
        selectQueryAction: (state) => state.queryAction,
        selectSavedQueriesFilter: (state) => state.savedQueriesFilter,
    },
});

export default slice.reducer;
export const {setQueryAction, setSavedQueriesFilter} = slice.actions;
export const {selectQueryAction, selectSavedQueriesFilter} = slice.selectors;
