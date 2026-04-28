import {useClusterData} from './useClusterData';
import {useDatabaseData} from './useDatabaseData';
import {useHeaderClusterLinks} from './useHeaderClusterLinks';

interface UseHeaderDataParams {
    metaCapabilitiesLoaded: boolean;
    database?: string;
    clusterName?: string;
    isDatabasePage: boolean;
    isClustersHomePage: boolean;
}

export function useHeaderData({
    metaCapabilitiesLoaded,
    database,
    clusterName,
    isDatabasePage,
    isClustersHomePage,
}: UseHeaderDataParams) {
    const {
        clusterTitle,
        monitoring,
        isAddClusterAvailable,
        handleEditCluster,
        handleDeleteCluster,
    } = useClusterData({
        metaCapabilitiesLoaded,
        isClustersHomePage,
    });

    const {databaseData, isDatabaseDataLoading, monitoringLinkUrl} = useDatabaseData({
        metaCapabilitiesLoaded,
        database,
        clusterName,
        isDatabasePage,
        monitoring,
    });

    const clusterLinks = useHeaderClusterLinks();

    return {
        clusterTitle,
        monitoring,
        isAddClusterAvailable,
        handleEditCluster,
        handleDeleteCluster,
        databaseData,
        isDatabaseDataLoading,
        monitoringLinkUrl,
        clusterLinks,
    };
}
