import type {Reducer} from '@reduxjs/toolkit';

import {createApiRequest, createRequestActionTypes} from '../../utils';

import type {AuthenticationAction, AuthenticationState} from './types';

export const SET_UNAUTHENTICATED = createRequestActionTypes(
    'authentication',
    'SET_UNAUTHENTICATED',
);
export const SET_AUTHENTICATED = createRequestActionTypes('authentication', 'SET_AUTHENTICATED');
export const FETCH_USER = createRequestActionTypes('authentication', 'FETCH_USER');

const initialState = {
    isAuthenticated: true,
    user: '',
    error: undefined,
};

const authentication: Reducer<AuthenticationState, AuthenticationAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case SET_UNAUTHENTICATED.SUCCESS: {
            return {...state, isAuthenticated: false, user: '', error: undefined};
        }
        case SET_AUTHENTICATED.SUCCESS: {
            return {...state, isAuthenticated: true, error: undefined};
        }
        case SET_AUTHENTICATED.FAILURE: {
            return {...state, error: action.error};
        }
        case FETCH_USER.SUCCESS: {
            const {user, isUserAllowedToMakeChanges} = action.data;

            return {
                ...state,
                user,
                isUserAllowedToMakeChanges,
            };
        }

        default:
            return {...state};
    }
};

export const authenticate = (user: string, password: string) => {
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
            const {UserSID, AuthType, IsMonitoringAllowed} = data;
            return {
                user: AuthType === 'Login' ? UserSID : undefined,
                // If ydb version supports this feature,
                // There should be explicit flag in whoami response
                // Otherwise every user is allowed to make changes
                // Anyway there will be guards on backend
                isUserAllowedToMakeChanges: IsMonitoringAllowed !== false,
            };
        },
    });
};

export default authentication;
