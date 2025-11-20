import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatusNew/EntityStatus';
import {ProgressViewer} from '../../../../components/ProgressViewer/ProgressViewer';
import {Tags} from '../../../../components/Tags';
import type {ClusterGroupsStats} from '../../../../store/reducers/cluster/types';
import {isClusterInfoV2} from '../../../../types/api/cluster';
import type {TClusterInfo} from '../../../../types/api/cluster';
import type {EFlag} from '../../../../types/api/enums';
import type {InfoItem} from '../../../../types/components';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';
import {DiskGroupsStats} from '../components/DiskGroupsStatsBars/DiskGroupsStats';
import {b} from '../shared';

const COLORS_PRIORITY: Record<EFlag, number> = {
    Green: 5,
    Blue: 4,
    Yellow: 3,
    Orange: 2,
    Red: 1,
    Grey: 0,
    DarkGrey: -1,
};

const getDCInfo = (cluster: TClusterInfo) => {
    if (isClusterInfoV2(cluster) && cluster.MapDataCenters) {
        return Object.entries(cluster.MapDataCenters).map(([dc, count]) => (
            <React.Fragment key={dc}>
                {dc} : {formatNumber(count)}
            </React.Fragment>
        ));
    }
    return undefined;
};

export const getInfo = (cluster: TClusterInfo, additionalInfo: InfoItem[]) => {
    const info: InfoItem[] = [];

    const dataCenters = getDCInfo(cluster);
    if (dataCenters?.length) {
        info.push({
            label: i18n('label_dc'),
            value: <Tags tags={dataCenters} gap={2} className={b('dc')} />,
        });
    }

    if (isClusterInfoV2(cluster) && cluster.MapNodeStates) {
        const arrayNodesStates = Object.entries(cluster.MapNodeStates) as [EFlag, number][];
        // sort stack to achieve order "green, orange, yellow, red, blue, grey"
        arrayNodesStates.sort((a, b) => COLORS_PRIORITY[b[0]] - COLORS_PRIORITY[a[0]]);
        const nodesStates = arrayNodesStates.map(([state, count]) => {
            return (
                <EntityStatus.Label
                    withStatusName={false}
                    status={state as EFlag}
                    size="s"
                    key={state}
                    iconSize={12}
                >
                    {formatNumber(count)}
                </EntityStatus.Label>
            );
        });
        info.push({
            label: i18n('label_nodes-state'),
            value: <Flex gap={2}>{nodesStates}</Flex>,
        });
    }

    info.push({
        label: i18n('label_load'),
        value: (
            <ProgressViewer
                value={cluster?.LoadAverage}
                capacity={cluster?.RealNumberOfCpus ?? cluster?.NumberOfCpus}
            />
        ),
    });

    info.push(...additionalInfo);

    return info;
};

export function getStorageGroupStats(groupStats: ClusterGroupsStats) {
    const result: React.ReactNode[] = [];

    Object.entries(groupStats).forEach(([storageType, stats]) => {
        Object.values(stats).forEach((erasureStats) => {
            result.push(
                <DiskGroupsStats
                    key={`${storageType}|${erasureStats.erasure}`}
                    stats={erasureStats}
                    storageType={storageType}
                />,
            );
        });
    });
    return result;
}
