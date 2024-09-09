import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import type {InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {Tablet} from '../../../components/Tablet';
import {Tags} from '../../../components/Tags';
import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import {nodesApi} from '../../../store/reducers/nodes/nodes';
import type {ClusterLink} from '../../../types/additionalProps';
import {isClusterInfoV2} from '../../../types/api/cluster';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {EFlag} from '../../../types/api/enums';
import type {TTabletStateInfo} from '../../../types/api/tablet';
import {EType} from '../../../types/api/tablet';
import type {VersionToColorMap, VersionValue} from '../../../types/versions';
import {formatStorageValues} from '../../../utils/dataFormatters/dataFormatters';
import {parseNodeGroupsToVersionsValues, parseNodesToVersionsValues} from '../../../utils/versions';
import {VersionsBar} from '../VersionsBar/VersionsBar';
import i18n from '../i18n';

import {DiskGroupsStatsBars} from './components/DiskGroupsStatsBars/DiskGroupsStatsBars';
import {NodesState} from './components/NodesState/NodesState';
import {b} from './shared';

const COLORS_PRIORITY: Record<EFlag, number> = {
    Green: 5,
    Blue: 4,
    Yellow: 3,
    Orange: 2,
    Red: 1,
    Grey: 0,
};

export const compareTablets = (tablet1: TTabletStateInfo, tablet2: TTabletStateInfo) => {
    if (tablet1.Type === EType.TxAllocator) {
        return 1;
    }

    if (tablet2.Type === EType.TxAllocator) {
        return -1;
    }

    return 0;
};

const getGroupsStatsFields = (groupsStats: ClusterGroupsStats) => {
    return Object.keys(groupsStats).map((diskType) => {
        return {
            label: i18n('storage-groups', {diskType}),
            value: <DiskGroupsStatsBars stats={groupsStats[diskType]} />,
        };
    });
};

const getDCInfo = (cluster: TClusterInfo) => {
    if (isClusterInfoV2(cluster) && cluster.MapDataCenters) {
        return Object.entries(cluster.MapDataCenters).map(([dc, count]) => (
            <React.Fragment key={dc}>
                {dc}: <span className={b('dc-count')}>{i18n('quantity', {count})}</span>
            </React.Fragment>
        ));
    }
    return cluster.DataCenters?.filter(Boolean);
};

const getStorageStats = (cluster: TClusterInfo) => {
    if (isClusterInfoV2(cluster) && cluster.MapDataCenters) {
        const {MapStorageTotal, MapStorageUsed} = cluster;
        const storageTypesSet = new Set(
            Object.keys(MapStorageTotal ?? []).concat(Object.keys(MapStorageUsed ?? [])),
        );
        if (storageTypesSet.size > 0) {
            return Array.from(storageTypesSet).reduce(
                (acc, storageType) => {
                    acc[storageType] = {
                        used: MapStorageUsed?.[storageType],
                        total: MapStorageTotal?.[storageType],
                    };
                    return acc;
                },
                {} as Record<string, {used?: string; total?: string}>,
            );
        }
        return Object.entries(cluster.MapDataCenters).map(([dc, count]) => (
            <React.Fragment key={dc}>
                {dc}: <span className={b('dc-count')}>{i18n('quantity', {count})}</span>
            </React.Fragment>
        ));
    }
    return {_default: {used: cluster?.StorageUsed, total: cluster?.StorageTotal}};
};

export const getInfo = (
    cluster: TClusterInfo,
    versionsValues: VersionValue[],
    groupsStats: ClusterGroupsStats,
    additionalInfo: InfoViewerItem[],
    links: ClusterLink[],
) => {
    const info: InfoViewerItem[] = [];

    const dataCenters = getDCInfo(cluster);

    if (dataCenters?.length) {
        info.push({
            label: i18n('dc'),
            value: <Tags tags={dataCenters} />,
        });
    }

    if (cluster.SystemTablets) {
        const tablets = cluster.SystemTablets.slice(0).sort(compareTablets);
        info.push({
            label: i18n('tablets'),
            value: (
                <div className={b('system-tablets')}>
                    {tablets.map((tablet, tabletIndex) => (
                        <Tablet key={tabletIndex} tablet={tablet} />
                    ))}
                </div>
            ),
        });
    }

    if (cluster.Tenants) {
        info.push({
            label: i18n('databases'),
            value: cluster.Tenants,
        });
    }

    info.push({
        label: i18n('nodes'),
        value: <ProgressViewer value={cluster?.NodesAlive} capacity={cluster?.NodesTotal} />,
    });

    if (isClusterInfoV2(cluster) && cluster.MapNodeStates) {
        // const fake = {Grey: 1, Green: 10, Red: 1, Orange: 2, Yellow: 2, Blue: 3};
        // const arrayNodesStates = Object.entries(fake) as [EFlag, number][];
        const arrayNodesStates = Object.entries(cluster.MapNodeStates) as [EFlag, number][];
        // sort stack to achieve order "green, orange, yellow, red, blue, grey"
        arrayNodesStates.sort((a, b) => COLORS_PRIORITY[b[0]] - COLORS_PRIORITY[a[0]]);
        const nodesStates = arrayNodesStates.map(([state, count]) => {
            return (
                <NodesState state={state as EFlag} key={state}>
                    {count}
                </NodesState>
            );
        });
        info.push({
            label: i18n('nodes-state'),
            value: <div className={b('nodes-states')}>{nodesStates}</div>,
        });
    }

    info.push({
        label: i18n('load'),
        value: <ProgressViewer value={cluster?.LoadAverage} capacity={cluster?.NumberOfCpus} />,
    });

    const storageStats = getStorageStats(cluster);

    Object.entries(storageStats).forEach(([type, stats]) => {
        let label = i18n('storage-size');
        if (type !== '_default') {
            label += `, ${type}`;
        }
        info.push({
            label: label,
            value: (
                <ProgressViewer
                    value={stats.used}
                    capacity={stats.total}
                    formatValues={formatStorageValues}
                />
            ),
        });
    });

    if (Object.keys(groupsStats).length) {
        info.push(...getGroupsStatsFields(groupsStats));
    }

    info.push(
        ...additionalInfo,
        {
            label: i18n('links'),
            value: (
                <div className={b('links')}>
                    {links.map(({title, url}) => (
                        <LinkWithIcon key={title} title={title} url={url} />
                    ))}
                </div>
            ),
        },
        {
            label: i18n('versions'),
            value: (
                <VersionsBar
                    versionsValues={versionsValues.filter((el) => el.title !== 'unknown')}
                />
            ),
        },
    );

    return info;
};

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
