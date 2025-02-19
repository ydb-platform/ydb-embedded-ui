import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';

import {useTypedSelector} from './useTypedSelector';

export function useIsUserAllowedToMakeChanges() {
    return useTypedSelector(selectIsUserAllowedToMakeChanges);
}
