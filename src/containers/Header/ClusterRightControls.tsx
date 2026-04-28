import React from 'react';

import {Pencil, TrashBin} from '@gravity-ui/icons';

import type {DropdownMenuItemWithDescription} from '../../components/DropdownMenu';
import {DropdownMenu} from '../../components/DropdownMenu';
import type {ClusterLinkWithTitle} from '../../types/additionalProps';
import {CLUSTER_LINK_CONTEXT} from '../../utils/clusterLinks/clusterLinkConstants';

import {ClusterMonitoringControl} from './ClusterMonitoringControl';
import {DeveloperUIControl} from './GlobalRightControls';
import {headerKeyset} from './i18n';

interface ClusterRightControlsProps {
    clusterLinks: ClusterLinkWithTitle[];
    showDeveloperUI: boolean;
    handleEditCluster?: () => Promise<boolean>;
    handleDeleteCluster?: () => Promise<boolean>;
}

export function ClusterRightControls({
    clusterLinks,
    showDeveloperUI,
    handleEditCluster,
    handleDeleteCluster,
}: ClusterRightControlsProps) {
    const monitoringClusterLink = React.useMemo(
        () => clusterLinks.find((link) => link.context === CLUSTER_LINK_CONTEXT.MONITORING),
        [clusterLinks],
    );

    const actionClusterLinks = React.useMemo(
        () =>
            clusterLinks.filter((link) => {
                return link.context !== CLUSTER_LINK_CONTEXT.MONITORING;
            }),
        [clusterLinks],
    );

    const menuItems = React.useMemo<DropdownMenuItemWithDescription[][]>(() => {
        const items: DropdownMenuItemWithDescription[][] = [];

        if (actionClusterLinks.length) {
            items.push(
                actionClusterLinks.map((link) => ({
                    title: link.title,
                    description: link.description,
                    iconStart: link.icon,
                    href: link.url,
                    target: '_blank',
                })),
            );
        }

        const manageClusterItems: DropdownMenuItemWithDescription[] = [];

        if (handleEditCluster) {
            manageClusterItems.push({
                title: headerKeyset('action_edit-cluster'),
                iconStart: Pencil,
                action: handleEditCluster,
            });
        }

        if (handleDeleteCluster) {
            manageClusterItems.push({
                title: headerKeyset('action_delete-cluster'),
                iconStart: TrashBin,
                action: handleDeleteCluster,
                theme: 'danger',
            });
        }

        if (manageClusterItems.length) {
            items.push(manageClusterItems);
        }

        return items;
    }, [actionClusterLinks, handleDeleteCluster, handleEditCluster]);

    return (
        <React.Fragment>
            {monitoringClusterLink ? (
                <ClusterMonitoringControl link={monitoringClusterLink} />
            ) : null}

            {showDeveloperUI ? <DeveloperUIControl /> : null}

            {menuItems.length ? (
                <DropdownMenu items={menuItems} popupProps={{placement: 'bottom-end'}} />
            ) : null}
        </React.Fragment>
    );
}
