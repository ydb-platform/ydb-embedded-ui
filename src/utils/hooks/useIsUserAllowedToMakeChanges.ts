import {
    selectIsUserAllowedToMakeChanges,
    selectIsViewerUser,
} from '../../store/reducers/authentication/authentication';

import {useTypedSelector} from './useTypedSelector';

export function useIsUserAllowedToMakeChanges() {
    return useTypedSelector(selectIsUserAllowedToMakeChanges);
}
export function useIsViewerUser() {
    return useTypedSelector(selectIsViewerUser);
}
