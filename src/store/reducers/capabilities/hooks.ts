import type {Capability, MetaCapability, SecuritySetting} from '../../../types/api/capabilities';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useSetting, useTypedSelector} from '../../../utils/hooks';
import {useDatabaseFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {SETTING_KEYS} from '../settings/constants';

import {
    capabilitiesApi,
    selectBridgeModeEnabled,
    selectCapabilityVersion,
    selectDatabaseCapabilities,
    selectGraphShardExists,
    selectMetaCapabilities,
    selectMetaCapabilityVersion,
    selectSecuritySetting,
} from './capabilities';

export function useCapabilitiesQuery() {
    const database = useDatabaseFromQuery();

    return capabilitiesApi.useGetClusterCapabilitiesQuery({database});
}

export function useCapabilitiesLoaded() {
    const database = useDatabaseFromQuery();

    const {data, error} = useTypedSelector((state) => selectDatabaseCapabilities(state, database));

    // If capabilities endpoint is not available, request finishes with error
    // That means no new features are available
    return Boolean(data || error);
}

export function useAllCapabilitiesLoaded() {
    // It is always true if there is no meta, since request finishes with an error
    const metaCapabilitiesLoaded = useMetaCapabilitiesLoaded();
    const capabilitiesLoaded = useCapabilitiesLoaded();

    return metaCapabilitiesLoaded && capabilitiesLoaded;
}

const useGetFeatureVersion = (feature: Capability) => {
    const database = useDatabaseFromQuery();

    return useTypedSelector((state) => selectCapabilityVersion(state, feature, database) || 0);
};

export const useCreateDirectoryFeatureAvailable = () => {
    return useGetFeatureVersion('/scheme/directory') > 0;
};

export const useDiskPagesAvailable = () => {
    // New PDisk (info, restart) and VDisk (evict) handlers was made at the same time
    // It's enough to check only pdisk handler
    return useGetFeatureVersion('/pdisk/info') > 0;
};

export const useTracingLevelOptionAvailable = () => {
    return useGetFeatureVersion('/viewer/query') > 2;
};

export const useStorageGroupsHandlerAvailable = () => {
    return useGetFeatureVersion('/storage/groups') > 2;
};

export const useBlobIndexStatWithVdiskId = () => {
    return useGetFeatureVersion('/vdisk/blobindexstat') > 1;
};

export const useStorageGroupsHandlerHasGrouping = () => {
    return useGetFeatureVersion('/storage/groups') > 4;
};

export const useViewerNodesHandlerHasGrouping = () => {
    return useGetFeatureVersion('/viewer/nodes') > 6;
};

export const useViewerNodesHandlerHasGroupingBySystemState = () => {
    return useGetFeatureVersion('/viewer/nodes') > 11;
};

export const useViewerNodesHandlerHasNetworkStats = () => {
    return useGetFeatureVersion('/viewer/nodes') > 13;
};

// Before this version handler has very big response size if nodes quantity is more than 100
// Response size could be up to 20-30MB, it loads very long and freezes UI
// It is not very common for databases, but an often case for clusters
export const useNodesHandlerHasWorkingClusterNetworkStats = () => {
    return useGetFeatureVersion('/viewer/nodes') >= 16;
};

export const useViewerPeersHandlerAvailable = () => {
    return useGetFeatureVersion('/viewer/peers') > 0;
};

export const useFeatureFlagsAvailable = () => {
    return useGetFeatureVersion('/viewer/feature_flags') > 1;
};
export const useClusterDashboardAvailable = () => {
    return useGetFeatureVersion('/viewer/cluster') > 4;
};

export const useStreamingAvailable = () => {
    return useGetFeatureVersion('/viewer/query') >= 8;
};
export const useBaseConfigAvailable = () => {
    return useGetFeatureVersion('/viewer/config') >= 1;
};

export const useConfigAvailable = () => {
    const isBaseConfigsAvailable = useBaseConfigAvailable();
    const isFeaturesAvailable = useFeatureFlagsAvailable();
    return isBaseConfigsAvailable || isFeaturesAvailable;
};

export const useEditAccessAvailable = () => {
    return useGetFeatureVersion('/viewer/acl') >= 2 && !uiFactory.hideGrantAccess;
};

export const useTopicDataAvailable = () => {
    return useGetFeatureVersion('/viewer/topic_data') >= 1;
};

const useGetSecuritySetting = (feature: SecuritySetting) => {
    const database = useDatabaseFromQuery();

    return useTypedSelector((state) => selectSecuritySetting(state, feature, database));
};

export const useGraphShardExists = () => {
    const database = useDatabaseFromQuery();

    return useTypedSelector((state) => selectGraphShardExists(state, database));
};

export const useBridgeModeEnabled = () => {
    const database = useDatabaseFromQuery();
    const enabled = useTypedSelector((state) => selectBridgeModeEnabled(state, database));
    return Boolean(enabled);
};

export const useClusterWithoutAuthInUI = () => {
    return useGetSecuritySetting('UseLoginProvider') === false;
};

export const useLoginWithDatabase = () => {
    return useGetSecuritySetting('DomainLoginOnly') === false;
};

export function useMetaCapabilitiesQuery() {
    capabilitiesApi.useGetMetaCapabilitiesQuery({});
}

export function useMetaCapabilitiesLoaded() {
    const {data, error} = useTypedSelector(selectMetaCapabilities);

    // If capabilities endpoint is not available, request finishes with error
    // That means no new features are available
    return Boolean(data || error);
}

const useGetMetaFeatureVersion = (feature: MetaCapability) => {
    return useTypedSelector((state) => selectMetaCapabilityVersion(state, feature) || 0);
};

export const useCreateDatabaseFeatureAvailable = () => {
    return useGetMetaFeatureVersion('/meta/create_database') >= 1;
};

export const useEditDatabaseFeatureAvailable = () => {
    return useGetMetaFeatureVersion('/meta/update_database') >= 1;
};

export const useDeleteDatabaseFeatureAvailable = () => {
    return useGetMetaFeatureVersion('/meta/delete_database') >= 1;
};

export const useAddClusterFeatureAvailable = () => {
    return useGetMetaFeatureVersion('/meta/create_cluster') >= 1;
};
export const useEditClusterFeatureAvailable = () => {
    return useGetMetaFeatureVersion('/meta/update_cluster') >= 1;
};
export const useDeleteClusterFeatureAvailable = () => {
    return useGetMetaFeatureVersion('/meta/delete_cluster') >= 1;
};

export const useClusterEventsAvailable = () => {
    return useGetMetaFeatureVersion('/meta/events') >= 1;
};

export const useDatabasesAvailable = () => {
    return useGetMetaFeatureVersion('/meta/databases') >= 1;
};

export const useMetaLoginAvailable = () => {
    return useGetMetaFeatureVersion('/meta/login') >= 1;
};

export const useMetaWhoAmIAvailable = () => {
    return useGetMetaFeatureVersion('/meta/whoami') >= 1;
};

export const useMetaEnvironmentsAvailable = () => {
    return (
        useGetMetaFeatureVersion('/meta/environments') >= 1 &&
        Boolean(uiFactory.databasesEnvironmentsConfig)
    );
};

export const useBlobStorageCapacityMetricsAvailable = () => {
    const hasStorageGroups = useGetFeatureVersion('/storage/groups') >= 10;
    const hasViewerNodes = useGetFeatureVersion('/viewer/nodes') >= 20;

    return hasStorageGroups && hasViewerNodes;
};

export const useBlobStorageCapacityMetricsEnabled = () => {
    const available = useBlobStorageCapacityMetricsAvailable();
    const [enabled] = useSetting(SETTING_KEYS.ENABLE_BLOB_STORAGE_CAPACITY_METRICS, false);

    return enabled && available;
};
