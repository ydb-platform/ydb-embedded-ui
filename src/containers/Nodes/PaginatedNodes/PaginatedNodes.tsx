import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import type {PaginatedTableData} from '../../../components/PaginatedTable';
import type {NodesColumnId} from '../../../components/nodesColumns/constants';
import type {NodesColumn} from '../../../components/nodesColumns/types';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../../store/reducers/capabilities/hooks';
import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {useNodesPageQueryParams} from '../useNodesPageQueryParams';

import {GroupedNodesComponent} from './GroupedNodesComponent';
import {NodesComponent} from './NodesComponent';

import '../Nodes.scss';

export interface PaginatedNodesProps {
    path?: string;
    databaseFullPath?: string;
    database?: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
    withPeerRoleFilter?: boolean;
    columns: NodesColumn[];
    defaultColumnsIds: NodesColumnId[];
    requiredColumnsIds: NodesColumnId[];
    selectedColumnsKey: string;
    groupByParams: NodesGroupByField[];
    onDataFetched?: (data: PaginatedTableData<PreparedStorageNode>) => void;
}

export function PaginatedNodes(props: PaginatedNodesProps) {
    const {
        uptimeFilter,
        groupByParam,
        withProblems,
        handleUptimeFilterChange,
        handleWithProblemsChange,
    } = useNodesPageQueryParams(props.groupByParams, props.withPeerRoleFilter);

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (
            viewerNodesHandlerHasGrouping &&
            (withProblems || uptimeFilter !== NodesUptimeFilterValues.All)
        ) {
            handleWithProblemsChange(false);
            handleUptimeFilterChange(NodesUptimeFilterValues.All);
        }
    }, [
        handleWithProblemsChange,
        handleUptimeFilterChange,
        withProblems,
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
