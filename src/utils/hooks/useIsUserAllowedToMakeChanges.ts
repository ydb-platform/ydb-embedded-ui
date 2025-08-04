import {
    selectIsOnlyDatabaseUser,
    selectIsUserAllowedToMakeChanges,
} from '../../store/reducers/authentication/authentication';

import {useTypedSelector} from './useTypedSelector';

export function useIsUserAllowedToMakeChanges() {
    return useTypedSelector(selectIsUserAllowedToMakeChanges);
}
export function useIsOnlyDatabaseUser() {
    return useTypedSelector(selectIsOnlyDatabaseUser);
}
