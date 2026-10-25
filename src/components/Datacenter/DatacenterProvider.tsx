import React from 'react';

import {getQueryScope} from '../../store/queryScope';
import {clusterApi} from '../../store/reducers/cluster/cluster';
import {uiFactory} from '../../uiFactory/uiFactory';
import {createDatacenterColorIndexes} from '../../utils/datacenters';
import {useTypedSelector} from '../../utils/hooks';
import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsViewerUser} from '../../utils/hooks/useWhoami';

import {DatacenterContext} from './DatacenterContext';

export function DatacenterProvider({
    children,
    enabled = true,
}: {
    children: React.ReactNode;
    enabled?: boolean;
}) {
    const clusterName = useClusterNameFromQuery();
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const isViewerUser = useIsViewerUser();
    const configuredIndexes = uiFactory.datacenterColorIndexes;
    const {currentData} = clusterApi.useGetClusterInfoQuery(getQueryScope({clusterName}), {
        skip: !enabled || (!singleClusterMode && !clusterName) || !isViewerUser,
    });
    const indexes = React.useMemo(
        () =>
            currentData
                ? createDatacenterColorIndexes(
                      currentData.clusterData.DataCenters ?? [],
                      configuredIndexes,
                  )
                : configuredIndexes,
        [configuredIndexes, currentData],
    );
    return <DatacenterContext.Provider value={indexes}>{children}</DatacenterContext.Provider>;
}
