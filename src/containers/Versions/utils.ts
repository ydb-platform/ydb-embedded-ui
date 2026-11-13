import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {StringParam, useQueryParam} from 'use-query-params';

import {clustersApi} from '../../store/reducers/clusters/clusters';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import {isClusterInfoV2} from '../../types/api/cluster';
import type {TClusterInfo} from '../../types/api/cluster';
import {useTypedSelector} from '../../utils/hooks';
import {
    parseNodeGroupsToPreparedVersions,
    parseNodesToPreparedVersions,
    parseVersionsToVersionsDataMap,
} from '../../utils/versions';
import {getVersionMap, getVersionsData} from '../../utils/versions/clusterVersionColors';
import type {VersionsDataMap} from '../../utils/versions/types';

/** Newer handlers send this code together with `NeedGroup` */
const GROUP_NOT_APPLIED_PROBLEM = 'group-not-applied';

interface UseGetVersionValuesProps {
    cluster?: TClusterInfo;
    versionsDataMap?: VersionsDataMap;
    clusterLoading?: boolean;
}

export function useGetPreparedVersions({
    cluster,
    versionsDataMap,
    clusterLoading,
}: UseGetVersionValuesProps) {
    const {currentData} = nodesApi.useGetNodesQuery(
        isClusterInfoV2(cluster) || clusterLoading
            ? skipToken
            : {
                  tablets: false,
                  fieldsRequired: ['SystemState', 'SubDomainKey'],
                  group: 'Version',
              },
    );

    const preparedVersions = React.useMemo(() => {
        if (isClusterInfoV2(cluster) && cluster.MapVersions) {
            const groups = Object.entries(cluster.MapVersions).map(([version, count]) => ({
                name: version,
                count,
            }));
            return parseNodeGroupsToPreparedVersions(groups, versionsDataMap);
        }
        if (!currentData) {
            return [];
        }
        if (Array.isArray(currentData.tableGroups)) {
            return parseNodeGroupsToPreparedVersions(currentData.tableGroups, versionsDataMap);
        }
        return parseNodesToPreparedVersions(currentData.nodes, versionsDataMap);
    }, [currentData, versionsDataMap, cluster]);

    // The request is skipped when the versions come with the cluster.
    // Without grouping the handler returns the nodes, and the versions are counted from them,
    // so neither the flag nor the code newer handlers send with it is a problem here
    const responseQuality = currentData?.dataQuality;
    const dataQuality = React.useMemo(() => {
        if (!responseQuality) {
            return undefined;
        }

        return {
            ...responseQuality,
            needGroup: false,
            problems: responseQuality.problems.filter(
                (problem) => problem !== GROUP_NOT_APPLIED_PROBLEM,
            ),
        };
    }, [responseQuality]);

    return {preparedVersions, dataQuality};
}

export function useVersionsDataMap(cluster?: TClusterInfo) {
    const getVersionsDataMap = useGetClusterVersionsDataMap();

    return React.useMemo(() => {
        if (getVersionsDataMap) {
            return getVersionsDataMap();
        }
        return parseVersionsToVersionsDataMap(cluster?.Versions);
    }, [cluster?.Versions, getVersionsDataMap]);
}

/** For multi-cluster version - with using meta handlers */
function useGetClusterVersionsDataMap(): (() => VersionsDataMap) | undefined {
    const [clusterName] = useQueryParam('clusterName', StringParam);
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const {data} = clustersApi.useGetClustersListQuery(undefined, {skip: singleClusterMode});

    return React.useMemo(() => {
        if (singleClusterMode) {
            return undefined;
        }

        const clusters = data || [];
        const info = clusters.find((cluster) => cluster.name === clusterName);
        const versions = info?.versions || [];

        return () => getVersionsData(getVersionMap(versions));
    }, [singleClusterMode, data, clusterName]);
}
