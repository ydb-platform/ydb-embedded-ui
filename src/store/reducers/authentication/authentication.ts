import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TUserToken} from '../../../types/api/whoami';
import {isAxiosResponse} from '../../../utils/response';
import type {RootState} from '../../defaultStore';
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
            queryFn: async ({database, useMeta}: {database?: string; useMeta?: boolean}) => {
                try {
                    let data: TUserToken;
                    if (useMeta && window.api.meta) {
                        data = await window.api.meta.metaWhoami();
                    } else {
                        data = await window.api.viewer.whoami({database});
                    }
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            async onQueryStarted(args, {dispatch, getState, queryFulfilled, requestId}) {
                const error = await queryFulfilled.then(
                    () => undefined,
                    (rejection: {error: unknown}) => rejection.error,
                );
                if (
                    isAxiosResponse(error) &&
                    error.status === 401 &&
                    !error.data?.authUrl &&
                    isCurrentWhoamiRequest(args, requestId, getState())
                ) {
                    dispatch(setIsAuthenticated(false));
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
                    // Data cached for the previous user must not be shown to the new one
                    dispatch(api.util.resetApiState());
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
                    dispatch(api.util.resetApiState());
                    dispatch(setIsAuthenticated(false));
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            // Drop the cached whoami so consumers (e.g. the persistent account menu)
            // stop showing the previous user's identity after logout.
            invalidatesTags: (_, error) => (error ? [] : ['UserData']),
        }),
    }),
    overrideExisting: 'throw',
});

/**
 * A late 401 may only log the user out if it answers the request the UI currently relies on:
 * the cache entry was not reset or refetched since (e.g. after a cluster switch or login),
 * and the user has not navigated to another database meanwhile.
 */
function isCurrentWhoamiRequest(
    args: {database?: string; useMeta?: boolean},
    requestId: string,
    state: unknown,
) {
    const entry = authenticationApi.endpoints.whoami.select(args)(state as RootState);
    if (entry.requestId !== requestId) {
        return false;
    }
    if (args.useMeta || !args.database) {
        return true;
    }
    const selectedDatabase = new URLSearchParams(window.location.search).get('database');
    return !selectedDatabase || selectedDatabase === args.database;
}
