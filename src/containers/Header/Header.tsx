import React from 'react';

import {
    ArrowUpRightFromSquare,
    ChevronDown,
    CirclePlus,
    Pencil,
    PlugConnection,
    TrashBin,
} from '@gravity-ui/icons';
import type {DropdownMenuItem, DropdownMenuProps} from '@gravity-ui/uikit';
import {Breadcrumbs, Button, Divider, DropdownMenu, Flex, Icon} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {useHistory, useLocation} from 'react-router-dom';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import {InternalLink} from '../../components/InternalLink';
import {checkIsClustersPage, checkIsTenantPage, getClusterPath} from '../../routes';
import {environment} from '../../store';
import {
    useAddClusterFeatureAvailable,
    useDatabasesAvailable,
    useDeleteDatabaseFeatureAvailable,
    useEditDatabaseFeatureAvailable,
} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {clustersApi} from '../../store/reducers/clusters/clusters';
import {tenantApi} from '../../store/reducers/tenant/tenant';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {DEVELOPER_UI_TITLE, MONITORING_UI_TITLE} from '../../utils/constants';
import {createDeveloperUIInternalPageHref} from '../../utils/developerUI/developerUI';
import {useTypedSelector} from '../../utils/hooks';
import {
    useClusterNameFromQuery,
    useDatabaseFromQuery,
} from '../../utils/hooks/useDatabaseFromQuery';
import {
    useIsUserAllowedToMakeChanges,
    useIsViewerUser,
} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoring} from '../../utils/monitoringVisibility';
import {isAccessError} from '../../utils/response';

import {getBreadcrumbs} from './breadcrumbs';
import {headerKeyset} from './i18n';

import './Header.scss';

const b = cn('header');

