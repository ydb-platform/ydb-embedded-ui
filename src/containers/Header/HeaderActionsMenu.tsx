import React from 'react';

import {Ellipsis, Pencil, PlugConnection, TrashBin} from '@gravity-ui/icons';
import type {DropdownMenuItem, DropdownMenuProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Icon} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import {getClusterPath} from '../../routes';
import {useEmMetaAvailable} from '../../store/reducers/capabilities/hooks';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {uiFactory} from '../../uiFactory/uiFactory';
import {getInfoTabLinks} from '../../utils/additionalProps';
import {useAdditionalTenantsProps} from '../AppWithClusters/utils/useAdditionalTenantsProps';

import {headerKeyset} from './i18n';

export interface HeaderActionsMenuProps {
    database?: string;
    clusterName?: string;
    databaseData?: PreparedTenant;
    isDatabaseDataLoading: boolean;
    isV2NavigationEnabled: boolean;
}

export function DBHeaderActionsMenu({
    database,
    clusterName,
    databaseData,
    isDatabaseDataLoading,
    isV2NavigationEnabled,
}: HeaderActionsMenuProps) {
    const history = useHistory();

    const emMetaAvailable = useEmMetaAvailable();

    const additionalTenantProps = useAdditionalTenantsProps({
        getLogsLink: uiFactory.getLogsLink,
        getDatabaseLinks: uiFactory.getDatabaseLinks,
    });

    const isEditDBAvailable = emMetaAvailable && uiFactory.onEditDB !== undefined;
    const isDeleteDBAvailable = emMetaAvailable && uiFactory.onDeleteDB !== undefined;

    const menuItems = React.useMemo(() => {
        const menuItems: DropdownMenuItem[][] = [];

        const links = getInfoTabLinks(
            additionalTenantProps,
            databaseData?.Name,
            databaseData?.Type,
        );

        if (links.length) {
            const linksItems: DropdownMenuItem[] = [];

            for (const link of links) {
                linksItems.push({
                    text: link.title,
                    iconStart: <Icon data={link.icon} />,
                    action: () => {
                        history.push(link.url);
                    },
                });
            }

            menuItems.push(linksItems);
        }

        // In v1 navigation `Сonnect` is displayed as a separate button
        if (isV2NavigationEnabled) {
            menuItems.push([
                {
                    text: headerKeyset('action_connect-to-db'),
                    iconStart: <PlugConnection />,
                    action: () => getConnectToDBDialog({database}),
                },
            ]);
        }

        const {onEditDB, onDeleteDB} = uiFactory;

        const isEnoughData = clusterName && databaseData;

        const manageDBGroup: DropdownMenuItem[] = [];

        if (isEditDBAvailable && onEditDB && isEnoughData) {
            manageDBGroup.push({
                text: headerKeyset('action_edit-db'),
                iconStart: <Pencil />,
                action: () => {
                    onEditDB({clusterName, databaseData});
                },
            });
        }
        if (isDeleteDBAvailable && onDeleteDB && isEnoughData) {
            manageDBGroup.push({
                text: headerKeyset('action_delete-db'),
                iconStart: <TrashBin />,
                action: () => {
                    onDeleteDB({clusterName, databaseData}).then((isDeleted) => {
                        if (isDeleted) {
                            const path = getClusterPath({activeTab: 'tenants'});
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
    }, [database, clusterName, databaseData, additionalTenantProps]);

    const renderSwitcher: DropdownMenuProps<unknown>['renderSwitcher'] = (props) => {
        return (
            <Button {...props} view="flat" loading={isDatabaseDataLoading} size="m">
                <Icon data={Ellipsis} />
            </Button>
        );
    };

    if (!menuItems.length) {
        return null;
    }

    return (
        <DropdownMenu
            items={menuItems}
            renderSwitcher={renderSwitcher}
            menuProps={{size: 'm'}}
            popupProps={{placement: 'bottom-end'}}
        />
    );
}
