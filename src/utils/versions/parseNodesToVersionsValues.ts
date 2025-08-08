import type {NodesGroup} from '../../store/reducers/nodes/types';
import type {TSystemStateInfo} from '../../types/api/nodes';

import {getColorFromVersionsData} from './getVersionsColors';
import type {VersionValue, VersionsDataMap} from './types';

const MIN_VALUE = 0.5;

export const parseNodesToVersionsValues = (
    nodes: TSystemStateInfo[] = [],
    versionsDataMap?: VersionsDataMap,
): VersionValue[] => {
    const versionsCount = nodes.reduce<Record<string, number>>((acc, node) => {
        if (node.Version) {
            if (acc[node.Version]) {
                acc[node.Version] = acc[node.Version] + 1;
            } else {
                acc[node.Version] = 1;
            }
        }
        return acc;
    }, {});
    const result = Object.keys(versionsCount).map((version) => {
        const value = (versionsCount[version] / nodes.length) * 100;

        return {
            title: version,
            version: version,
            value: value < MIN_VALUE ? MIN_VALUE : value,
            color: getColorFromVersionsData(version, versionsDataMap),
        };
    });
    return normalizeResult(result);
};

export function parseNodeGroupsToVersionsValues(
    groups: NodesGroup[],
    versionsDataMap?: VersionsDataMap,
    total?: number,
) {
    const normalizedTotal = total ?? groups.reduce((acc, group) => acc + group.count, 0);
    const result = groups.map((group) => {
        const value = (group.count / normalizedTotal) * 100;

        return {
            title: group.name,
            version: group.name,
            value: value < MIN_VALUE ? MIN_VALUE : value,
            color: getColorFromVersionsData(group.name, versionsDataMap),
        };
    });
    const normalized = normalizeResult(result);
    return normalized;
}

function normalizeResult(data: VersionValue[]) {
    let maximum = data[0].value;
    let maximumIndex = 0;
    let total = 0;
    data.forEach((item, index) => {
        total += item.value;
        if (item.value > maximum) {
            maximum = item.value;
            maximumIndex = index;
        }
    });
    const result = [...data];
    //Progress breakes if sum of values more than 100, so we need to subtrackt difference appeared because of MIN_VALUE from the biggest value in set
    result[maximumIndex] = {...data[maximumIndex], value: maximum + 100 - total};
    return result;
}
