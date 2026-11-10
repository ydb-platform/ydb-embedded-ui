import React from 'react';

import {DataIssuesAlert} from '../../../components/DataIssuesAlert/DataIssuesAlert';
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

    const {dataQuality, handleDataFetched} = useTableDataQuality(
        JSON.stringify([database, nodeId, groupId, pDiskId, groupsSearchValue, visibleEntities]),
    );
    const dataIssues = React.useMemo(() => getStorageGroupsDataIssues(dataQuality), [dataQuality]);

    return (
        <PaginatedTableWithLayout
            notice={
                dataIssues.length > 0 ? (
                    <DataIssuesAlert issues={dataIssues} problems={dataQuality?.problems} />
                ) : null
            }
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
                    onDataFetched={handleDataFetched}
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
