import type {Capability} from '../../../types/api/capabilities';
import {useTypedSelector} from '../../../utils/hooks';

import {selectCapabilityVersion} from './capabilities';

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
