import {createSelector} from '@reduxjs/toolkit';

import type {Capability, MetaCapability, SecuritySetting} from '../../../types/api/capabilities';
import type {AppDispatch, RootState} from '../../defaultStore';
import {serializeError} from '../../utils';

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
        getMetaCapabilities: build.query({
            queryFn: async () => {
                try {
                    if (!window.api.meta) {
                        throw new Error('Method is not implemented.');
                    }
                    const data = await window.api.meta.getMetaCapabilities();
                    return {data};
                } catch (error) {
                    // If capabilities endpoint is not available, there will be an error
                    // That means no new features are available
                    return {error: serializeError(error)};
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
    (state, capability, database) => {
        return selectDatabaseCapabilities(state, database).data?.Capabilities?.[capability];
    },
);
export const selectSecuritySetting = createSelector(
    (state: RootState) => state,
    (_state: RootState, setting: SecuritySetting) => setting,
    (_state: RootState, _setting: SecuritySetting, database?: string) => database,
    (state, setting, database) =>
        selectDatabaseCapabilities(state, database).data?.Settings?.Security?.[setting],
);

export const selectGraphShardExists = createSelector(
    (state: RootState) => state,
    (_state: RootState, database?: string) => database,
    (state, database) =>
        selectDatabaseCapabilities(state, database).data?.Settings?.Database?.GraphShardExists,
);

export const selectBridgeModeEnabled = createSelector(
    (state: RootState) => state,
    (_state: RootState, database?: string) => database,
    (state, database) =>
        selectDatabaseCapabilities(state, database).data?.Settings?.Cluster?.BridgeModeEnabled,
);

export async function queryCapability(
    capability: Capability,
    database: string | undefined,
    {dispatch, getState}: {dispatch: AppDispatch; getState: () => RootState},
) {
    const thunk = capabilitiesApi.util.getRunningQueryThunk('getClusterCapabilities', {database});
    await dispatch(thunk);

    return selectCapabilityVersion(getState(), capability, database) || 0;
}

export const selectMetaCapabilities = capabilitiesApi.endpoints.getMetaCapabilities.select({});

export const selectMetaCapabilityVersion = createSelector(
    (state: RootState) => state,
    (_state: RootState, capability: MetaCapability) => capability,
    (state, capability) => {
        return selectMetaCapabilities(state).data?.Capabilities?.[capability];
    },
);
