import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {nodesApi} from '../../store/reducers/nodes/nodes';
import {isClusterInfoV2} from '../../types/api/cluster';
import type {TClusterInfo} from '../../types/api/cluster';
import type {VersionToColorMap} from '../../types/versions';
import {parseNodeGroupsToVersionsValues, parseNodesToVersionsValues} from '../../utils/versions';

export const useGetVersionValues = (cluster?: TClusterInfo, versionToColor?: VersionToColorMap) => {
    const {currentData} = nodesApi.useGetNodesQuery(
        isClusterInfoV2(cluster)
            ? skipToken
            : {
                  tablets: false,
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
