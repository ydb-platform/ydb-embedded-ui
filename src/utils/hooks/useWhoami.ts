import {authenticationApi} from '../../store/reducers/authentication/authentication';
import type {TUserToken} from '../../types/api/whoami';

import {useDatabaseFromQuery} from './useDatabaseFromQuery';
import {useMetaAuth} from './useMetaAuth';

export type UserPermissions = Pick<
    TUserToken,
    'IsAdministrationAllowed' | 'IsDatabaseAllowed' | 'IsMonitoringAllowed' | 'IsViewerAllowed'
>;

/**
 * Reads the current user (whoami) data for the currently selected database.
 *
 * The whoami query is keyed by {database, useMeta}, so each database has its own
 * cache entry. Deriving permissions from this result (instead of a global slice)
 * guarantees they always match the current database, including on cache hits when
 * switching back to a previously visited database (where the query function does
 * not run again).
 *
 * The args are resolved exactly like GetUser/GetMetaUser so this hook subscribes
 * to the same cache entry instead of creating a divergent subscription.
 */
export function useWhoami() {
    const database = useDatabaseFromQuery();
    // Normalize to `true | undefined` (never `false`) so the cache key matches
    // the args passed by GetUser/GetMetaUser. `{useMeta: false}` and
    // `{useMeta: undefined}` are distinct RTK Query cache keys, which would
    // create a separate whoami subscription with potentially different data.
    const useMeta = useMetaAuth() || undefined;

    return authenticationApi.useWhoamiQuery({database, useMeta});
}

export function useUserPermissions(): UserPermissions | undefined {
    const {currentData} = useWhoami();

    if (!currentData) {
        return undefined;
    }

    const {IsDatabaseAllowed, IsViewerAllowed, IsMonitoringAllowed, IsAdministrationAllowed} =
        currentData;

    return {
        IsDatabaseAllowed,
        IsViewerAllowed,
        IsMonitoringAllowed,
        IsAdministrationAllowed,
    };
}

export function useIsUserAllowedToMakeChanges() {
    const {currentData} = useWhoami();

    // If ydb version supports this feature,
    // there should be an explicit flag in the whoami response.
    // Otherwise every user is allowed to make changes.
    // Anyway there will be guards on the backend.
    return currentData ? currentData.IsMonitoringAllowed !== false : undefined;
}

export function useIsViewerUser() {
    const {currentData} = useWhoami();

    return currentData?.IsViewerAllowed;
}

export function useUser() {
    const {currentData} = useWhoami();

    return currentData?.AuthType === 'Login' ? currentData.UserSID : undefined;
}

export function useMetaUser() {
    const {currentData} = useWhoami();

    return currentData?.UserID;
}
