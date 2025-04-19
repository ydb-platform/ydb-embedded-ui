import type {Capability, MetaCapability, SecuritySetting} from '../../../types/api/capabilities';
import {useTypedSelector} from '../../../utils/hooks';
import {useDatabaseFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';

import {
    capabilitiesApi,
    selectCapabilityVersion,
    selectDatabaseCapabilities,
    selectMetaCapabilities,
    selectMetaCapabilityVersion,
    selectSecuritySetting,
} from './capabilities';

export function useCapabilitiesQuery() {
    const database = useDatabaseFromQuery();

    capabilitiesApi.useGetClusterCapabilitiesQuery({database});
}

export function useCapabilitiesLoaded() {
    const database = useDatabaseFromQuery();

    const {data, error} = useTypedSelector((state) => selectDatabaseCapabilities(state, database));

    // If capabilities endpoint is not available, request finishes with error
    // That means no new features are available
    return Boolean(data || error);
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

export const useFeatureFlagsAvailable = () => {
    return useGetFeatureVersion('/viewer/feature_flags') > 1;
};
export const useClusterDashboardAvailable = () => {
    return useGetFeatureVersion('/viewer/cluster') > 4;
};

export const useStreamingAvailable = () => {
    return useGetFeatureVersion('/viewer/query') >= 8;
};

export const useTopicDataAvailable = () => {
    return useGetFeatureVersion('/viewer/topic_data') >= 1;
};

const useGetSecuritySetting = (feature: SecuritySetting) => {
    const database = useDatabaseFromQuery();

    return useTypedSelector((state) => selectSecuritySetting(state, feature, database));
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

export const useDeleteDatabaseFeatureAvailable = () => {
    return useGetMetaFeatureVersion('/meta/delete_database') >= 1;
};
