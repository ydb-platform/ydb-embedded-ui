import {createSelector} from '@reduxjs/toolkit';

import type {Capability} from '../../../types/api/capabilities';
import type {AppDispatch, RootState} from '../../defaultStore';

import {api} from './../api';

export const capabilitiesApi = api.injectEndpoints({
    endpoints: (build) => ({
        getClusterCapabilities: build.query({
            queryFn: async (params: {database?: string}) => {
                try {
                    const data = await window.api.viewer.getClusterCapabilities(params);
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

const createCapabilitiesSelector = createSelector(
    (database?: string) => database,
    (database) => capabilitiesApi.endpoints.getClusterCapabilities.select({database}),
);

export const selectDatabaseCapabilities = createSelector(
    (state: RootState) => state,
    (_state: RootState, database?: string) => createCapabilitiesSelector(database),
    (state, selectCapabilities) => selectCapabilities(state),
);

export const selectCapabilityVersion = createSelector(
    (state: RootState) => state,
    (_state: RootState, capability: Capability) => capability,
    (_state: RootState, _capability: Capability, database?: string) => database,
    (state, capability, database) =>
        selectDatabaseCapabilities(state, database).data?.Capabilities?.[capability],
);

export async function queryCapability(
    capability: Capability,
    database: string | undefined,
    {dispatch, getState}: {dispatch: AppDispatch; getState: () => RootState},
) {
    const thunk = capabilitiesApi.util.getRunningQueryThunk('getClusterCapabilities', {database});
    await dispatch(thunk);

    return selectCapabilityVersion(getState(), capability) || 0;
}
