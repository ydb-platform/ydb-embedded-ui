import type {ETenantType} from '../../types/api/tenant';

import {useIsUserAllowedToMakeChanges} from './useIsUserAllowedToMakeChanges';

export function useDatabaseHealthcheckAvailable(databaseType?: ETenantType) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    return isUserAllowedToMakeChanges && databaseType !== 'Serverless';
}
