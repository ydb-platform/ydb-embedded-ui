import type {TableColumnSetupItem} from '@gravity-ui/uikit';

import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {NodesControls} from '../NodesControls/NodesControls';

interface NodesControlsWithTableStateProps {
    withGroupBySelect: boolean;
    groupByParams: NodesGroupByField[];
    withPeerRoleFilter?: boolean;
    columnsToSelect: TableColumnSetupItem[];
    handleSelectedColumnsUpdate: (updated: TableColumnSetupItem[]) => void;
}

export function NodesControlsWithTableState({
    withGroupBySelect,
    groupByParams,
    withPeerRoleFilter,
    columnsToSelect,
    handleSelectedColumnsUpdate,
}: NodesControlsWithTableStateProps) {
    const {tableState} = usePaginatedTableState();

    return (
        <NodesControls
            withGroupBySelect={withGroupBySelect}
            groupByParams={groupByParams}
            withPeerRoleFilter={withPeerRoleFilter}
            columnsToSelect={columnsToSelect}
            handleSelectedColumnsUpdate={handleSelectedColumnsUpdate}
            entitiesCountCurrent={tableState.foundEntities}
            entitiesCountTotal={tableState.totalEntities}
            entitiesLoading={tableState.isInitialLoad}
        />
    );
}
