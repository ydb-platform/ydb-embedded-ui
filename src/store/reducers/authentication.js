import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

export const SET_UNAUTHENTICATED = createRequestActionTypes(
    'authentication',
    'SET_UNAUTHENTICATED',
);
export const SET_AUTHENTICATED = createRequestActionTypes('authentication', 'SET_AUTHENTICATED');
export const FETCH_USER = createRequestActionTypes('authentication', 'FETCH_USER');

const initialState = {
    isAuthenticated: true,
    user: '',
    error: '',
};

const authentication = function (state = initialState, action) {
    switch (action.type) {
        case SET_UNAUTHENTICATED.SUCCESS: {
            return {...state, isAuthenticated: false, user: '', error: ''};
        }
        case SET_AUTHENTICATED.SUCCESS: {
            return {...state, isAuthenticated: true, error: ''};
        }
        case SET_AUTHENTICATED.FAILURE: {
            return {...state, error: action.error};
        }
        case FETCH_USER.SUCCESS: {
            return {...state, user: action.data};
        }

        default:
            return {...state};
    }
};

export const setIsNotAuthenticated = () => {
    return (dispatch) => {
        dispatch({
            type: SET_UNAUTHENTICATED.SUCCESS,
        });
    };
};
export const setIsAuthenticated = () => {
    return (dispatch) => {
        dispatch({
            type: SET_AUTHENTICATED.SUCCESS,
        });
    };
};

export const authenticate = (user, password) => {
    return createApiRequest({
        request: window.api.authenticate(user, password),
        actions: SET_AUTHENTICATED,
    });
};

export const logout = () => {
    return createApiRequest({
        request: window.api.logout(),
        actions: SET_UNAUTHENTICATED,
    });
};

export const getUser = () => {
    return createApiRequest({
        request: window.api.whoami(),
        actions: FETCH_USER,
        dataHandler: (data) => {
            const {UserSID, AuthType} = data;
            return AuthType === 'Login' ? UserSID : undefined;
        },
    });
};

export default authentication;
