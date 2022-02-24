const SET_QUERY_NAME_TO_EDIT = 'SET_QUERY_NAME_TO_EDIT';
const CLEAR_QUERY_NAME_TO_EDIT = 'CLEAR_QUERY_NAME_TO_EDIT';

const initialState = null;

const saveQuery = function (
    state = initialState,
    action: ReturnType<typeof setQueryNameToEdit> | ReturnType<typeof clearQueryNameToEdit>,
) {
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
