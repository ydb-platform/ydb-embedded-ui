import React from 'react';

import {
    ArrowUpRightFromSquare,
    ChartAreaStacked,
    CirclePlus,
    PlugConnection,
} from '@gravity-ui/icons';
import {ActionTooltip, Breadcrumbs, Button, ClipboardButton, Flex, Icon} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {useLocation} from 'react-router-dom';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import {ServerlessDBLabel} from '../../components/ServerlessDBLabel/ServerlessDBLabel';
import type {HomePageTab} from '../../routes';
import {checkIsHomePage, checkIsTenantPage} from '../../routes';
import {environment} from '../../store';
import {
    useEmMetaAvailable,
    useMetaCapabilitiesLoaded,
    useMetaEnvironmentsAvailable,
} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {clustersApi} from '../../store/reducers/clusters/clusters';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {tenantApi} from '../../store/reducers/tenant/tenant';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {MONITORING_UI_TITLE} from '../../utils/constants';
import {
    createDeveloperUIInternalPageHref,
    useHasDeveloperUi,
} from '../../utils/developerUI/developerUI';
import {useSetting, useTypedSelector} from '../../utils/hooks';
import {
    useClusterNameFromQuery,
    useDatabaseFromQuery,
} from '../../utils/hooks/useDatabaseFromQuery';
import {useDatabasesV2} from '../../utils/hooks/useDatabasesV2';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoring} from '../../utils/monitoringVisibility';
import {isAccessError} from '../../utils/response';
import {useHomePageTab} from '../HomePage/useHomePageTab';
import {HealthcheckPreview} from '../Tenant/Diagnostics/TenantOverview/Healthcheck/HealthcheckPreview';
import {useNavigationV2Enabled} from '../Tenant/utils/useNavigationV2Enabled';

import {BreadcrumbLink} from './BreadcrumbLink';
import {DBHeaderActionsMenu} from './HeaderActionsMenu';
import {getBreadcrumbs} from './breadcrumbs';
import {headerKeyset} from './i18n';

import './Header.scss';

const b = cn('header');

export function Header() {
    const metaCapabilitiesLoaded = useMetaCapabilitiesLoaded();
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const isViewerUser = useIsViewerUser();
    const databasesPageAvailable = useMetaEnvironmentsAvailable();
    const isV2NavigationEnabled = useNavigationV2Enabled();

    const [savedHomePageTab] = useSetting<HomePageTab | undefined>(SETTING_KEYS.HOME_PAGE_TAB);
    const [savedDatabasesEnvironment] = useSetting<string | undefined>(
        SETTING_KEYS.DATABASES_PAGE_ENVIRONMENT,
    );

    const homePageTabFromPath = useHomePageTab();

    const isMetaDatabasesAvailable = useDatabasesV2();

    const {title: clusterTitle, monitoring} = useClusterBaseInfo();

    const database = useDatabaseFromQuery();

    const clusterName = useClusterNameFromQuery();

    const location = useLocation();

    const isDatabasePage = checkIsTenantPage(location.pathname);
    const isHomePage = checkIsHomePage(location.pathname);
    const isDatabasesHomePage = isHomePage && homePageTabFromPath === 'databases';
    const isClustersHomePage = isHomePage && homePageTabFromPath === 'clusters';

    const {isLoading: isClustersLoading, error: clustersError} =
        clustersApi.useGetClustersListQuery(undefined, {
            skip: !isClustersHomePage || !metaCapabilitiesLoaded,
        });

    const emMetaAvailable = useEmMetaAvailable();
    const isAddClusterAvailable =
        emMetaAvailable &&
        uiFactory.onAddCluster !== undefined &&
        !isClustersLoading &&
        !isAccessError(clustersError);

    const shouldRequestTenantData = database && isDatabasePage;

    const params = shouldRequestTenantData
        ? {database, clusterName, isMetaDatabasesAvailable}
        : skipToken;

    const {currentData: databaseData, isLoading: isDatabaseDataLoading} =
        tenantApi.useGetTenantInfoQuery(params, {
            skip: !metaCapabilitiesLoaded,
        });

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
            isV2NavigationEnabled,
            environment,
            homePageTab: homePageTabFromPath ?? savedHomePageTab,
            databasesPageEnvironment: savedDatabasesEnvironment,
            databasesPageAvailable,
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
    }, [
        clusterTitle,
        page,
        isClustersHomePage,
        isDatabasesHomePage,
        databasesPageAvailable,
        homePageTabFromPath,
        savedHomePageTab,
        savedDatabasesEnvironment,
        environment,
        pageBreadcrumbsOptions,
        singleClusterMode,
        isViewerUser,
        isV2NavigationEnabled,
    ]);

    const renderLeftControls = () => {
        if (database && isDatabasePage && isV2NavigationEnabled) {
            return <DBLeftControls database={database} databaseData={databaseData} />;
        }

        return null;
    };

    const renderContent = () => {
        if (!metaCapabilitiesLoaded) {
            return null;
        }
        return (
            <React.Fragment>
                <Breadcrumbs className={b('breadcrumbs')} endContent={renderLeftControls()}>
                    {breadcrumbItems.map((item, index) => {
                        const {icon, text, link} = item;
                        const isLast = index === breadcrumbItems.length - 1;

                        return (
                            <Breadcrumbs.Item
                                key={index}
                                className={b('breadcrumbs-item', {active: isLast})}
                                disabled={isLast}
                            >
                                <BreadcrumbLink
                                    icon={icon}
                                    text={text}
                                    link={isLast ? undefined : link}
                                />
                            </Breadcrumbs.Item>
                        );
                    })}
                </Breadcrumbs>

                <RightControls
                    clusterName={clusterName}
                    database={database}
                    databaseData={databaseData}
                    isDatabasePage={isDatabasePage}
                    isHomePage={isHomePage}
                    isClustersHomePage={isClustersHomePage}
                    isDatabaseDataLoading={isDatabaseDataLoading}
                    isAddClusterAvailable={isAddClusterAvailable}
                    isV2NavigationEnabled={isV2NavigationEnabled}
                    monitoringLinkUrl={monitoringLinkUrl}
                />
            </React.Fragment>
        );
    };

    return <header className={b()}>{renderContent()}</header>;
}

