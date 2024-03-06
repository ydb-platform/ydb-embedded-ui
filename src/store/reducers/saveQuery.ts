import type {Reducer} from '@reduxjs/toolkit';

const SET_QUERY_NAME_TO_EDIT = 'SET_QUERY_NAME_TO_EDIT';
const CLEAR_QUERY_NAME_TO_EDIT = 'CLEAR_QUERY_NAME_TO_EDIT';

type IAction = ReturnType<typeof setQueryNameToEdit> | ReturnType<typeof clearQueryNameToEdit>;
type ISaveQueryState = string | null;

const initialState = null;

const saveQuery: Reducer<ISaveQueryState, IAction> = function (state = initialState, action) {
    switch (action.type) {
        case SET_QUERY_NAME_TO_EDIT:
            return action.data;
        case CLEAR_QUERY_NAME_TO_EDIT:
            return null;

        default:
            return state;
    }
};

export function setQueryNameToEdit(name: string) {
    return {
        type: SET_QUERY_NAME_TO_EDIT,
        data: name,
    } as const;
}
export function clearQueryNameToEdit() {
    return {
        type: CLEAR_QUERY_NAME_TO_EDIT,
    } as const;
}

export default saveQuery;
