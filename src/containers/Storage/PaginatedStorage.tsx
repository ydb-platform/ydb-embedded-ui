import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {useBridgeModeEnabled, useCapabilitiesLoaded} from '../../store/reducers/capabilities/hooks';
import {useTenantBaseInfo} from '../../store/reducers/tenant/tenant';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {PaginatedStorageGroups} from './PaginatedStorageGroups';
import {isBridgeModeEnabledForStorage} from './PaginatedStorageGroupsTable/columns/constants';
import {PaginatedStorageNodes} from './PaginatedStorageNodes';
import type {StorageViewContext} from './types';
import {
    useSaveNodesPDisksGroupBy,
    useSaveNodesVDisksGroupBy,
    useSavePDisksGroupBy,
    useSaveStorageExpertMode,
    useSaveStorageType,
    useSaveVDisksGroupBy,
    useStorageQueryParams,
} from './useStorageQueryParams';
import {getStorageGroupsInitialEntitiesCount, getStorageNodesInitialEntitiesCount} from './utils';

export interface PaginatedStorageProps {
    database?: string;
    bridgeModeEnabled?: boolean;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;

    viewContext?: StorageViewContext;

    scrollContainerRef: React.RefObject<HTMLElement>;

    initialEntitiesCount?: number;
}

export const PaginatedStorage = (props: PaginatedStorageProps) => {
    const {storageType} = useStorageQueryParams();
    useSaveStorageType();
    useSaveStorageExpertMode();
    useSaveVDisksGroupBy();
    useSavePDisksGroupBy();
    useSaveNodesVDisksGroupBy();
    useSaveNodesPDisksGroupBy();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const showNodes = storageType === 'nodes' && isUserAllowedToMakeChanges;
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const clusterBridgeModeEnabled = useBridgeModeEnabled();
    const loadDatabaseMode =
        !showNodes && props.bridgeModeEnabled === undefined && Boolean(props.database);
    const {databaseData, isError} = useTenantBaseInfo(props.database ?? '', undefined, {
        skip: !loadDatabaseMode || !capabilitiesLoaded,
    });
    const bridgeModeEnabled =
        props.bridgeModeEnabled ??
        isBridgeModeEnabledForStorage(
            props.database,
            databaseData?.BridgeMode,
            clusterBridgeModeEnabled,
        );

    // Hide storage node details for users with only viewer rights
    if (showNodes) {
        return (
            <PaginatedStorageNodes
                initialEntitiesCount={getStorageNodesInitialEntitiesCount(props.viewContext)}
                {...props}
            />
        );
    }

    return (
        <LoaderWrapper loading={loadDatabaseMode && databaseData === undefined && !isError}>
            <PaginatedStorageGroups
                initialEntitiesCount={getStorageGroupsInitialEntitiesCount(props.viewContext)}
                {...props}
                bridgeModeEnabled={bridgeModeEnabled}
            />
        </LoaderWrapper>
    );
};
