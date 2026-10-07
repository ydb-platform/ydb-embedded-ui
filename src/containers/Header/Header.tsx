import {ClipboardButton, Flex} from '@gravity-ui/uikit';

import type {StorageGroupBreadcrumbsOptions} from '../../store/reducers/header/types';
import {StorageGroupStateLabel} from '../Storage/StorageGroupStateLabel';
import {storageGroupPageKeyset} from '../StorageGroupPage/i18n';

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
        clusterLinks,
        databaseLinks,
        prepareTenantBackend,
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

    let leftControls =
        database && isDatabasePage && isV2NavigationEnabled ? (
            <HeaderLeftControls
                database={database}
                databaseData={databaseData}
                isDatabaseDataLoading={isDatabaseDataLoading}
            />
        ) : null;

    if (page === 'storageGroup') {
        const {groupId, state} = pageBreadcrumbsOptions as StorageGroupBreadcrumbsOptions;
        leftControls = (
            <Flex alignItems="center" gap={2} className={b('left-controls')}>
                {groupId && (
                    <ClipboardButton
                        text={groupId}
                        view="flat-secondary"
                        size="s"
                        aria-label={storageGroupPageKeyset('action_copy-group-id-from-breadcrumb')}
                        tooltipInitialText={storageGroupPageKeyset('action_copy-group-id')}
                    />
                )}
                <StorageGroupStateLabel state={state} size="xs" />
            </Flex>
        );
    }

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
                isViewerUser={isViewerUser}
                prepareTenantBackend={prepareTenantBackend}
                clusterLinks={clusterLinks}
                databaseLinks={databaseLinks}
                handleEditCluster={handleEditCluster}
                handleDeleteCluster={handleDeleteCluster}
            />
        </header>
    );
}
