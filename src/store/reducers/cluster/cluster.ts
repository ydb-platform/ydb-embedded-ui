import {createSelector, createSlice} from '@reduxjs/toolkit';
import type {Dispatch, PayloadAction} from '@reduxjs/toolkit';
import {skipToken} from '@reduxjs/toolkit/query';

import type {ClusterTab} from '../../../containers/Cluster/utils';
import {clusterTabsIds, isClusterTab} from '../../../containers/Cluster/utils';
import {isClusterInfoV2} from '../../../types/api/cluster';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {TTabletStateInfo} from '../../../types/api/tablet';
import {CLUSTER_DEFAULT_TITLE} from '../../../utils/constants';
import {useClusterNameFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {useIsViewerUser} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {isQueryErrorResponse} from '../../../utils/query';
import type {RootState} from '../../defaultStore';
import {api} from '../api';
import {selectNodesMap} from '../nodesList';

import {
    parseCoresUrl,
    parseLinksField,
    parseLoggingUrls,
    parseSettingsField,
    parseTraceField,
} from './parseFields';
import type {ClusterGroupsStats, ClusterState} from './types';
import {
    createSelectClusterGroupsQuery,
    getGroupStatsFromClusterInfo,
    normalizeDomain,
    parseGroupsStatsQueryResponse,
    prepareClusterInfo,
} from './utils';

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
                    const rawClusterData = await window.api.viewer.getClusterInfo(clusterName, {
                        signal,
                    });
                    const clusterData = prepareClusterInfo(rawClusterData);

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
                        const query = createSelectClusterGroupsQuery();

                        // Normally query request should be fulfilled within 300-400ms even on very big clusters
                        // Table with stats is supposed to be very small (less than 10 rows)
                        // So we batch this request with cluster request to prevent possible layout shifts, if data is missing
                        const groupsStatsResponse = await window.api.viewer.sendQuery({
                            query: query,
                            database: clusterRoot,
                            action: 'execute-query',
                            internal_call: true,
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
    const clusterNameFromQuery = useClusterNameFromQuery();
    const isViewerUser = useIsViewerUser();

    const shouldFetchClusterBaseInfo = Boolean(clusterNameFromQuery && isViewerUser);
    const {currentData, isSuccess, isError} = clusterApi.useGetClusterBaseInfoQuery(
        clusterNameFromQuery || skipToken,
        {
            skip: !isViewerUser,
        },
    );

    const {solomon: monitoring, name, title, ...data} = currentData || {};

    // name is used for requests, title is used for display
    // Example:
    // Name: ydb_vla_dev02
    // Title: YDB DEV VLA02
    const clusterName = name ?? clusterNameFromQuery ?? undefined;
    const clusterTitle = title || clusterName;

    // Whether the request settled (or is not needed). Until then `settings` is
    // not yet known and any decision that depends on it must be deferred.
    const isResolved = !shouldFetchClusterBaseInfo || isSuccess || isError;

    return {
        ...data,

        monitoring,

        name: clusterName,
        title: clusterTitle,

        traceView: parseTraceField(data.trace_view),
        cores: parseCoresUrl(data.cores),
        logging: parseLoggingUrls(data.logging),

        settings: parseSettingsField(data.settings),
        links: parseLinksField(data.links),

        isResolved,
    };
}

export function useClusterWithProxy() {
    const {settings} = useClusterBaseInfo();
    return settings?.use_meta_proxy !== false;
}

/**
 * Reports whether the cluster base info (and therefore the `use_meta_proxy`
 * setting) is known. While the request is in flight `useClusterWithProxy()`
 * optimistically returns `true`, so any decision that switches backends
 * (e.g. meta vs viewer for topic data) must be deferred until this resolves.
 * When the query is skipped (single-cluster mode / non-viewer user) settings
 * are not applicable and considered resolved — defaults apply.
 */
export function useClusterProxySettingResolved() {
    const {isResolved} = useClusterBaseInfo();
    return isResolved;
}

type ClusterBaseInfo = ReturnType<typeof useClusterBaseInfo>;

export type ClusterInfo = Omit<ClusterBaseInfo, 'isResolved'>;

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
