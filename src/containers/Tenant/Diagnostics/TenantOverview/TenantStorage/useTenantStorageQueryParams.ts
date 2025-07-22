import {StringParam, useQueryParams} from 'use-query-params';

import {TENANT_STORAGE_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantStorageTab} from '../../../../../store/reducers/tenant/types';

export function useTenantStorageQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        storageTab: StringParam,
    });

    // Parse and validate storageTab with fallback to tables
    const storageTab: TenantStorageTab = (() => {
        if (!queryParams.storageTab) {
            return TENANT_STORAGE_TABS_IDS.tables;
        }
        const validTabs = Object.values(TENANT_STORAGE_TABS_IDS) as string[];
        return validTabs.includes(queryParams.storageTab)
            ? (queryParams.storageTab as TenantStorageTab)
            : TENANT_STORAGE_TABS_IDS.tables;
    })();

    const handleStorageTabChange = (value: TenantStorageTab) => {
        setQueryParams({storageTab: value}, 'replaceIn');
    };

    return {
        storageTab,
        handleStorageTabChange,
    };
}
