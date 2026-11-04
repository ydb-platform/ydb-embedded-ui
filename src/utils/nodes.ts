import {z} from 'zod';

import {EFlag} from '../types/api/enums';
import type {TSystemStateInfo} from '../types/api/nodes';
import type {TNodeInfo} from '../types/api/nodesList';
import type {NodesMap} from '../types/store/nodesList';

import {HOUR_IN_SECONDS} from './constants';
import {getDatacenterKey} from './datacenters';

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

export const isUnavailableNode = <
    T extends Pick<TSystemStateInfo, 'SystemState'> = Pick<TSystemStateInfo, 'SystemState'>,
>(
    node: T,
) => !node.SystemState || node.SystemState === EFlag.Grey;

function getNodePileName(node: TNodeInfo) {
    const legacyLocation = node.PhysicalLocation?.Location || node.PhysicalLocation?.DataCenterId;
    return node.Location?.BridgePileName || legacyLocation?.match(/(?:^|\/)P=([^/]+)/)?.[1];
}

export const prepareNodesMap = (nodesList?: TNodeInfo[]) => {
    return nodesList?.reduce<NodesMap>((nodeHosts, node) => {
        if (valueIsDefined(node.Id)) {
            const physicalLocation = node.PhysicalLocation;
            // The legacy numeric Rack can be a hash of the actual rack name.
            const Rack =
                node.Location?.Rack || physicalLocation?.Location?.match(/(?:^|\/)R=([^/]+)/)?.[1];

            nodeHosts.set(node.Id, {
                Host: node.Host,
                DC: node.Location?.DataCenter || physicalLocation?.DataCenterId,
                DCKey: getDatacenterKey(node.Location, physicalLocation?.DataCenterId),
                Rack,
                PileName: getNodePileName(node),
            });
        }
        return nodeHosts;
    }, new Map());
};

export function calculateLoadAveragePercents(node: TSystemStateInfo = {}) {
    const {LoadAverage, NumberOfCpus, RealNumberOfCpus} = node;
    const cpuCount = RealNumberOfCpus ?? NumberOfCpus;

    if (!valueIsDefined(LoadAverage) || !cpuCount) {
        return undefined;
    }

    return LoadAverage.map((value) => {
        return (value * 100) / cpuCount;
    });
}

export interface PreparedNodeSystemState extends TSystemStateInfo {
    Rack?: string;
    DC?: string;
    DCKey?: string;
    LoadAveragePercents?: number[];
    TenantName?: string;
    SharedCacheLimit?: number;
    SharedCacheUsed?: number;
}

export function prepareNodeSystemState(
    systemState: TSystemStateInfo = {},
): PreparedNodeSystemState {
    // There is no Rack in Location field for din nodes
    const Rack = systemState.Location?.Rack || systemState.Rack;
    const DC = systemState.Location?.DataCenter || systemState.DataCenter;
    const TenantName = systemState?.Tenants?.[0];

    const LoadAveragePercents = calculateLoadAveragePercents(systemState);

    // 0 limit means that limit is not set, so it should be undefined
    const SharedCacheLimit = Number(systemState.SharedCacheStats?.LimitBytes) || undefined;
    const SharedCacheUsed = valueIsDefined(systemState.SharedCacheStats?.UsedBytes)
        ? Number(systemState.SharedCacheStats?.UsedBytes)
        : undefined;

    return {
        ...systemState,
        Rack,
        DC,
        DCKey: getDatacenterKey(systemState.Location, systemState.DataCenter),
        LoadAveragePercents,
        TenantName,
        SharedCacheLimit,
        SharedCacheUsed,
    };
}

export const getUptimeParamValue = (nodesUptimeFilter: NodesUptimeFilterValues | undefined) => {
    return nodesUptimeFilter === NodesUptimeFilterValues.SmallUptime ? HOUR_IN_SECONDS : undefined;
};

export function checkIsStorageNode<T extends PreparedNodeSystemState>(node?: T) {
    return Boolean(node?.Roles?.includes('Storage'));
}

export function checkIsTenantNode<T extends PreparedNodeSystemState>(node?: T) {
    return Boolean(node?.Tenants);
}
