import React from 'react';

import {DatacenterProvider} from '../../../../../components/Datacenter/DatacenterProvider';
import {getQueryScope} from '../../../../../store/queryScope';
import {nodesApi} from '../../../../../store/reducers/nodes/nodes';
import {getDatabaseDatacenters} from '../../../../../utils/datacenters';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {useClusterNameFromQuery} from '../../../../../utils/hooks/useDatabaseFromQuery';

import type {DBInfoProps} from './DatabaseInfo';
import {DatabaseInfo} from './DatabaseInfo';

export function DatabaseInfoWithDatacenters(props: DBInfoProps) {
    const clusterName = useClusterNameFromQuery();
    const [pollingInterval] = useAutoRefreshInterval();
    const {currentData, isError} = nodesApi.useGetNodesQuery(
        {
            database: props.database,
            fieldsRequired: ['NodeId', 'SystemState', 'DC', 'PileName'],
            filter_peer_role: 'database',
            storage: false,
            tablets: false,
            scope: getQueryScope({clusterName}),
        },
        {pollingInterval},
    );
    const datacenters = React.useMemo(
        () => (currentData ? (getDatabaseDatacenters(currentData) ?? null) : undefined),
        [currentData],
    );
    return (
        <DatacenterProvider>
            <DatabaseInfo {...props} datacenters={isError ? undefined : datacenters} />
        </DatacenterProvider>
    );
}
