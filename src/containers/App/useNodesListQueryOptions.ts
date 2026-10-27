import {StringParam, useQueryParams} from 'use-query-params';

import {authenticationApi} from '../../store/reducers/authentication/authentication';
import type {NodesListQueryArgs} from '../../store/reducers/nodesList';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {STORAGE_TYPES} from '../../store/reducers/storage/constants';
import type {StorageType} from '../../store/reducers/storage/types';
import {storageTypeSchema} from '../../store/reducers/storage/types';
import {useAutoRefreshInterval} from '../../utils/hooks/useAutoRefreshInterval';
import {useNodesListQueryArgs} from '../../utils/hooks/useNodesListQueryArgs';
import {useSetting} from '../../utils/hooks/useSetting';

export function useNodesListQueryOptions(): {
    args: NodesListQueryArgs;
    options: {pollingInterval: number};
} {
    // Load the remote setting here; cache readers only use its value from the store.
    useSetting(SETTING_KEYS.TENANT_INITIAL_PAGE);
    const args = useNodesListQueryArgs();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [query] = useQueryParams({
        type: StringParam,
    });
    const [savedStorageType] = useSetting<StorageType>(
        SETTING_KEYS.STORAGE_TYPE,
        STORAGE_TYPES.groups,
    );
    const {currentData: permissions} = authenticationApi.endpoints.whoami.useQueryState({
        database: args.database,
    });
    const storageType = storageTypeSchema.parse(query.type ?? savedStorageType);
    const isGroups =
        storageType === STORAGE_TYPES.groups || permissions?.IsMonitoringAllowed === false;
    const shouldPoll = isGroups && args.include_storage;

    return {
        args,
        options: {pollingInterval: shouldPoll ? autoRefreshInterval : 0},
    };
}
