import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {StringParam, useQueryParam} from 'use-query-params';

import {clustersApi} from '../../store/reducers/clusters/clusters';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import {isClusterInfoV2} from '../../types/api/cluster';
import type {TClusterInfo} from '../../types/api/cluster';
import type {VersionToColorMap} from '../../types/versions';
import {getVersionColors, getVersionMap} from '../../utils/clusterVersionColors';
import {useTypedSelector} from '../../utils/hooks';
import {
    parseNodeGroupsToVersionsValues,
    parseNodesToVersionsValues,
    parseVersionsToVersionToColorMap,
} from '../../utils/versions';

export const useGetVersionValues = (cluster?: TClusterInfo, versionToColor?: VersionToColorMap) => {
    const {currentData} = nodesApi.useGetNodesQuery(
        isClusterInfoV2(cluster)
            ? skipToken
            : {
                  tablets: false,
                  fieldsRequired: ['SystemState', 'SubDomainKey'],
                  group: 'Version',
              },
    );

    const versionsValues = React.useMemo(() => {
        if (isClusterInfoV2(cluster) && cluster.MapVersions) {
            const groups = Object.entries(cluster.MapVersions).map(([version, count]) => ({
                name: version,
                count,
            }));
            return parseNodeGroupsToVersionsValues(groups, versionToColor, cluster.NodesTotal);
        }
        if (!currentData) {
            return [];
        }
        if (Array.isArray(currentData.NodeGroups)) {
            return parseNodeGroupsToVersionsValues(
                currentData.NodeGroups,
                versionToColor,
                cluster?.NodesTotal,
            );
        }
        return parseNodesToVersionsValues(currentData.Nodes, versionToColor);
    }, [currentData, versionToColor, cluster]);

    return versionsValues;
};

export function useVersionToColorMap(cluster?: TClusterInfo) {
    const getVersionToColorMap = useGetClusterVersionToColorMap();

    return React.useMemo(() => {
        if (getVersionToColorMap) {
            return getVersionToColorMap();
        }
        return parseVersionsToVersionToColorMap(cluster?.Versions);
    }, [cluster?.Versions, getVersionToColorMap]);
}

/** For multi-cluster version - with using meta handlers */
function useGetClusterVersionToColorMap(): (() => VersionToColorMap) | undefined {
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

        return () => getVersionColors(getVersionMap(versions));
    }, [singleClusterMode, data, clusterName]);
}
