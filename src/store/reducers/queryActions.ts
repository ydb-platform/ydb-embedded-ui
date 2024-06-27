import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

type QueryActions = 'save' | 'idle';

interface QueryActionsState {
    queryName: string | null;
    queryAction: QueryActions;
}

const initialState: QueryActionsState = {
    queryName: null,
    queryAction: 'idle',
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
    },
    selectors: {
        selectQueryName: (state) => state.queryName,
        selectQueryAction: (state) => state.queryAction,
    },
});

export default slice.reducer;
export const {setQueryNameToEdit, clearQueryNameToEdit, setQueryAction} = slice.actions;
export const {selectQueryName, selectQueryAction} = slice.selectors;