function Header() {
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const isViewerUser = useIsViewerUser();

    const isMetaDatabasesAvailable = useDatabasesAvailable();

    const {title: clusterTitle, monitoring} = useClusterBaseInfo();

    const database = useDatabaseFromQuery();

    const clusterName = useClusterNameFromQuery();

    const location = useLocation();
    const history = useHistory();

    const isDatabasePage = checkIsTenantPage(location.pathname);
    const isClustersPage = checkIsClustersPage(location.pathname);

    const {isLoading: isClustersLoading, error: clustersError} =
        clustersApi.useGetClustersListQuery(undefined, {
            skip: !isClustersPage,
        });

    const isAddClusterAvailable =
        useAddClusterFeatureAvailable() &&
        uiFactory.onAddCluster !== undefined &&
        !isClustersLoading &&
        !isAccessError(clustersError);

    const isEditDBAvailable = useEditDatabaseFeatureAvailable() && uiFactory.onEditDB !== undefined;
    const isDeleteDBAvailable =
        useDeleteDatabaseFeatureAvailable() && uiFactory.onDeleteDB !== undefined;

    const shouldRequestTenantData = database && isDatabasePage;

    const params = shouldRequestTenantData
        ? {database, clusterName, isMetaDatabasesAvailable}
        : skipToken;

    const {currentData: databaseData, isLoading: isDatabaseDataLoading} =
        tenantApi.useGetTenantInfoQuery(params);

    // Show Monitoring only when:
    // - ControlPlane exists AND has a non-empty id
    // - OR ControlPlane is absent, but cluster-level monitoring meta exists
    const controlPlane = databaseData?.ControlPlane;
    const canShowMonitoring = canShowTenantMonitoring(controlPlane, monitoring);
    const monitoringLinkUrl =
        canShowMonitoring && uiFactory.getMonitoringLink && databaseData?.Name && databaseData?.Type
            ? uiFactory.getMonitoringLink({
                  monitoring,
                  clusterName,
                  dbName: databaseData.Name,
                  dbType: databaseData.Type,
                  controlPlane: databaseData.ControlPlane,
                  userAttributes: databaseData.UserAttributes,
              })
            : null;

    const breadcrumbItems = React.useMemo(() => {
        let options = {
            ...pageBreadcrumbsOptions,
            singleClusterMode,
            isViewerUser,
            environment,
        };

        if (clusterTitle) {
            options = {
                ...options,
                clusterName: clusterTitle,
            };
        }

        const breadcrumbs = getBreadcrumbs(page, options);

        return breadcrumbs.map((item) => {
            return {...item, action: () => {}};
        });
    }, [clusterTitle, page, pageBreadcrumbsOptions, singleClusterMode, isViewerUser]);

    const renderRightControls = () => {
        const elements: React.ReactNode[] = [];

        if (isClustersPage && isAddClusterAvailable) {
            elements.push(
                <Button view={'flat'} onClick={() => uiFactory.onAddCluster?.()}>
                    <Icon data={CirclePlus} />
                    {headerKeyset('add-cluster')}
                </Button>,
            );
        }

        if (isDatabasePage && database) {
            if (monitoringLinkUrl) {
                elements.push(
                    <Button view="flat" href={monitoringLinkUrl} target="_blank">
                        {MONITORING_UI_TITLE}
                        <Icon data={ArrowUpRightFromSquare} />
                    </Button>,
                );
            }

            elements.push(
                <Button view={'flat'} onClick={() => getConnectToDBDialog({database})}>
                    <Icon data={PlugConnection} />
                    {headerKeyset('connect')}
                </Button>,
            );

            const menuItems: DropdownMenuItem[] = [];

            const {onEditDB, onDeleteDB} = uiFactory;

            const isEnoughData = clusterName && databaseData;

            if (isEditDBAvailable && onEditDB && isEnoughData) {
                menuItems.push({
                    text: headerKeyset('action_edit-db'),
                    iconStart: <Pencil />,
                    action: () => {
                        onEditDB({clusterName, databaseData});
                    },
                });
            }
            if (isDeleteDBAvailable && onDeleteDB && isEnoughData) {
                menuItems.push({
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

            if (menuItems.length) {
                const renderSwitcher: DropdownMenuProps<unknown>['renderSwitcher'] = (props) => {
                    return (
                        <Button {...props} loading={isDatabaseDataLoading} view="flat" size="m">
                            {headerKeyset('action_manage')}
                            <Icon data={ChevronDown} />
                        </Button>
                    );
                };

                elements.push(
                    <DropdownMenu
                        items={menuItems}
                        renderSwitcher={renderSwitcher}
                        menuProps={{size: 'l'}}
                        popupProps={{placement: 'bottom-end'}}
                    />,
                );
            }
        }

        if (!isClustersPage && isUserAllowedToMakeChanges) {
            elements.push(
                <Button view="flat" href={createDeveloperUIInternalPageHref()} target="_blank">
                    {DEVELOPER_UI_TITLE}
                    <Icon data={ArrowUpRightFromSquare} />
                </Button>,
            );
        }

        if (elements.length) {
            return (
                <Flex direction="row" gap={1}>
                    {elements.map((el, index) => {
                        return (
                            <React.Fragment key={index}>
                                {el}
                                {index === elements.length - 1 ? null : (
                                    <Divider orientation="vertical" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </Flex>
            );
        }

        return null;
    };

    const renderHeader = () => {
        return (
            <header className={b()}>
                <Breadcrumbs className={b('breadcrumbs')}>
                    {breadcrumbItems.map((item, index) => {
                        const {icon, text, link} = item;
                        const isLast = index === breadcrumbItems.length - 1;

                        return (
                            <Breadcrumbs.Item
                                key={index}
                                className={b('breadcrumbs-item', {active: isLast})}
                                disabled={isLast}
                            >
                                <InternalLink to={isLast ? undefined : link} as="tab">
                                    <Flex alignItems="center" gap={1}>
                                        {icon}
                                        {text}
                                    </Flex>
                                </InternalLink>
                            </Breadcrumbs.Item>
                        );
                    })}
                </Breadcrumbs>

                {renderRightControls()}
            </header>
        );
    };
    return renderHeader();
}

export default Header;
