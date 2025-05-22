import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {useStorageGroupsHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
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
}: PaginatedStorageProps) {
    const {searchValue, visibleEntities, handleShowAllGroups} = useStorageQueryParams();

    const storageGroupsHandlerHasGrouping = useStorageGroupsHandlerHasGrouping();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageGroupsSelectedColumns({
        visibleEntities,
        viewContext,
    });

    return (
        <PaginatedTableWithLayout
            controls={
                <StorageGroupsControlsWithTableState
                    withTypeSelector
                    withGroupBySelect={storageGroupsHandlerHasGrouping}
                    columnsToSelect={columnsToSelect}
                    handleSelectedColumnsUpdate={setColumns}
                />
            }
            table={
                <PaginatedStorageGroupsTable
                    database={database}
                    nodeId={nodeId}
                    groupId={groupId}
                    pDiskId={pDiskId}
                    searchValue={searchValue}
                    visibleEntities={visibleEntities}
                    onShowAll={handleShowAllGroups}
                    scrollContainerRef={scrollContainerRef}
                    renderErrorMessage={renderPaginatedTableErrorMessage}
                    columns={columnsToShow}
                    initialEntitiesCount={initialEntitiesCount}
                />
            }
            tableProps={{
                scrollContainerRef,
                scrollDependencies: [searchValue, visibleEntities],
            }}
            fullHeight
        />
    );
}
