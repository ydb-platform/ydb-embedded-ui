import React from 'react';

import {DatabaseArrowRight, Pencil, PlugConnection, TrashBin} from '@gravity-ui/icons';
import {skipToken} from '@reduxjs/toolkit/query';
import {useHistory} from 'react-router-dom';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import type {DropdownMenuItemWithDescription} from '../../components/DropdownMenu';
import {DropdownMenu} from '../../components/DropdownMenu';
import {getClusterPath, getTenantPath} from '../../routes';
import {useEmMetaAvailable} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {tenantsApi} from '../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {ClusterLinkWithTitle} from '../../types/additionalProps';
import {uiFactory} from '../../uiFactory/uiFactory';
import {useDatabasesV2} from '../../utils/hooks/useDatabasesV2';
import {clusterTabsIds} from '../Cluster/utils';

import {b} from './constants';
import {headerKeyset} from './i18n';

export interface HeaderActionsMenuProps {
    database?: string;
    clusterName?: string;
    databaseData?: PreparedTenant;
    isDatabaseDataLoading: boolean;
    isV2NavigationEnabled: boolean;
    isViewerUser?: boolean;
    databaseLinks: ClusterLinkWithTitle[];
}

export function DBHeaderActionsMenu({
    database,
    clusterName,
    databaseData,
    isDatabaseDataLoading,
    isV2NavigationEnabled,
    isViewerUser,
    databaseLinks,
}: HeaderActionsMenuProps) {
    const history = useHistory();

    const emMetaAvailable = useEmMetaAvailable();
    const isMetaDatabasesAvailable = useDatabasesV2();
    const {settings} = useClusterBaseInfo();

    const useDatabaseId = uiFactory.useDatabaseId && settings?.use_meta_proxy !== false;
    const shouldResolveSharedDatabaseName =
        isViewerUser &&
        databaseData?.Type === 'Serverless' &&
        Boolean(databaseData.ResourceId) &&
        !useDatabaseId &&
        !databaseData.sharedTenantName;

    const {currentData: databases} = tenantsApi.useGetTenantsInfoQuery(
        shouldResolveSharedDatabaseName ? {clusterName, isMetaDatabasesAvailable} : skipToken,
    );

    const sharedDatabaseName = React.useMemo(() => {
        if (databaseData?.sharedTenantName) {
            return databaseData.sharedTenantName;
        }

        return databases?.find(({Id}) => Id === databaseData?.ResourceId)?.Name;
    }, [databaseData?.ResourceId, databaseData?.sharedTenantName, databases]);

    const sharedDatabase = useDatabaseId ? databaseData?.ResourceId : sharedDatabaseName;
    const sharedDatabasePath =
        isViewerUser && databaseData?.Type === 'Serverless' && sharedDatabase
            ? getTenantPath({clusterName, database: sharedDatabase}, {withBasename: true})
            : undefined;

    const isEditDBAvailable = emMetaAvailable && uiFactory.onEditDB !== undefined;
    const isDeleteDBAvailable = emMetaAvailable && uiFactory.onDeleteDB !== undefined;

    const menuItems = React.useMemo(() => {
        const menuItems: DropdownMenuItemWithDescription[][] = [];

        const linksItems: DropdownMenuItemWithDescription[] = [];

        for (const link of databaseLinks) {
            linksItems.push({
                title: link.title,
                description: link.description,
                iconStart: link.icon,
                href: link.url,
                target: link.target,
            });
        }

        if (linksItems.length) {
            menuItems.push(linksItems);
        }

        // In v1 navigation `Connect` is displayed as a separate button
        if (isV2NavigationEnabled) {
            menuItems.push([
                {
                    title: headerKeyset('action_connect-to-db'),
                    iconStart: PlugConnection,
                    action: () => getConnectToDBDialog({database}),
                },
            ]);
        }

        if (sharedDatabasePath) {
            menuItems.push([
                {
                    title: headerKeyset('action_go-to-shared-db'),
                    iconStart: DatabaseArrowRight,
                    href: sharedDatabasePath,
                },
            ]);
        }

        const {onEditDB, onDeleteDB} = uiFactory;

        const isEnoughData = clusterName && databaseData;

        const manageDBGroup: DropdownMenuItemWithDescription[] = [];

        if (isEditDBAvailable && onEditDB && isEnoughData) {
            manageDBGroup.push({
                title: headerKeyset('action_edit-db'),
                iconStart: Pencil,
                action: () => {
                    onEditDB({clusterName, databaseData});
                },
            });
        }
        if (isDeleteDBAvailable && onDeleteDB && isEnoughData) {
            manageDBGroup.push({
                title: headerKeyset('action_delete-db'),
                iconStart: TrashBin,
                action: () => {
                    onDeleteDB({clusterName, databaseData}).then((isDeleted) => {
                        if (isDeleted) {
                            const path = getClusterPath({activeTab: clusterTabsIds.tenants});
                            history.push(path);
                        }
                    });
                },
                theme: 'danger',
            });
        }

        if (manageDBGroup.length) {
            menuItems.push(manageDBGroup);
        }

        return menuItems;
    }, [
        database,
        clusterName,
        databaseData,
        databaseLinks,
        isV2NavigationEnabled,
        history,
        isEditDBAvailable,
        isDeleteDBAvailable,
        sharedDatabasePath,
    ]);

    if (!menuItems.length) {
        return null;
    }

    return (
        <div className={b('actions-menu')}>
            <DropdownMenu
                items={menuItems}
                popupProps={{placement: 'bottom-end'}}
                defaultSwitcherProps={{loading: isDatabaseDataLoading}}
            />
        </div>
    );
}
