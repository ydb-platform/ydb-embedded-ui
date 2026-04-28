import {HeaderBreadcrumbs} from './HeaderBreadcrumbs';
import {HeaderLeftControls} from './HeaderLeftControls';
import {HeaderRightControls} from './HeaderRightControls';
import {b} from './constants';
import {useHeaderBreadcrumbs} from './hooks/useHeaderBreadcrumbs';
import {useHeaderData} from './hooks/useHeaderData';
import {useHeaderPageContext} from './hooks/useHeaderPageContext';

import './Header.scss';

export function Header() {
    const {
        metaCapabilitiesLoaded,
        page,
        pageBreadcrumbsOptions,
        singleClusterMode,
        isViewerUser,
        databasesPageAvailable,
        isV2NavigationEnabled,
        savedHomePageTab,
        savedDatabasesEnvironment,
        homePageTabFromPath,
        database,
        clusterName,
        isDatabasePage,
        isClusterPage,
        isHomePage,
        isDatabasesHomePage,
        isClustersHomePage,
    } = useHeaderPageContext();

    const {
        clusterTitle,
        isAddClusterAvailable,
        handleEditCluster,
        handleDeleteCluster,
        databaseData,
        isDatabaseDataLoading,
        monitoringLinkUrl,
        clusterLinks,
    } = useHeaderData({
        metaCapabilitiesLoaded,
        database,
        clusterName,
        isDatabasePage,
        isClustersHomePage,
    });

    const breadcrumbItems = useHeaderBreadcrumbs({
        page,
        pageBreadcrumbsOptions,
        singleClusterMode,
        isViewerUser,
        isV2NavigationEnabled,
        homePageTabFromPath,
        savedHomePageTab,
        savedDatabasesEnvironment,
        databasesPageAvailable,
        clusterTitle,
        isClustersHomePage,
        isDatabasesHomePage,
    });

    if (!metaCapabilitiesLoaded) {
        return null;
    }

    const leftControls =
        database && isDatabasePage && isV2NavigationEnabled ? (
            <HeaderLeftControls
                database={database}
                databaseData={databaseData}
                isDatabaseDataLoading={isDatabaseDataLoading}
            />
        ) : null;

    return (
        <header className={b()}>
            <HeaderBreadcrumbs breadcrumbItems={breadcrumbItems} endContent={leftControls} />

            <HeaderRightControls
                clusterName={clusterName}
                database={database}
                databaseData={databaseData}
                isDatabasePage={isDatabasePage}
                isClusterPage={isClusterPage}
                isHomePage={isHomePage}
                isClustersHomePage={isClustersHomePage}
                isDatabaseDataLoading={isDatabaseDataLoading}
                isAddClusterAvailable={isAddClusterAvailable}
                isV2NavigationEnabled={isV2NavigationEnabled}
                monitoringLinkUrl={monitoringLinkUrl}
                clusterLinks={clusterLinks}
                handleEditCluster={handleEditCluster}
                handleDeleteCluster={handleDeleteCluster}
            />
        </header>
    );
}
