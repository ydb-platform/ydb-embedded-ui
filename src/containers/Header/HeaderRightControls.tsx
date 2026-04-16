import {Flex} from '@gravity-ui/uikit';

import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {ClusterLinkWithTitle} from '../../types/additionalProps';
import {useHasDeveloperUi} from '../../utils/developerUI/developerUI';

import {ClusterRightControls} from './ClusterRightControls';
import {ClustersHomeControls} from './ClustersHomeControls';
import {DatabaseRightControls} from './DatabaseRightControls';
import {DeveloperUIControl} from './GlobalRightControls';

interface HeaderRightControlsProps {
    clusterName?: string;
    database?: string;
    databaseData?: PreparedTenant;
    isDatabasePage: boolean;
    isClusterPage: boolean;
    isHomePage: boolean;
    isClustersHomePage: boolean;
    isDatabaseDataLoading: boolean;
    isAddClusterAvailable: boolean;
    isV2NavigationEnabled: boolean;
    monitoringLinkUrl: string | null;
    clusterLinks: ClusterLinkWithTitle[];
    handleEditCluster?: () => Promise<boolean>;
    handleDeleteCluster?: () => Promise<boolean>;
}

export function HeaderRightControls({
    clusterName,
    database,
    databaseData,
    isDatabasePage,
    isClusterPage,
    isHomePage,
    isClustersHomePage,
    isDatabaseDataLoading,
    isAddClusterAvailable,
    isV2NavigationEnabled,
    monitoringLinkUrl,
    clusterLinks,
    handleEditCluster,
    handleDeleteCluster,
}: HeaderRightControlsProps) {
    const hasDeveloperUi = useHasDeveloperUi();

    const showAddCluster = isClustersHomePage && isAddClusterAvailable;
    const showDeveloperUI = !isHomePage && hasDeveloperUi;

    return (
        <Flex direction="row" gap={2}>
            {showAddCluster ? <ClustersHomeControls /> : null}

            {isDatabasePage && database ? (
                <DatabaseRightControls
                    database={database}
                    clusterName={clusterName}
                    databaseData={databaseData}
                    isDatabaseDataLoading={isDatabaseDataLoading}
                    isV2NavigationEnabled={isV2NavigationEnabled}
                    monitoringLinkUrl={monitoringLinkUrl}
                    showDeveloperUI={showDeveloperUI}
                />
            ) : null}

            {isClusterPage ? (
                <ClusterRightControls
                    clusterLinks={clusterLinks}
                    showDeveloperUI={showDeveloperUI}
                    handleEditCluster={handleEditCluster}
                    handleDeleteCluster={handleDeleteCluster}
                />
            ) : null}

            {!isDatabasePage && !isClusterPage && showDeveloperUI ? <DeveloperUIControl /> : null}
        </Flex>
    );
}
