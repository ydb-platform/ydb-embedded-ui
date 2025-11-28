import {usePaginatedTableState} from '../../../../components/PaginatedTable/PaginatedTableContext';

import {NodeNetworkControls} from './NodeNetworkControls';

interface NodeNetworkControlsWithTableStateProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export function NodeNetworkControlsWithTableState({
    searchValue,
    onSearchChange,
}: NodeNetworkControlsWithTableStateProps) {
    const {tableState} = usePaginatedTableState();
    const {foundEntities, totalEntities, isInitialLoad} = tableState;

    return (
        <NodeNetworkControls
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            entitiesCountCurrent={foundEntities}
            entitiesCountTotal={totalEntities}
            entitiesLoading={isInitialLoad}
        />
    );
}
