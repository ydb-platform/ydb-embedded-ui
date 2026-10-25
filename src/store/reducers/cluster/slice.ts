import {createSlice} from '@reduxjs/toolkit';
import type {Dispatch, PayloadAction} from '@reduxjs/toolkit';

import type {ClusterState} from './types';

export const clusterTabsIds = {
    tenants: 'databases',
    nodes: 'nodes',
    storage: 'storage',
    network: 'network',
    versions: 'versions',
    tablets: 'tablets',
    events: 'events',
    configs: 'configs',
} as const;

export type ClusterTab = (typeof clusterTabsIds)[keyof typeof clusterTabsIds];

export function isClusterTab(tab: unknown): tab is ClusterTab {
    return Object.values(clusterTabsIds).some((id) => id === tab);
}

export const INITIAL_DEFAULT_CLUSTER_TAB = clusterTabsIds.tenants;

const initialState: ClusterState = {
    defaultClusterTab: INITIAL_DEFAULT_CLUSTER_TAB,
};

const clusterSlice = createSlice({
    name: 'cluster',
    initialState,
    reducers: {
        setDefaultClusterTab(state, action: PayloadAction<ClusterTab>) {
            state.defaultClusterTab = action.payload;
        },
    },
});

export function updateDefaultClusterTab(tab: string) {
    return (dispatch: Dispatch) => {
        if (isClusterTab(tab)) {
            dispatch(clusterSlice.actions.setDefaultClusterTab(tab));
        }
    };
}

export default clusterSlice.reducer;
