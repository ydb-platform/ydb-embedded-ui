import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import type {InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {Tags} from '../../../components/Tags';
import type {ClusterLink} from '../../../types/additionalProps';
import {isClusterInfoV2} from '../../../types/api/cluster';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {EFlag} from '../../../types/api/enums';
import type {TTabletStateInfo} from '../../../types/api/tablet';
import {EType} from '../../../types/api/tablet';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';

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

const getDCInfo = (cluster: TClusterInfo) => {
    if (isClusterInfoV2(cluster) && cluster.MapDataCenters) {
        return Object.entries(cluster.MapDataCenters).map(([dc, count]) => (
            <React.Fragment key={dc}>
                {dc}: {formatNumber(count)}
            </React.Fragment>
        ));
    }
    return undefined;
};

export const getInfo = (
    cluster: TClusterInfo,
    additionalInfo: InfoViewerItem[],
    links: ClusterLink[],
) => {
    const info: InfoViewerItem[] = [];

    if (isClusterInfoV2(cluster) && cluster.MapNodeStates) {
        const arrayNodesStates = Object.entries(cluster.MapNodeStates) as [EFlag, number][];
        // sort stack to achieve order "green, orange, yellow, red, blue, grey"
        arrayNodesStates.sort((a, b) => COLORS_PRIORITY[b[0]] - COLORS_PRIORITY[a[0]]);
        const nodesStates = arrayNodesStates.map(([state, count]) => {
            return (
                <NodesState state={state as EFlag} key={state}>
                    {formatNumber(count)}
                </NodesState>
            );
        });
        info.push({
            label: i18n('label_nodes-state'),
            value: <Flex gap={2}>{nodesStates}</Flex>,
        });
    }

    const dataCenters = getDCInfo(cluster);
    if (dataCenters?.length) {
        info.push({
            label: i18n('label_dc'),
            value: <Tags tags={dataCenters} gap={2} />,
        });
    }

    info.push({
        label: i18n('label_load'),
        value: <ProgressViewer value={cluster?.LoadAverage} capacity={cluster?.NumberOfCpus} />,
    });

    info.push(...additionalInfo);

    if (links.length) {
        info.push({
            label: i18n('links'),
            value: (
                <div className={b('links')}>
                    {links.map(({title, url}) => (
                        <LinkWithIcon key={title} title={title} url={url} />
                    ))}
                </div>
            ),
        });
    }

    return info;
};
