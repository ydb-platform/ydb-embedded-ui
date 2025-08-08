import groupBy from 'lodash/groupBy';

import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {getColorFromVersionsData, parseNodesToVersionsValues} from '../../utils/versions';
import type {VersionsDataMap} from '../../utils/versions/types';

import type {GroupedNodesItem} from './types';
import {GroupByValue} from './types';

const sortByTitle = (a: GroupedNodesItem, b: GroupedNodesItem) =>
    a.title?.localeCompare(b.title || '') || -1;

export const getGroupedTenantNodes = (
    nodes: NodesPreparedEntity[] | undefined,
    versionsDataMap: VersionsDataMap | undefined,
    groupByValue: GroupByValue,
): GroupedNodesItem[] | undefined => {
    if (!nodes || !nodes.length) {
        return undefined;
    }

    if (groupByValue === GroupByValue.VERSION) {
        const dividedByVersion = groupBy(nodes, 'Version');

        return Object.keys(dividedByVersion)
            .map<GroupedNodesItem | null>((version) => {
                const filteredNodes = dividedByVersion[version].filter(isTenantNode);
                const dividedByTenant = groupBy(filteredNodes, 'Tenants');

                const items = Object.keys(dividedByTenant)
                    .map((tenant) => {
                        return {
                            title: tenant,
                            nodes: dividedByTenant[tenant],
                        };
                    })
                    .sort(sortByTitle);

                if (!items.length) {
                    return null;
                }

                return {
                    title: version,
                    items: items,
                    versionColor: getColorFromVersionsData(version, versionsDataMap),
                };
            })
            .filter((item): item is GroupedNodesItem => Boolean(item));
    } else {
        const filteredNodes = nodes.filter(isTenantNode);
        const dividedByTenant = groupBy(filteredNodes, 'Tenants');

        return Object.keys(dividedByTenant)
            .map<GroupedNodesItem | null>((tenant) => {
                const versionsValues = parseNodesToVersionsValues(
                    dividedByTenant[tenant],
                    versionsDataMap,
                );

                const dividedByVersion = groupBy(dividedByTenant[tenant], 'Version');
                const preparedItems = Object.keys(dividedByVersion).map((version) => {
                    return {
                        title: version,
                        nodes: dividedByVersion[version],
                        versionColor: getColorFromVersionsData(version, versionsDataMap),
                    };
                });

                if (!preparedItems.length) {
                    return null;
                }

                return {
                    title: tenant,
                    items: preparedItems,
                    versionsValues,
                };
            })
            .filter((item): item is GroupedNodesItem => Boolean(item))
            .sort(sortByTitle);
    }
};

export const getGroupedStorageNodes = (
    nodes: NodesPreparedEntity[] | undefined,
    versionsDataMap: VersionsDataMap | undefined,
): GroupedNodesItem[] | undefined => {
    if (!nodes || !nodes.length) {
        return undefined;
    }

    const storageNodes = nodes.filter(isStorageNode);
    const storageNodesDividedByVersion = groupBy(storageNodes, 'Version');

    return Object.keys(storageNodesDividedByVersion).map((version) => {
        return {
            title: version,
            nodes: storageNodesDividedByVersion[version],
            versionColor: getColorFromVersionsData(version, versionsDataMap),
        };
    });
};

export const getOtherNodes = (
    nodes: NodesPreparedEntity[] | undefined,
    versionsDataMap: VersionsDataMap | undefined,
): GroupedNodesItem[] | undefined => {
    if (!nodes || !nodes.length) {
        return undefined;
    }

    // Nodes that are not included in other groups
    const otherNodes = nodes.filter(
        (node) => !isStorageNode(node) && !isTenantNode(node) && node.Version,
    );
    const otherNodesDividedByVersion = groupBy(otherNodes, 'Version');

    return Object.keys(otherNodesDividedByVersion).map((version) => {
        return {
            title: version,
            nodes: otherNodesDividedByVersion[version],
            versionColor: getColorFromVersionsData(version, versionsDataMap),
        };
    });
};

function isStorageNode(node: NodesPreparedEntity) {
    return Boolean(node.Roles?.includes('Storage'));
}

function isTenantNode(node: NodesPreparedEntity) {
    return Boolean(node.Tenants);
}
