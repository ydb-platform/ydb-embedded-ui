import {StringParam, useQueryParams} from 'use-query-params';

import {TENANT_NETWORK_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantNetworkTab} from '../../../../../store/reducers/tenant/types';

export function useTenantNetworkQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        networkTab: StringParam,
    });

    // Parse and validate networkTab with fallback to ping
    const networkTab: TenantNetworkTab = (() => {
        if (!queryParams.networkTab) {
            return TENANT_NETWORK_TABS_IDS.ping;
        }
        const validTabs = Object.values(TENANT_NETWORK_TABS_IDS) as string[];
        return validTabs.includes(queryParams.networkTab)
            ? (queryParams.networkTab as TenantNetworkTab)
            : TENANT_NETWORK_TABS_IDS.ping;
    })();

    const handleNetworkTabChange = (value: TenantNetworkTab) => {
        setQueryParams({networkTab: value}, 'replaceIn');
    };

    return {
        networkTab,
        handleNetworkTabChange,
    };
}
