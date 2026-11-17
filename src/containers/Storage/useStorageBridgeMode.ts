import {useBridgeModeEnabled, useCapabilitiesLoaded} from '../../store/reducers/capabilities/hooks';
import {useTenantBaseInfo} from '../../store/reducers/tenant/tenant';

import {isBridgeModeEnabledForStorage} from './PaginatedStorageGroupsTable/columns/constants';

export function useStorageBridgeMode(database?: string, {skip = false}: {skip?: boolean} = {}) {
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const clusterBridgeModeEnabled = useBridgeModeEnabled();
    const {databaseData, isError} = useTenantBaseInfo(database ?? '', undefined, {
        skip: skip || !capabilitiesLoaded,
    });

    return {
        bridgeModeEnabled: isBridgeModeEnabledForStorage(
            database,
            databaseData?.BridgeMode,
            clusterBridgeModeEnabled,
        ),
        isLoading:
            !skip &&
            (!capabilitiesLoaded || (Boolean(database) && databaseData === undefined && !isError)),
    };
}
