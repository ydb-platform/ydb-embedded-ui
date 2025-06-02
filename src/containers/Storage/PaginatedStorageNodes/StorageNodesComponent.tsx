import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {useViewerNodesHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {PaginatedStorageNodesTable} from '../PaginatedStorageNodesTable/PaginatedStorageNodesTable';
import {useStorageQueryParams} from '../useStorageQueryParams';
import {useStorageColumnsSettings} from '../utils';

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
    const {searchValue, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();

    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    const {handleDataFetched, columnsSettings} = useStorageColumnsSettings();

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
                    columnsToSelect={columnsToSelect}
                    handleSelectedColumnsUpdate={setColumns}
                />
            }
            table={
                <PaginatedStorageNodesTable
                    database={database}
                    nodeId={nodeId}
                    groupId={groupId}
                    searchValue={searchValue}
                    visibleEntities={visibleEntities}
                    nodesUptimeFilter={nodesUptimeFilter}
                    onShowAll={handleShowAllNodes}
                    scrollContainerRef={scrollContainerRef}
                    renderErrorMessage={renderPaginatedTableErrorMessage}
                    columns={columnsToShow}
                    initialEntitiesCount={initialEntitiesCount}
                    onDataFetched={handleDataFetched}
                />
            }
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [searchValue, visibleEntities, nodesUptimeFilter],
            }}
        />
    );
}
