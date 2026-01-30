import React from 'react';

import {isLocalStorageFlagEnabled} from '../../../utils';
import {TENANT_NAVIGATION_V2_FLAG} from '../../../utils/constants';

export function useNavigationV2Enabled() {
    return isLocalStorageFlagEnabled(TENANT_NAVIGATION_V2_FLAG);
}
