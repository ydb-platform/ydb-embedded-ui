import {Icon} from '@gravity-ui/uikit';
import cubes3Icon from '@gravity-ui/icons/svgs/cubes-3.svg';
import databasesIcon from '@gravity-ui/icons/svgs/databases.svg';
import hardDriveIcon from '@gravity-ui/icons/svgs/hard-drive.svg';

import versionsIcon from '../../assets/icons/versions.svg';

import type {ValueOf} from '../../types/common';
import routes, {createHref} from '../../routes';

export const clusterTabsIds = {
    tenants: 'tenants',
    nodes: 'nodes',
    storage: 'storage',
    versions: 'versions',
} as const;

export type ClusterTab = ValueOf<typeof clusterTabsIds>;

const tenants = {
    id: clusterTabsIds.tenants,
    title: 'Databases',
    icon: <Icon data={databasesIcon} />,
};
const nodes = {
    id: clusterTabsIds.nodes,
    title: 'Nodes',
    icon: <Icon data={cubes3Icon} />,
};
const storage = {
    id: clusterTabsIds.storage,
    title: 'Storage',
    icon: <Icon data={hardDriveIcon} />,
};
const versions = {
    id: clusterTabsIds.versions,
    title: 'Versions',
    icon: <Icon data={versionsIcon} />,
};

export const clusterTabs = [tenants, nodes, storage, versions];

export const getClusterPath = (activeTab: ClusterTab = clusterTabsIds.tenants, query = {}) => {
    return createHref(routes.cluster, {activeTab}, query);
};
