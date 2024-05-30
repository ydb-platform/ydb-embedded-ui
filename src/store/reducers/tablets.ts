import {createSelector, createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {ETabletState, EType, TTabletStateInfo} from '../../types/api/tablet';
import type {TabletsApiRequestParams, TabletsState} from '../../types/store/tablets';
import type {RootState} from '../defaultStore';

import {api} from './api';
import {selectNodesMap} from './nodesList';

const initialState: TabletsState = {
    stateFilter: [],
    typeFilter: [],
};

const slice = createSlice({
    name: 'tablets',
    initialState,
    reducers: {
        setStateFilter: (state, action: PayloadAction<ETabletState[]>) => {
            state.stateFilter = action.payload;
        },
        setTypeFilter: (state, action: PayloadAction<EType[]>) => {
            state.typeFilter = action.payload;
        },
    },
});

export const {setStateFilter, setTypeFilter} = slice.actions;
export default slice.reducer;

export const tabletsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTabletsInfo: build.query({
            queryFn: async (params: TabletsApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getTabletsInfo(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

const getTabletsInfoSelector = createSelector(
    (nodeId: string | undefined, path: string | undefined) => ({nodeId, path}),
    ({nodeId, path}) =>
        tabletsApi.endpoints.getTabletsInfo.select(
            nodeId === undefined ? {path} : {nodes: [nodeId]},
        ),
);

const selectGetTabletsInfo = createSelector(
    (state: RootState) => state,
    (_state: RootState, nodeId: string | undefined, path: string | undefined) =>
        getTabletsInfoSelector(nodeId, path),
    (state, selectTabletsInfo) => selectTabletsInfo(state).data,
);

export const selectTabletsWithFqdn = createSelector(
    (state: RootState, nodeId: string | undefined, path: string | undefined) =>
        selectGetTabletsInfo(state, nodeId, path),
    (state: RootState) => selectNodesMap(state),
    (data, nodesMap): (TTabletStateInfo & {fqdn?: string})[] => {
        if (!data?.TabletStateInfo) {
            return [];
        }
        if (!nodesMap) {
            return data.TabletStateInfo;
        }
        return data.TabletStateInfo.map((tablet) => {
            const fqdn = tablet.NodeId === undefined ? undefined : nodesMap.get(tablet.NodeId);
            return {...tablet, fqdn};
        });
    },
);
