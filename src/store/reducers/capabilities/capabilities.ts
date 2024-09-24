import {createSelector} from '@reduxjs/toolkit';

import type {Capability} from '../../../types/api/capabilities';
import type {AppDispatch, RootState} from '../../defaultStore';

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

export const selectCapabilities =
    capabilitiesApi.endpoints.getClusterCapabilities.select(undefined);

export const selectCapabilityVersion = createSelector(
    (state: RootState) => state,
    (_state: RootState, capability: Capability) => capability,
    (state, capability) => selectCapabilities(state).data?.Capabilities?.[capability],
);

export async function queryCapability(
    capability: Capability,
    {dispatch, getState}: {dispatch: AppDispatch; getState: () => RootState},
) {
    const thunk = capabilitiesApi.util.getRunningQueryThunk('getClusterCapabilities', undefined);
    await dispatch(thunk);

    return selectCapabilityVersion(getState(), capability) || 0;
}
