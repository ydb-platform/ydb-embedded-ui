import {ArrowUpRightFromSquare, Pencil, TrashBin} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {ClipboardButton, DropdownMenu, Flex, Icon, Link, Text} from '@gravity-ui/uikit';

import {getTenantPath} from '../../routes';
import {
    useDeleteDatabaseFeatureAvailable,
    useEditDatabaseFeatureAvailable,
} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {EFlag} from '../../types/api/enums';
import {uiFactory} from '../../uiFactory/uiFactory';
import {getDatabaseLinks} from '../../utils/additionalProps';
import {cn} from '../../utils/cn';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoring} from '../../utils/monitoringVisibility';
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
    const isEditDBAvailable = useEditDatabaseFeatureAvailable() && uiFactory.onEditDB !== undefined;
    const isDeleteDBAvailable =
        useDeleteDatabaseFeatureAvailable() && uiFactory.onDeleteDB !== undefined;

    const {settings} = useClusterBaseInfo();

    const backend = getTenantBackend(tenant, additionalTenantsProps);
    const isExternalLink = externalLink || Boolean(backend);

    const links = getDatabaseLinks(additionalTenantsProps, tenant?.Name, tenant?.Type);
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();
    const showMonitoring = canShowTenantMonitoring(tenant?.ControlPlane, clusterMonitoring);
    const filteredLinks = showMonitoring
        ? links
        : links.filter(({title}) => title !== i18n('field_monitoring-link'));

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
    const dbType = tenant.Type;

    const renderActions = () => {
        const menuItems: DropdownMenuItem[][] = [];

        if (!isUserAllowedToMakeChanges) {
            return null;
        }

        const linksItems: DropdownMenuItem[] = [];
        for (const link of filteredLinks) {
            linksItems.push({
                text: link.title,
                iconStart: <Icon data={link.icon} />,
                iconEnd: <ArrowUpRightFromSquare />,
                href: link.url,
            });
        }

        if (linksItems.length > 0) {
            menuItems.push(linksItems);
        }

        // Do not show edit and delete actions for domain
        if (dbType !== 'Domain' && clusterName) {
            const manageDbItems: DropdownMenuItem[] = [];
            if (isEditDBAvailable) {
                manageDbItems.push({
                    text: i18n('action_edit'),
                    iconStart: <Pencil />,
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
                    text: i18n('action_remove'),
                    iconStart: <TrashBin />,
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

        if (!menuItems.length) {
            return null;
        }

        return (
            <DropdownMenu
                items={menuItems}
                defaultSwitcherProps={{view: 'flat-secondary', size: 'xs'}}
                size="s"
                menuProps={{size: 'l'}}
            />
        );
    };

    const renderName = () => {
        if (isExternalLink) {
            return (
                <Link href={dbUrl} target="_blank">
                    {dbName}
                </Link>
            );
        }
        return <InternalLink to={dbUrl}>{dbName}</InternalLink>;
    };
    const renderStatus = () => {
        return <EntityStatus.Label status={dbStatus ?? EFlag.Grey} size="xs" />;
    };

    const renderPath = () => {
        if (!dbPath) {
            return null;
        }

        return (
            <Flex gap={0.5} alignItems={'baseline'}>
                <span className={b('db-path-wrapper')}>
                    <Text variant="caption-2" color="secondary" className={b('db-path')}>
                        {dbPath}
                    </Text>
                </span>
                <ClipboardButton size="xs" text={dbPath} className={b('path-copy-icon')} />
            </Flex>
        );
    };

    return (
        <Flex direction={'column'} gap={0.5}>
            <Flex alignItems={'flex-start'} justifyContent={'space-between'} gap={1}>
                <div className={b('db-name')}>{renderName()}</div>
                <Flex gap={1}>
                    {renderStatus()}
                    {renderActions()}
                </Flex>
            </Flex>
            {renderPath()}
        </Flex>
    );
}
