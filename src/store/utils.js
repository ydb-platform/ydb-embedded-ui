import createToast from '../utils/createToast';
import {SET_UNAUTHENTICATED} from './reducers/authentication';

export const nop = (result) => result;

export function createRequestActionTypes(prefix, type) {
    return {
        REQUEST: `${prefix}/${type}_REQUEST`,
        SUCCESS: `${prefix}/${type}_SUCCESS`,
        FAILURE: `${prefix}/${type}_FAILURE`,
    };
}

export function createApiRequest({actions, request, dataHandler = nop}) {
    const doRequest = async function (dispatch, getState) {
        dispatch({
            type: actions.REQUEST,
        });

        try {
            const result = await request;
            const data = dataHandler(result, getState);

            dispatch({
                type: actions.SUCCESS,
                data,
            });

            return data;
        } catch (error) {
            if (error && error.status === 401) {
                dispatch({
                    type: SET_UNAUTHENTICATED.SUCCESS,
                });
            } else if (error && error.status && error.statusText) {
                createToast({
                    name: 'Request failure',
                    title: 'Request failure',
                    type: 'error',
                    content: `${error.status} ${error.statusText}`,
                });
            }
            dispatch({
                type: actions.FAILURE,
                error,
            });
        }
    };

    return doRequest;
}
