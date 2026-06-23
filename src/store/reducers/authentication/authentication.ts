import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TUserToken} from '../../../types/api/whoami';
import {isAxiosResponse} from '../../../utils/response';
import {api} from '../api';

import type {AuthenticationState} from './types';

const initialState: AuthenticationState = {
    isAuthenticated: true,
};

export const slice = createSlice({
    name: 'authentication',
    initialState,
    reducers: {
        setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
            state.isAuthenticated = action.payload;
        },
    },
    selectors: {
        selectIsAuthenticated: (state) => state.isAuthenticated,
    },
});

export default slice.reducer;
export const {setIsAuthenticated} = slice.actions;
export const {selectIsAuthenticated} = slice.selectors;

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
