import {z} from 'zod';

import type {NodesPreparedEntity} from '../store/reducers/nodes/types';
import {ProblemFilterValues} from '../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../store/reducers/settings/types';
import {EFlag} from '../types/api/enums';
import type {NodesSortValue, TSystemStateInfo} from '../types/api/nodes';
import type {TNodeInfo} from '../types/api/nodesList';
import type {NodeHostsMap} from '../types/store/nodesList';

import {HOUR_IN_SECONDS} from './constants';
import {calcUptime} from './dataFormatters/dataFormatters';

import {valueIsDefined} from '.';

export enum NodesUptimeFilterValues {
    'All' = 'All',
    'SmallUptime' = 'SmallUptime',
}

export const nodesUptimeFilterValuesSchema = z
    .nativeEnum(NodesUptimeFilterValues)
    .catch(NodesUptimeFilterValues.All);

export const NodesUptimeFilterTitles = {
    [NodesUptimeFilterValues.All]: 'All',
    [NodesUptimeFilterValues.SmallUptime]: 'Uptime < 1h',
};

export const isUnavailableNode = (node: NodesPreparedEntity | TSystemStateInfo) =>
    !node.SystemState || node.SystemState === EFlag.Grey;

export const prepareNodeHostsMap = (nodesList?: TNodeInfo[]) => {
    return nodesList?.reduce<NodeHostsMap>((nodeHosts, node) => {
        if (node.Id && node.Host) {
            nodeHosts.set(Number(node.Id), node.Host);
        }
        return nodeHosts;
    }, new Map());
};

export function calculateLoadAveragePercents(node: TSystemStateInfo = {}) {
    const {LoadAverage, NumberOfCpus} = node;

    if (!valueIsDefined(LoadAverage) || !valueIsDefined(NumberOfCpus)) {
        return undefined;
    }

    return LoadAverage.map((value) => {
        return (value * 100) / NumberOfCpus;
    });
}

export interface PreparedNodeSystemState extends TSystemStateInfo {
    Rack?: string;
    DC?: string;
    LoadAveragePercents?: number[];
    Uptime: string;
}

export const prepareNodeSystemState = (
    systemState: TSystemStateInfo = {},
): PreparedNodeSystemState => {
    // There is no Rack in Location field for din nodes
    const Rack = systemState.Location?.Rack || systemState.Rack;
    const DC = systemState.Location?.DataCenter || systemState.DataCenter;

    const Uptime = calcUptime(systemState.StartTime);

    const LoadAveragePercents = calculateLoadAveragePercents(systemState);

    return {
        ...systemState,
        Rack,
        DC,
        Uptime,
        LoadAveragePercents,
    };
};

export const getProblemParamValue = (problemFilter: ProblemFilterValue | undefined) => {
    return problemFilter === ProblemFilterValues.PROBLEMS;
};

export const getUptimeParamValue = (nodesUptimeFilter: NodesUptimeFilterValues | undefined) => {
    return nodesUptimeFilter === NodesUptimeFilterValues.SmallUptime ? HOUR_IN_SECONDS : undefined;
};

export const NODES_SORT_VALUES: NodesSortValue[] = [
    'NodeId',
    'Host',
    'NodeName',
    'DC',
    'Rack',
    'Version',
    'Uptime',
    'CPU',
    'LoadAverage',
    'Memory',
    `Missing`,
    `DiskSpaceUsage`,
    `Database`,
];

export const isSortableNodesProperty = (value: unknown): value is NodesSortValue =>
    NODES_SORT_VALUES.includes(value as NodesSortValue);
