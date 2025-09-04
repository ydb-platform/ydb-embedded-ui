import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import type {Column} from '../../../components/PaginatedTable';
import type {NodesColumnId} from '../../../components/nodesColumns/constants';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../../store/reducers/capabilities/hooks';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {useProblemFilter} from '../../../store/reducers/settings/hooks';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {useNodesPageQueryParams} from '../useNodesPageQueryParams';

import {GroupedNodesComponent} from './GroupedNodesComponent';
import {NodesComponent} from './NodesComponent';

import '../Nodes.scss';

export interface PaginatedNodesProps {
    path?: string;
    database?: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
    withPeerRoleFilter?: boolean;
    columns: Column<NodesPreparedEntity>[];
    defaultColumnsIds: NodesColumnId[];
    requiredColumnsIds: NodesColumnId[];
    selectedColumnsKey: string;
    groupByParams: NodesGroupByField[];
}

export function PaginatedNodes(props: PaginatedNodesProps) {
    const {uptimeFilter, groupByParam, handleUptimeFilterChange} = useNodesPageQueryParams(
        props.groupByParams,
        props.withPeerRoleFilter,
    );

    const {problemFilter, handleProblemFilterChange} = useProblemFilter();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (
            viewerNodesHandlerHasGrouping &&
            (problemFilter !== 'All' || uptimeFilter !== NodesUptimeFilterValues.All)
        ) {
            handleProblemFilterChange('All');
            handleUptimeFilterChange(NodesUptimeFilterValues.All);
        }
    }, [
        handleProblemFilterChange,
        handleUptimeFilterChange,
        problemFilter,
        uptimeFilter,
        viewerNodesHandlerHasGrouping,
    ]);

    const renderContent = () => {
        if (viewerNodesHandlerHasGrouping && groupByParam) {
            return <GroupedNodesComponent {...props} />;
        }

        return <NodesComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}
