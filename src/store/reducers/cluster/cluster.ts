import {createSelector, createSlice} from '@reduxjs/toolkit';
import type {Dispatch, PayloadAction} from '@reduxjs/toolkit';
import {skipToken} from '@reduxjs/toolkit/query';
import {StringParam, useQueryParam} from 'use-query-params';

import type {ClusterTab} from '../../../containers/Cluster/utils';
import {clusterTabsIds, isClusterTab} from '../../../containers/Cluster/utils';
import {parseTraceFields} from '../../../services/parsers/parseMetaCluster';
import {isClusterInfoV2} from '../../../types/api/cluster';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {TTabletStateInfo} from '../../../types/api/tablet';
import {CLUSTER_DEFAULT_TITLE, DEFAULT_CLUSTER_TAB_KEY} from '../../../utils/constants';
import {isQueryErrorResponse} from '../../../utils/query';
import type {RootState} from '../../defaultStore';
import {api} from '../api';
import {selectNodesMap} from '../nodesList';

import type {ClusterGroupsStats, ClusterState} from './types';
import {
    createSelectClusterGroupsQuery,
    getGroupStatsFromClusterInfo,
    normalizeDomain,
    parseGroupsStatsQueryResponse,
} from './utils';

const defaultClusterTabLS = localStorage.getItem(DEFAULT_CLUSTER_TAB_KEY);

let defaultClusterTab: ClusterTab;
if (isClusterTab(defaultClusterTabLS)) {
    defaultClusterTab = defaultClusterTabLS;
} else {
    defaultClusterTab = clusterTabsIds.overview;
}

const initialState: ClusterState = {
    defaultClusterTab,
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
            localStorage.setItem(DEFAULT_CLUSTER_TAB_KEY, tab);
            dispatch(clusterSlice.actions.setDefaultClusterTab(tab));
        }
    };
}

export default clusterSlice.reducer;

export const clusterApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getClusterInfo: builder.query<
            {
                clusterData: TClusterInfo;
                groupsStats?: ClusterGroupsStats;
            },
            string | undefined
        >({
            queryFn: async (clusterName, {signal}) => {
                try {
                    const clusterData = await window.api.viewer.getClusterInfo(clusterName, {
                        signal,
                    });

                    const clusterRoot = clusterData.Domain;
                    // Without domain we cannot get stats from system tables
                    if (!clusterRoot) {
                        return {data: {clusterData}};
                    }

                    if (isClusterInfoV2(clusterData)) {
                        return {
                            data: {
                                clusterData,
                                groupsStats: getGroupStatsFromClusterInfo(clusterData),
                            },
                        };
                    }

                    try {
                        const query = createSelectClusterGroupsQuery(clusterRoot);

                        // Normally query request should be fulfilled within 300-400ms even on very big clusters
                        // Table with stats is supposed to be very small (less than 10 rows)
                        // So we batch this request with cluster request to prevent possible layout shifts, if data is missing
                        const groupsStatsResponse = await window.api.viewer.sendQuery({
                            query: query,
                            database: clusterRoot,
                            action: 'execute-scan',
                        });

                        if (isQueryErrorResponse(groupsStatsResponse)) {
                            return {data: {clusterData}};
                        }

                        return {
                            data: {
                                clusterData,
                                groupsStats: parseGroupsStatsQueryResponse(groupsStatsResponse),
                            },
                        };
                    } catch {
                        return {data: {clusterData}};
                    }
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getClusterBaseInfo: builder.query({
            queryFn: async (clusterName: string, {signal}) => {
                try {
                    if (!window.api.meta) {
                        throw new Error('Method is not implemented.');
                    }
                    const data = await window.api.meta.getClusterBaseInfo(clusterName, {signal});
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

export function useClusterBaseInfo() {
    const [clusterName] = useQueryParam('clusterName', StringParam);

    const {currentData} = clusterApi.useGetClusterBaseInfoQuery(clusterName ?? skipToken);

    const {solomon: monitoring, name, trace_view: traceView, ...data} = currentData || {};

    return {
        ...data,
        ...parseTraceFields({traceView}),
        name: name ?? clusterName ?? undefined,
        monitoring,
    };
}

const createClusterInfoSelector = createSelector(
    (clusterName?: string) => clusterName,
    (clusterName) => clusterApi.endpoints.getClusterInfo.select(clusterName),
);

const selectClusterInfo = createSelector(
    (state: RootState) => state,
    (_state: RootState, clusterName?: string) => createClusterInfoSelector(clusterName),
    (state, selectGetClusterInfo) => selectGetClusterInfo(state).data,
);

export const selectClusterTitle = createSelector(
    (_state: RootState, clusterName?: string) => clusterName,
    (state: RootState, clusterName?: string) => selectClusterInfo(state, clusterName),
    (clusterName, clusterInfo) => {
        return (
            clusterName ||
            normalizeDomain(clusterInfo?.clusterData?.Domain) ||
            CLUSTER_DEFAULT_TITLE
        );
    },
);

export const selectClusterTabletsWithFqdn = createSelector(
    (state: RootState, clusterName?: string) => selectClusterInfo(state, clusterName),
    (state: RootState) => selectNodesMap(state),
    (data, nodeHostsMap): (TTabletStateInfo & {fqdn?: string})[] => {
        const tablets = data?.clusterData?.SystemTablets;
        if (!tablets) {
            return [];
        }
        if (!nodeHostsMap) {
            return tablets;
        }
        return tablets.map((tablet) => {
            const fqdn =
                tablet.NodeId === undefined ? undefined : nodeHostsMap.get(tablet.NodeId)?.Host;
            return {...tablet, fqdn};
        });
    },
);
