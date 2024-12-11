import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {Tags} from '../../../components/Tags';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {ClusterLink} from '../../../types/additionalProps';
import {isClusterInfoV2} from '../../../types/api/cluster';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {EFlag} from '../../../types/api/enums';
import type {InfoItem} from '../../../types/components';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {parseJson} from '../../../utils/utils';
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

export const getInfo = (cluster: TClusterInfo, additionalInfo: InfoItem[]) => {
    const info: InfoItem[] = [];

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
            value: <Tags tags={dataCenters} gap={2} className={b('dc')} />,
        });
    }

    info.push({
        label: i18n('label_load'),
        value: <ProgressViewer value={cluster?.LoadAverage} capacity={cluster?.NumberOfCpus} />,
    });

    info.push(...additionalInfo);

    return info;
};

/**
 * parses stringified json in format {url: "href"}
 */
function prepareClusterLink(rawLink?: string) {
    try {
        const linkObject = parseJson(rawLink) as unknown;

        if (
            linkObject &&
            typeof linkObject === 'object' &&
            'url' in linkObject &&
            typeof linkObject.url === 'string'
        ) {
            return linkObject.url;
        }
    } catch {}

    return undefined;
}

export function useClusterLinks() {
    const {cores, logging} = useClusterBaseInfo();

    return React.useMemo(() => {
        const result: ClusterLink[] = [];

        const coresLink = prepareClusterLink(cores);
        const loggingLink = prepareClusterLink(logging);

        if (coresLink) {
            result.push({
                title: i18n('link_cores'),
                url: coresLink,
            });
        }

        if (loggingLink) {
            result.push({
                title: i18n('link_logging'),
                url: loggingLink,
            });
        }

        return result;
    }, [cores, logging]);
}
