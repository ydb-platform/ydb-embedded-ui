import {StringParam, useQueryParams} from 'use-query-params';

import {tenantStorageTabSchema} from '../../../../../store/reducers/tenant/types';
import type {TenantStorageTab} from '../../../../../store/reducers/tenant/types';

export function useTenantStorageQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        storageTab: StringParam,
    });

    const storageTab: TenantStorageTab = tenantStorageTabSchema.parse(queryParams.storageTab);

    const handleStorageTabChange = (value: TenantStorageTab) => {
        setQueryParams({storageTab: value}, 'replaceIn');
    };

    return {
        storageTab,
        handleStorageTabChange,
    };
}
