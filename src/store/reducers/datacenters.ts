import {createSlice} from '@reduxjs/toolkit';
import type {Dispatch, PayloadAction} from '@reduxjs/toolkit';

import type {DatacenterColorIndexes} from '../../utils/datacenters';
import {createDatacenterColorIndexes, getDatacenterKey} from '../../utils/datacenters';
import type {DatacenterQueryContext} from '../datacenterQueryContext';
import {getDatacenterQueryContext} from '../datacenterQueryContext';

import {setIsAuthenticated} from './authentication/authentication';
import {clusterApi} from './cluster/cluster';
import {nodesApi} from './nodes/nodes';
import {nodesListApi} from './nodesList';
import {storageApi} from './storage/storage';

export interface DatacentersState {
    indexes: DatacenterColorIndexes;
    generation: number;
}

interface RegisterDatacentersPayload extends DatacenterQueryContext {
    names: readonly (string | undefined)[];
}

const initialState: DatacentersState = {indexes: {}, generation: 0};

function registerDatacenters(state: DatacentersState, payload: RegisterDatacentersPayload) {
    if (payload.generation !== state.generation) {
        return state;
    }
    const current = state.indexes;
    const indexes = createDatacenterColorIndexes(payload.names, {
        ...current,
        ...payload.configuredIndexes,
    });
    // Polling and duplicate batches should not invalidate every color selector.
    if (Object.keys(indexes).some((name) => current[name] !== indexes[name])) {
        return {...state, indexes};
    }
    return state;
}

function registerQueryDatacenters(
    state: DatacentersState,
    meta: unknown,
    names: readonly (string | undefined)[] = [],
) {
    // These endpoints attach this snapshot before the request starts. Cache-only
    // updates without request metadata must not revive a previous session's data.
    const context = meta as DatacenterQueryContext | undefined;
    if (!context) {
        return state;
    }
    return registerDatacenters(state, {
        ...context,
        names,
    });
}

const datacentersSlice = createSlice({
    name: 'datacenters',
    initialState,
    reducers: {
        registerDatacenters(state, {payload}: PayloadAction<RegisterDatacentersPayload>) {
            return registerDatacenters(state, payload);
        },
    },
    extraReducers: (builder) => {
        builder.addCase(setIsAuthenticated, (state, {payload}) => {
            if (!payload) {
                // Ignore responses from requests started before logout.
                return {indexes: {}, generation: state.generation + 1};
            }
            return state;
        });
        builder.addMatcher(nodesListApi.endpoints.getNodesList.matchFulfilled, (state, action) =>
            registerQueryDatacenters(
                state,
                action.meta.baseQueryMeta,
                action.payload?.map((node) =>
                    getDatacenterKey(node.Location, node.PhysicalLocation?.DataCenterId),
                ),
            ),
        );
        builder.addMatcher(nodesApi.endpoints.getNodes.matchFulfilled, (state, action) =>
            registerQueryDatacenters(
                state,
                action.meta.baseQueryMeta,
                action.payload?.nodes?.map((node) => node.DCKey),
            ),
        );
        builder.addMatcher(
            storageApi.endpoints.getStorageNodesInfo.matchFulfilled,
            (state, action) =>
                registerQueryDatacenters(
                    state,
                    action.meta.baseQueryMeta,
                    action.payload?.nodes?.map((node) => node.DCKey),
                ),
        );
        builder.addMatcher(clusterApi.endpoints.getClusterInfo.matchFulfilled, (state, action) =>
            registerQueryDatacenters(
                state,
                action.meta.baseQueryMeta,
                action.payload.clusterData.DataCenters,
            ),
        );
    },
});

export default datacentersSlice.reducer;

/** Capture the session before awaiting the response. */
export function createDatacenterRegistrar({
    dispatch,
    getState,
}: {
    dispatch: Dispatch;
    getState: () => unknown;
}) {
    const context = getDatacenterQueryContext(getState);
    return (names: readonly (string | undefined)[] = []) => {
        dispatch(
            datacentersSlice.actions.registerDatacenters({
                ...context,
                names,
            }),
        );
    };
}
