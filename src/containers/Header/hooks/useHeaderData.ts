import React from 'react';

import type {DatabaseLink} from '../../../types/additionalProps';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {getInfoTabLinks} from '../../../utils/additionalProps';
import {CLUSTER_LINK_CONTEXT} from '../../../utils/clusterLinks/clusterLinkConstants';
import {useDatabaseLinks} from '../../../utils/clusterLinks/useDatabaseLinks';
import {MONITORING_UI_TITLE} from '../../../utils/constants';
import {useAdditionalTenantsProps} from '../../AppWithClusters/utils/useAdditionalTenantsProps';

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

    const additionalTenantProps = useAdditionalTenantsProps({
        getLogsLink: uiFactory.getLogsLink,
        getDatabaseLinks: uiFactory.getDatabaseLinks,
    });

    const legacyDatabaseLinks = React.useMemo(() => {
        const links: DatabaseLink[] = [];

        if (monitoringLinkUrl) {
            links.push({
                title: MONITORING_UI_TITLE,
                url: monitoringLinkUrl,
                context: CLUSTER_LINK_CONTEXT.MONITORING,
            });
        }

        links.push(
            ...getInfoTabLinks(additionalTenantProps, databaseData?.Name, databaseData?.Type),
        );

        return links;
    }, [monitoringLinkUrl, additionalTenantProps, databaseData?.Name, databaseData?.Type]);

    const databaseLinks = useDatabaseLinks(databaseData, legacyDatabaseLinks);

    return {
        clusterTitle,
        isAddClusterAvailable,
        handleEditCluster,
        handleDeleteCluster,
        databaseData,
        isDatabaseDataLoading,
        clusterLinks,
        databaseLinks,
    };
}
