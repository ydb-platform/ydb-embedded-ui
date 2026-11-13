import type React from 'react';

import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {NodesControls} from '../NodesControls/NodesControls';

interface NodesControlsWithTableStateProps {
    withGroupBySelect: boolean;
    groupByParams: NodesGroupByField[];
    withPeerRoleFilter?: boolean;
    dataIssuesIndicator?: React.ReactNode;
}

export function NodesControlsWithTableState({
    withGroupBySelect,
    groupByParams,
    withPeerRoleFilter,
    dataIssuesIndicator,
}: NodesControlsWithTableStateProps) {
    const {tableState} = usePaginatedTableState();

    return (
        <NodesControls
            withGroupBySelect={withGroupBySelect}
            groupByParams={groupByParams}
            withPeerRoleFilter={withPeerRoleFilter}
            entitiesCountCurrent={tableState.foundEntities}
            entitiesCountTotal={tableState.totalEntities}
            entitiesLoading={tableState.isInitialLoad}
            dataIssuesIndicator={dataIssuesIndicator}
        />
    );
}
