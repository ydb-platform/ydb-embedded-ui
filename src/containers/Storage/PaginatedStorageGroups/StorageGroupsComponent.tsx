import {DataIssuesIndicator} from '../../../components/DataIssuesAlert/DataIssuesIndicator';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {useStorageGroupsHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import {useTableDataIssues} from '../../../utils/dataIssues/useTableDataIssues';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {PaginatedStorageGroupsTable} from '../PaginatedStorageGroupsTable';
import {useStorageGroupsSelectedColumns} from '../PaginatedStorageGroupsTable/columns/hooks';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {StorageGroupsControlsWithTableState} from './StorageGroupsControls';

export function StorageGroupsComponent({
    database,
    nodeId,
    groupId,
    pDiskId,
    viewContext,
    scrollContainerRef,
    initialEntitiesCount,
    bridgeSyncGroupingAvailable = true,
}: PaginatedStorageProps & {bridgeSyncGroupingAvailable?: boolean}) {
    const {groupsSearchValue, visibleEntities, handleShowAllGroups} = useStorageQueryParams();

    const storageGroupsHandlerHasGrouping = useStorageGroupsHandlerHasGrouping();
    const {databaseData} = useTenantBaseInfo(database ?? '');

    const {columnsToShow, columnsToSelect, setColumns, bridgeModeEnabled} =
        useStorageGroupsSelectedColumns({
            database,
            databaseBridgeMode: databaseData?.BridgeMode,
            visibleEntities,
            viewContext,
        });

    const {issues, problems, rowsMayBeMissing, handleChunkDataChange} = useTableDataIssues({
        type: 'storageGroups',
    });

    return (
        <PaginatedTableWithLayout
            controls={
                <StorageGroupsControlsWithTableState
                    withTypeSelector
                    withGroupBySelect={storageGroupsHandlerHasGrouping}
                    bridgeModeEnabled={bridgeModeEnabled}
                    bridgeSyncGroupingAvailable={bridgeSyncGroupingAvailable}
                    columns={columnsToShow}
                    dataIssuesIndicator={
                        <DataIssuesIndicator compact issues={issues} problems={problems} />
                    }
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
                <PaginatedStorageGroupsTable
                    database={database}
                    nodeId={nodeId}
                    groupId={groupId}
                    pDiskId={pDiskId}
                    searchValue={groupsSearchValue}
                    visibleEntities={visibleEntities}
                    onShowAll={handleShowAllGroups}
                    scrollContainerRef={scrollContainerRef}
                    renderErrorMessage={renderPaginatedTableErrorMessage}
                    columns={columnsToShow}
                    initialEntitiesCount={initialEntitiesCount}
                    onChunkDataChange={handleChunkDataChange}
                    rowsMayBeMissing={rowsMayBeMissing}
                />
            }
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [groupsSearchValue, visibleEntities],
            }}
        />
    );
}
