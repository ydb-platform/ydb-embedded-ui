import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../../store/reducers/capabilities/hooks';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {GroupedStorageNodesComponent} from './GroupedStorageNodesComponent';
import {StorageNodesComponent} from './StorageNodesComponent';

import '../Storage.scss';

export function PaginatedStorageNodes(props: PaginatedStorageProps) {
    const {storageNodesGroupByParam, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (
            viewerNodesHandlerHasGrouping &&
            (visibleEntities !== 'all' || nodesUptimeFilter !== NodesUptimeFilterValues.All)
        ) {
            handleShowAllNodes();
        }
    }, [handleShowAllNodes, nodesUptimeFilter, viewerNodesHandlerHasGrouping, visibleEntities]);

    const renderContent = () => {
        if (viewerNodesHandlerHasGrouping && storageNodesGroupByParam) {
            return <GroupedStorageNodesComponent {...props} />;
        }

        return <StorageNodesComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}
