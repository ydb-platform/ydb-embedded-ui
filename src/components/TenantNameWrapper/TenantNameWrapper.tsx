import React from 'react';

import {Pencil, PlugConnection, TrashBin} from '@gravity-ui/icons';
import {ClipboardButton, Flex, Link, Text} from '@gravity-ui/uikit';

import {getTenantPath} from '../../routes';
import {useEmMetaAvailable} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {EFlag} from '../../types/api/enums';
import {uiFactory} from '../../uiFactory/uiFactory';
import {getDatabaseLinks} from '../../utils/additionalProps';
import {CLUSTER_LINK_CONTEXT} from '../../utils/clusterLinks/clusterLinkConstants';
import {useDatabaseLinks} from '../../utils/clusterLinks/useDatabaseLinks';
import {cn} from '../../utils/cn';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoring} from '../../utils/monitoringVisibility';
import {getConnectToDBDialog} from '../ConnectToDB/ConnectToDBDialog';
import type {DropdownMenuItemWithDescription} from '../DropdownMenu';
import {DropdownMenu} from '../DropdownMenu';
import {EntityStatus} from '../EntityStatusNew/EntityStatus';
import {InternalLink} from '../InternalLink/InternalLink';

import i18n from './i18n';
import {getTenantBackend} from './utils';

import './TenantNameWrapper.scss';

const b = cn('ydb-database-name-wrapper');

interface TenantNameWrapperProps {
    tenant: PreparedTenant;
    clusterName?: string;
    additionalTenantsProps?: AdditionalTenantsProps;
    externalLink?: boolean;
}

export function TenantNameWrapper({
    tenant,
    clusterName,
    additionalTenantsProps,
    externalLink,
}: TenantNameWrapperProps) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const emMetaAvailable = useEmMetaAvailable();
    const isEditDBAvailable = emMetaAvailable && uiFactory.onEditDB !== undefined;
    const isDeleteDBAvailable = emMetaAvailable && uiFactory.onDeleteDB !== undefined;

    const {settings} = useClusterBaseInfo();

    const backend = getTenantBackend(tenant, additionalTenantsProps);
    const isExternalLink = externalLink || Boolean(backend);

    const legacyLinks = React.useMemo(
        () => getDatabaseLinks(additionalTenantsProps, tenant?.Name, tenant?.Type),
        [additionalTenantsProps, tenant?.Name, tenant?.Type],
    );
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();
    const showMonitoring = canShowTenantMonitoring(tenant?.ControlPlane, clusterMonitoring);

    const allResolvedLinks = useDatabaseLinks(tenant, legacyLinks);

    const resolvedLinks = React.useMemo(
        () =>
            showMonitoring
                ? allResolvedLinks
                : allResolvedLinks.filter(
                      ({context}) => context !== CLUSTER_LINK_CONTEXT.MONITORING,
                  ),
        [allResolvedLinks, showMonitoring],
    );

    const useDatabaseId = uiFactory.useDatabaseId && settings?.use_meta_proxy !== false;

    const dbUrl = getTenantPath(
        {
            clusterName: tenant.Cluster,
            database: useDatabaseId ? tenant.Id : tenant.Name,
            backend,
        },
        {withBasename: isExternalLink},
    );
    const dbName = tenant.controlPlaneName;
    const dbPath = tenant.Name ?? i18n('context_unknown');
    const dbStatus = tenant.Overall;

    const dbActions = React.useMemo(() => {
        const menuItems: DropdownMenuItemWithDescription[][] = [];

        if (!isUserAllowedToMakeChanges) {
            return [];
        }

        const linksItems: DropdownMenuItemWithDescription[] = [];

        for (const link of resolvedLinks) {
            linksItems.push({
                title: link.title,
                description: link.description,
                iconStart: link.icon,
                href: link.url,
            });
        }

        if (linksItems.length > 0) {
            menuItems.push(linksItems);
        }

        menuItems.push([
            {
                title: i18n('action_connect-to-db'),
                iconStart: PlugConnection,
                action: () => getConnectToDBDialog({database: tenant.Name}),
            },
        ]);

        // Do not show edit and delete actions for domain
        if (tenant.Type !== 'Domain' && clusterName) {
            const manageDbItems: DropdownMenuItemWithDescription[] = [];
            if (isEditDBAvailable) {
                manageDbItems.push({
                    title: i18n('action_edit'),
                    iconStart: Pencil,
                    action: () => {
                        uiFactory.onEditDB?.({
                            clusterName,
                            databaseData: tenant,
                        });
                    },
                });
            }
            if (isDeleteDBAvailable) {
                manageDbItems.push({
                    title: i18n('action_remove'),
                    iconStart: TrashBin,
                    action: () => {
                        uiFactory.onDeleteDB?.({
                            clusterName,
                            databaseData: tenant,
                        });
                    },
                    theme: 'danger',
                });
            }

            if (manageDbItems.length > 0) {
                menuItems.push(manageDbItems);
            }
        }

        return menuItems;
    }, [
        isUserAllowedToMakeChanges,
        resolvedLinks,
        clusterName,
        isEditDBAvailable,
        isDeleteDBAvailable,
        tenant,
    ]);

    const renderActions = React.useCallback(() => {
        if (!dbActions.length) {
            return null;
        }

        return (
            <DropdownMenu
                items={dbActions}
                defaultSwitcherProps={{view: 'flat-secondary', size: 'xs'}}
                size="s"
                menuProps={{size: 'l'}}
            />
        );
    }, [dbActions]);

    const renderName = React.useCallback(() => {
        if (isExternalLink) {
            return (
                <Link href={dbUrl} className={b('db-name')}>
                    {dbName}
                </Link>
            );
        }
        return (
            <InternalLink to={dbUrl} className={b('db-name')}>
                {dbName}
            </InternalLink>
        );
    }, [isExternalLink, dbUrl, dbName]);

    const renderStatus = React.useCallback(() => {
        return <EntityStatus.Label status={dbStatus ?? EFlag.Grey} size="xs" />;
    }, [dbStatus]);

    const renderPath = React.useCallback(() => {
        if (!dbPath) {
            return null;
        }

        return (
            <Flex gap={0.5} alignItems="baseline">
                <span className={b('db-path-wrapper')}>
                    <Text variant="caption-2" color="secondary" className={b('db-path')}>
                        {dbPath}
                    </Text>
                </span>
                <ClipboardButton size="xs" text={dbPath} className={b('path-copy-icon')} />
            </Flex>
        );
    }, [dbPath]);

    return (
        <Flex direction="column" gap={0.5}>
            <Flex alignItems="flex-start" justifyContent="space-between" gap={1}>
                <div className={b('db-name-wrapper')}>{renderName()}</div>
                <Flex gap={1}>
                    {renderStatus()}
                    {renderActions()}
                </Flex>
            </Flex>
            {renderPath()}
        </Flex>
    );
}
