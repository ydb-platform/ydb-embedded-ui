import React from 'react';

import {DataIssuesAlert} from '../../../components/DataIssuesAlert/DataIssuesAlert';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {useViewerNodesHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
import {getNodesDataIssues} from '../../../utils/dataIssues/classify';
import {useTableDataQuality} from '../../../utils/dataIssues/useTableDataQuality';
import {useHideUnavailableNodes} from '../../../utils/hooks/useHideUnavailableNodes';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {PaginatedStorageNodesTable} from '../PaginatedStorageNodesTable/PaginatedStorageNodesTable';
import type {StorageNodesPaginatedTableData} from '../types';
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
    const {
        handleDataFetched: handleColumnsDataFetched,
        columnsSettings,
        rowHeight,
    } = useStorageColumnsSettings({
        expertMode,
    });

    const {dataQuality, handleDataFetched: handleQualityDataFetched} = useTableDataQuality(
        JSON.stringify([
            database,
            nodeId,
            groupId,
            nodesSearchValue,
            visibleEntities,
            nodesUptimeFilter,
            hideUnavailable,
        ]),
    );
    const dataIssues = React.useMemo(
        () =>
            getNodesDataIssues(dataQuality, getStorageNodesDataIssuesContext({database, groupId})),
        [dataQuality, database, groupId],
    );

    const handleDataFetched = React.useCallback(
        (data: StorageNodesPaginatedTableData) => {
            handleColumnsDataFetched(data);
            handleQualityDataFetched(data);
        },
        [handleColumnsDataFetched, handleQualityDataFetched],
    );

    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        viewContext,
        columnsSettings,
    });

    return (
        <PaginatedTableWithLayout
            notice={
                dataIssues.length > 0 ? (
                    <DataIssuesAlert issues={dataIssues} problems={dataQuality?.problems} />
                ) : null
            }
            controls={
                <StorageNodesControlsWithTableState
                    withTypeSelector
                    withGroupBySelect={viewerNodesHandlerHasGrouping}
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
