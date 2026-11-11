import React from 'react';

import {DataIssuesIndicator} from '../../../components/DataIssuesAlert/DataIssuesIndicator';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {useViewerNodesHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
import {getNodesDataIssues} from '../../../utils/dataIssues/classify';
import {useTableDataQuality} from '../../../utils/dataIssues/useTableDataQuality';
import {useHideUnavailableNodes} from '../../../utils/hooks/useHideUnavailableNodes';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {PaginatedStorageNodesTable} from '../PaginatedStorageNodesTable/PaginatedStorageNodesTable';
import {useIsStorageExpertMode, useStorageQueryParams} from '../useStorageQueryParams';
import {getStorageNodesDataIssuesContext, useStorageColumnsSettings} from '../utils';

import {StorageNodesControlsWithTableState} from './StorageNodesControls';
import {useStorageNodesColumnsToSelect} from './useStorageNodesColumnsToSelect';

export function StorageNodesComponent({
    database,
    nodeId,
    groupId,
    viewContext,
    scrollContainerRef,
    initialEntitiesCount,
}: PaginatedStorageProps) {
    const {nodesSearchValue, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();

    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();
    const {hideUnavailable} = useHideUnavailableNodes();

    const expertMode = useIsStorageExpertMode();
    const {handleDataFetched, columnsSettings, rowHeight} = useStorageColumnsSettings({
        expertMode,
    });

    const {dataQuality, handleChunkDataChange} = useTableDataQuality();
    const dataIssues = React.useMemo(
        () =>
            getNodesDataIssues(dataQuality, getStorageNodesDataIssuesContext({database, groupId})),
        [dataQuality, database, groupId],
    );

    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        viewContext,
        columnsSettings,
    });

    return (
        <PaginatedTableWithLayout
            controls={
                <StorageNodesControlsWithTableState
                    withTypeSelector
                    withGroupBySelect={viewerNodesHandlerHasGrouping}
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
                <PaginatedStorageNodesTable
                    database={database}
                    nodeId={nodeId}
                    groupId={groupId}
                    searchValue={nodesSearchValue}
                    visibleEntities={visibleEntities}
                    nodesUptimeFilter={nodesUptimeFilter}
                    onShowAll={handleShowAllNodes}
                    scrollContainerRef={scrollContainerRef}
                    renderErrorMessage={renderPaginatedTableErrorMessage}
                    columns={columnsToShow}
                    initialEntitiesCount={initialEntitiesCount}
                    rowHeight={rowHeight}
                    onDataFetched={handleDataFetched}
                    onChunkDataChange={handleChunkDataChange}
                    hasDataIssues={dataIssues.length > 0}
                />
            }
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [
                    nodesSearchValue,
                    visibleEntities,
                    nodesUptimeFilter,
                    hideUnavailable,
                ],
            }}
        />
    );
}