interface DBLeftControlsProps {
    database: string;
    databaseData?: PreparedTenant;
}

function DBLeftControls({database, databaseData}: DBLeftControlsProps) {
    const renderCopyButton = React.useCallback(() => {
        if (databaseData?.Name) {
            return (
                <ClipboardButton
                    view="flat-secondary"
                    text={databaseData?.Name}
                    color="secondary"
                    size="s"
                />
            );
        }
        return null;
    }, [databaseData]);

    const renderConnectToDBButton = React.useCallback(() => {
        return (
            <ActionTooltip title={headerKeyset('description_connect-to-db')}>
                <Button
                    view="flat-secondary"
                    size="s"
                    onClick={() => getConnectToDBDialog({database})}
                >
                    <Icon data={PlugConnection} />
                </Button>
            </ActionTooltip>
        );
    }, [database]);

    const renderServerlessLabel = React.useCallback(() => {
        if (databaseData?.Type === 'Serverless') {
            return <ServerlessDBLabel />;
        }
        return null;
    }, [databaseData]);

    return (
        <Flex direction="row" alignItems={'center'} gap={2} className={b('left-controls')}>
            <Flex direction="row" alignItems={'center'}>
                {renderCopyButton()}
                {renderConnectToDBButton()}
            </Flex>
            <Flex direction="row" alignItems={'center'} gap={2}>
                {renderServerlessLabel()}
                <HealthcheckPreview database={database} compact />
            </Flex>
        </Flex>
    );
}

interface RightControlsProps {
    clusterName?: string;
    database?: string;
    databaseData?: PreparedTenant;
    isDatabasePage: boolean;
    isHomePage: boolean;
    isClustersHomePage: boolean;
    isDatabaseDataLoading: boolean;
    isAddClusterAvailable: boolean;
    isV2NavigationEnabled: boolean;
    monitoringLinkUrl: string | null;
}

function RightControls({
    clusterName,
    database,
    databaseData,
    isDatabasePage,
    isHomePage,
    isClustersHomePage,
    isDatabaseDataLoading,
    isAddClusterAvailable,
    isV2NavigationEnabled,
    monitoringLinkUrl,
}: RightControlsProps) {
    const hasDeveloperUi = useHasDeveloperUi();

    const renderAddClusterButton = React.useCallback(() => {
        if (isClustersHomePage && isAddClusterAvailable) {
            return (
                <Button view="flat" onClick={() => uiFactory.onAddCluster?.()}>
                    <Icon data={CirclePlus} />
                    {headerKeyset('title_add-cluster')}
                </Button>
            );
        }
        return null;
    }, [isClustersHomePage, isAddClusterAvailable]);

    const renderMonitoringButton = React.useCallback(() => {
        if (isDatabasePage && database && monitoringLinkUrl) {
            return (
                <ActionTooltip title={headerKeyset('description_monitoring')}>
                    <Button view="flat" href={monitoringLinkUrl} target="_blank">
                        <Icon data={ChartAreaStacked} />
                        {MONITORING_UI_TITLE}
                    </Button>
                </ActionTooltip>
            );
        }
        return null;
    }, [database, isDatabasePage, monitoringLinkUrl]);

    const renderConnectToDBButton = React.useCallback(() => {
        if (isDatabasePage && database && !isV2NavigationEnabled) {
            return (
                <ActionTooltip title={headerKeyset('description_connect-to-db')}>
                    <Button view="flat" onClick={() => getConnectToDBDialog({database})}>
                        <Icon data={PlugConnection} />
                        {headerKeyset('title_connect')}
                    </Button>
                </ActionTooltip>
            );
        }
        return null;
    }, [database, isDatabasePage, isV2NavigationEnabled]);

    const renderAdminUIButton = React.useCallback(() => {
        if (!isHomePage && hasDeveloperUi) {
            return (
                <ActionTooltip title={headerKeyset('description_admin-ui')}>
                    <Button view="flat" href={createDeveloperUIInternalPageHref()} target="_blank">
                        <Icon data={ArrowUpRightFromSquare} />
                        {headerKeyset('title_admin-ui')}
                    </Button>
                </ActionTooltip>
            );
        }
        return null;
    }, [hasDeveloperUi, isHomePage]);

    const renderDBActionsMenu = React.useCallback(() => {
        if (isDatabasePage) {
            return (
                <DBHeaderActionsMenu
                    database={database}
                    clusterName={clusterName}
                    databaseData={databaseData}
                    isDatabaseDataLoading={isDatabaseDataLoading}
                    isV2NavigationEnabled={isV2NavigationEnabled}
                />
            );
        }
        return null;
    }, [
        clusterName,
        database,
        databaseData,
        isDatabaseDataLoading,
        isDatabasePage,
        isV2NavigationEnabled,
    ]);

    return (
        <Flex direction="row" gap={2}>
            {renderAddClusterButton()}
            {renderMonitoringButton()}
            {renderConnectToDBButton()}
            {renderAdminUIButton()}
            {renderDBActionsMenu()}
        </Flex>
    );
}
