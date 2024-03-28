import groupBy from 'lodash/groupBy';

import type {VersionToColorMap} from '../../types/versions';
import type {PreparedClusterNode} from '../../store/reducers/clusterNodes/types';
import {getMinorVersion, parseNodesToVersionsValues} from '../../utils/versions';

import {GroupByValue, GroupedNodesItem} from './types';

const sortByTitle = (a: GroupedNodesItem, b: GroupedNodesItem) =>
    a.title?.localeCompare(b.title || '') || -1;

export const getGroupedTenantNodes = (
    nodes: PreparedClusterNode[] | undefined,
    versionToColor: VersionToColorMap | undefined,
    groupByValue: GroupByValue,
): GroupedNodesItem[] | undefined => {
    if (!nodes || !nodes.length) {
        return undefined;
    }

    if (groupByValue === GroupByValue.VERSION) {
        const dividedByVersion = groupBy(nodes, 'Version');

        return Object.keys(dividedByVersion)
            .map<GroupedNodesItem | null>((version) => {
                const filteredNodes = dividedByVersion[version].filter(({Tenants}) =>
                    Boolean(Tenants),
                );
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
                    versionColor: versionToColor?.get(getMinorVersion(version)),
                };
            })
            .filter((item): item is GroupedNodesItem => Boolean(item));
    } else {
        const filteredNodes = nodes.filter(({Tenants}) => Boolean(Tenants));
        const dividedByTenant = groupBy(filteredNodes, 'Tenants');

        return Object.keys(dividedByTenant)
            .map<GroupedNodesItem | null>((tenant) => {
                const versionsValues = parseNodesToVersionsValues(
                    dividedByTenant[tenant],
                    versionToColor,
                );

                const dividedByVersion = groupBy(dividedByTenant[tenant], 'Version');
                const preparedItems = Object.keys(dividedByVersion).map((version) => {
                    return {
                        title: version,
                        nodes: dividedByVersion[version],
                        versionColor: versionToColor?.get(getMinorVersion(version)),
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
    nodes: PreparedClusterNode[] | undefined,
    versionToColor: VersionToColorMap | undefined,
): GroupedNodesItem[] | undefined => {
    if (!nodes || !nodes.length) {
        return undefined;
    }

    const storageNodes = nodes.filter(({Roles}) => Roles?.includes('Storage'));
    const storageNodesDividedByVersion = groupBy(storageNodes, 'Version');

    return Object.keys(storageNodesDividedByVersion).map((version) => {
        return {
            title: version,
            nodes: storageNodesDividedByVersion[version],
            versionColor: versionToColor?.get(getMinorVersion(version)),
        };
    });
};

export const getOtherNodes = (
    nodes: PreparedClusterNode[] | undefined,
    versionToColor: VersionToColorMap | undefined,
): GroupedNodesItem[] | undefined => {
    if (!nodes || !nodes.length) {
        return undefined;
    }

    const otherNodes = nodes.filter(({Roles}) => !Roles);
    const otherNodesDividedByVersion = groupBy(otherNodes, 'Version');

    return Object.keys(otherNodesDividedByVersion).map((version) => {
        return {
            title: version,
            nodes: otherNodesDividedByVersion[version],
            versionColor: versionToColor?.get(getMinorVersion(version)),
        };
    });
};
