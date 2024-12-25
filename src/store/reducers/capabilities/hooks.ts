import {StringParam, useQueryParam} from 'use-query-params';

import type {Capability} from '../../../types/api/capabilities';
import {useTypedSelector} from '../../../utils/hooks';

import {capabilitiesApi, selectCapabilityVersion, selectDatabaseCapabilities} from './capabilities';

function useDatabaseFromQuery() {
    const [database] = useQueryParam('database', StringParam);

    // Remove null from database type
    return database ?? undefined;
}

export function useCapabilitiesQuery() {
    const database = useDatabaseFromQuery();

    return capabilitiesApi.useGetClusterCapabilitiesQuery({database});
}

export function useCapabilitiesLoaded() {
    const database = useDatabaseFromQuery();

    const {data, error} = useTypedSelector((state) => selectDatabaseCapabilities(state, database));

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
