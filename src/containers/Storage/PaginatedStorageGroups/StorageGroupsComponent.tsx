import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {useStorageGroupsHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
import {useDebouncedSearch} from '../../../utils/hooks/useDebouncedSearch';
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
    const {
        groupsSearchValue: rawGroupsSearchValue,
        visibleEntities,
        handleShowAllGroups,
    } = useStorageQueryParams();
    const requestParams = {database, nodeId, groupId, pDiskId};
    const groupsSearchValue = useDebouncedSearch(
        rawGroupsSearchValue,
        JSON.stringify([window.api.storage.getPath(''), requestParams]),
    );

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
                    columns={columnsToShow}
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
                    {...requestParams}
                    searchValue={groupsSearchValue}
                    visibleEntities={visibleEntities}
                    onShowAll={handleShowAllGroups}
                    scrollContainerRef={scrollContainerRef}
                    renderErrorMessage={renderPaginatedTableErrorMessage}
                    columns={columnsToShow}
                    initialEntitiesCount={initialEntitiesCount}
                />
            }
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [groupsSearchValue, visibleEntities],
            }}
        />
    );
}
