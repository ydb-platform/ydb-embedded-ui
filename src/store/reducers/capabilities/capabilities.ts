import {createSelector} from '@reduxjs/toolkit';

import type {Capability} from '../../../types/api/capabilities';
import type {RootState} from '../../defaultStore';

import {api} from './../api';

export const capabilitiesApi = api.injectEndpoints({
    endpoints: (build) => ({
        getClusterCapabilities: build.query({
            queryFn: async () => {
                try {
                    const data = await window.api.getClusterCapabilities();
                    return {data};
                } catch (error) {
                    // If capabilities endpoint is not available, there will be an error
                    // That means no new features are available
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

const selectCapabilities = capabilitiesApi.endpoints.getClusterCapabilities.select(undefined);

export const selectCapabilityVersion = createSelector(
    (state: RootState) => state,
    (_state: RootState, capability: Capability) => capability,
    (state, capability) => selectCapabilities(state).data?.Capabilities?.[capability],
);
