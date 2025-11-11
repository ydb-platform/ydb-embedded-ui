import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TUserToken} from '../../../types/api/whoami';
import {isAxiosResponse} from '../../../utils/response';
import {api} from '../api';

import type {AuthenticationState} from './types';

const initialState: AuthenticationState = {
    isAuthenticated: true,
    user: undefined,
    id: undefined,
};

export const slice = createSlice({
    name: 'authentication',
    initialState,
    reducers: {
        setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
            const isAuthenticated = action.payload;

            state.isAuthenticated = isAuthenticated;

            if (!isAuthenticated) {
                state.user = undefined;
            }
        },
        setUser: (state, action: PayloadAction<TUserToken>) => {
            const {UserSID, UserID, AuthType, IsMonitoringAllowed, IsViewerAllowed} =
                action.payload;

            state.user = AuthType === 'Login' ? UserSID : undefined;
            state.id = UserID;

            // If ydb version supports this feature,
            // There should be explicit flag in whoami response
            // Otherwise every user is allowed to make changes
            // Anyway there will be guards on backend
            state.isUserAllowedToMakeChanges = IsMonitoringAllowed !== false;
            state.isViewerUser = IsViewerAllowed;
        },
    },
    selectors: {
        selectIsUserAllowedToMakeChanges: (state) => state.isUserAllowedToMakeChanges,
        selectIsViewerUser: (state) => state.isViewerUser,
        selectUser: (state) => state.user,
        selectID: (state) => state.id,
    },
});

export default slice.reducer;
export const {setIsAuthenticated, setUser} = slice.actions;
export const {selectIsUserAllowedToMakeChanges, selectIsViewerUser, selectUser, selectID} =
    slice.selectors;

export const authenticationApi = api.injectEndpoints({
    endpoints: (build) => ({
        whoami: build.query({
            queryFn: async (
                {database, useMeta}: {database?: string; useMeta?: boolean},
                {dispatch},
            ) => {
                try {
                    let data: TUserToken;
                    if (useMeta && window.api.meta) {
                        data = await window.api.meta.metaWhoami();
                    } else {
                        data = await window.api.viewer.whoami({database});
                    }
                    dispatch(setUser(data));
                    return {data};
                } catch (error) {
                    if (isAxiosResponse(error) && error.status === 401 && !error.data?.authUrl) {
                        dispatch(setIsAuthenticated(false));
                    }
                    return {error};
                }
            },
            providesTags: ['UserData'],
        }),
        authenticate: build.mutation({
            queryFn: async (
                params: {user: string; password: string; database?: string; useMeta?: boolean},
                {dispatch},
            ) => {
                try {
                    const {useMeta, ...rest} = params;
                    let data;
                    if (useMeta) {
                        data = await window.api.meta?.metaAuthenticate(rest);
                    } else {
                        data = await window.api.auth.authenticate(rest);
                    }
                    dispatch(setIsAuthenticated(true));
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_, error) => (error ? [] : ['UserData']),
        }),
        logout: build.mutation({
            queryFn: async ({useMeta}: {useMeta?: boolean}, {dispatch}) => {
                try {
                    let data;
                    if (useMeta && window.api.meta) {
                        data = await window.api.meta.metaLogout();
                    } else {
                        data = await window.api.auth.logout();
                    }
                    dispatch(setIsAuthenticated(false));
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
