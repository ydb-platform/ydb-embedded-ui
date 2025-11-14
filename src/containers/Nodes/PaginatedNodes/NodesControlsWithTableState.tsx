import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {NodesControls} from '../NodesControls/NodesControls';

interface NodesControlsWithTableStateProps {
    withGroupBySelect: boolean;
    groupByParams: NodesGroupByField[];
    withPeerRoleFilter?: boolean;
}

export function NodesControlsWithTableState({
    withGroupBySelect,
    groupByParams,
    withPeerRoleFilter,
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
        />
    );
}
