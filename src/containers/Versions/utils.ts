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
        if (Array.isArray(currentData.NodeGroups)) {
            return parseNodeGroupsToPreparedVersions(currentData.NodeGroups, versionsDataMap);
        }
        return parseNodesToPreparedVersions(currentData.Nodes, versionsDataMap);
    }, [currentData, versionsDataMap, cluster]);

    return preparedVersions;
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
