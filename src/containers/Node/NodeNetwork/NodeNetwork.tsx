import React from 'react';

import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {useBridgeModeEnabled} from '../../../store/reducers/capabilities/hooks';
import {useDatabaseFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {useSelectedColumns} from '../../../utils/hooks/useSelectedColumns';
import {useNodesPageQueryParams} from '../../Nodes/useNodesPageQueryParams';

import {NodeNetworkControlsWithTableState} from './NodeNetworkControls/NodeNetworkControlsWithTableState';
import {NodeNetworkTable} from './NodeNetworkTable';
import {getNodeNetworkColumns} from './columns';
import {
    NODE_NETWORK_COLUMNS_IDS,
    NODE_NETWORK_COLUMNS_TITLES,
    NODE_NETWORK_DEFAULT_COLUMNS,
    NODE_NETWORK_REQUIRED_COLUMNS,
    NODE_NETWORK_TABLE_SELECTED_COLUMNS_KEY,
} from './constants';

interface NodeNetworkProps {
    nodeId: string;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function NodeNetwork({nodeId, scrollContainerRef}: NodeNetworkProps) {
    const database = useDatabaseFromQuery();
    const isBridgeModeEnabled = useBridgeModeEnabled();

    const {searchValue, handleSearchQueryChange} = useNodesPageQueryParams(
        undefined, // We don't need use groupByParams yet
        false, // withPeerRoleFilter = false for this tab
    );

    const allColumns = React.useMemo(() => {
        const columns = getNodeNetworkColumns({database});

        if (!isBridgeModeEnabled) {
            return columns.filter((column) => column.name !== NODE_NETWORK_COLUMNS_IDS.PileName);
        }

        return columns;
    }, [database, isBridgeModeEnabled]);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        allColumns,
        NODE_NETWORK_TABLE_SELECTED_COLUMNS_KEY,
        NODE_NETWORK_COLUMNS_TITLES,
        NODE_NETWORK_DEFAULT_COLUMNS,
        NODE_NETWORK_REQUIRED_COLUMNS,
    );

    return (
        <PaginatedTableWithLayout
            controls={
                <NodeNetworkControlsWithTableState
                    searchValue={searchValue}
                    onSearchChange={handleSearchQueryChange}
                />
            }
            extraControls={
                <TableColumnSetup
                    popupWidth={200}
                    items={columnsToSelect}
                    showStatus
                    onUpdate={setColumns}
                />
            }
            table={
                <NodeNetworkTable
                    nodeId={nodeId}
                    searchValue={searchValue}
                    columns={columnsToShow}
                    scrollContainerRef={scrollContainerRef}
                />
            }
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [searchValue],
            }}
            fullHeight
        />
    );
}
