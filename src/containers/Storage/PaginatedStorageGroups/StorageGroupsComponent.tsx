import React from 'react';

import {DataIssuesIndicator} from '../../../components/DataIssuesAlert/DataIssuesIndicator';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {useStorageGroupsHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
import {getStorageGroupsDataIssues} from '../../../utils/dataIssues/classify';
import {useTableDataQuality} from '../../../utils/dataIssues/useTableDataQuality';
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
    const {groupsSearchValue, visibleEntities, handleShowAllGroups} = useStorageQueryParams();

    const storageGroupsHandlerHasGrouping = useStorageGroupsHandlerHasGrouping();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageGroupsSelectedColumns({
        visibleEntities,
        viewContext,
    });

    const {dataQuality, handleChunkDataChange} = useTableDataQuality();
    const dataIssues = React.useMemo(() => getStorageGroupsDataIssues(dataQuality), [dataQuality]);

    return (
        <PaginatedTableWithLayout
            controls={
                <StorageGroupsControlsWithTableState
                    withTypeSelector
                    withGroupBySelect={storageGroupsHandlerHasGrouping}
                    columns={columnsToShow}
                    dataIssuesIndicator={
                        <DataIssuesIndicator
                            compact
                            issues={dataIssues}
                            problems={dataQuality?.problems}
                        />
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
                    hasDataIssues={dataIssues.length > 0}
                />
            }
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [groupsSearchValue, visibleEntities],
            }}
        />
    );
}
