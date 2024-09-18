import type {Capability} from '../../../types/api/capabilities';
import {useTypedSelector} from '../../../utils/hooks';

import {capabilitiesApi, selectCapabilityVersion} from './capabilities';

export function useCapabilitiesLoaded() {
    const {data, error} = capabilitiesApi.useGetClusterCapabilitiesQuery(undefined);

    return Boolean(data || error);
}

const useGetFeatureVersion = (feature: Capability) => {
    return useTypedSelector((state) => selectCapabilityVersion(state, feature) || 0);
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

export const useFeatureFlagsAvailable = () => {
    return useGetFeatureVersion('/viewer/feature_flags') > 1;
};
