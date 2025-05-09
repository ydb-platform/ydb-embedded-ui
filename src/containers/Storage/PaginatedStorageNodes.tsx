import React from 'react';

import {ResponseError} from '../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import type {RenderControls} from '../../components/PaginatedTable';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {storageApi} from '../../store/reducers/storage/storage';
import type {NodesGroupByField} from '../../types/api/nodes';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useAdditionalNodesProps} from '../../utils/hooks/useAdditionalNodesProps';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {renderPaginatedTableErrorMessage} from '../../utils/renderPaginatedTableErrorMessage';

import type {PaginatedStorageProps} from './PaginatedStorage';
import {StorageNodesControls} from './StorageControls/StorageControls';
import {PaginatedStorageNodesTable} from './StorageNodes/PaginatedStorageNodesTable';
import {useStorageNodesSelectedColumns} from './StorageNodes/columns/hooks';
import type {StorageNodesColumnsSettings} from './StorageNodes/columns/types';
import {TableGroup} from './TableGroup/TableGroup';
import {useExpandedGroups} from './TableGroup/useExpandedTableGroups';
import i18n from './i18n';
import {b} from './shared';
import type {StorageViewContext} from './types';
import {useStorageQueryParams} from './useStorageQueryParams';
import {useStorageColumnsSettings} from './utils';

import './Storage.scss';

export const PaginatedStorageNodes = (props: PaginatedStorageProps) => {
    const {storageNodesGroupByParam, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (
            viewerNodesHandlerHasGrouping &&
            (visibleEntities !== 'all' || nodesUptimeFilter !== NodesUptimeFilterValues.All)
        ) {
            handleShowAllNodes();
        }
    }, [handleShowAllNodes, nodesUptimeFilter, viewerNodesHandlerHasGrouping, visibleEntities]);

    const renderContent = () => {
        if (viewerNodesHandlerHasGrouping && storageNodesGroupByParam) {
            return <GroupedStorageNodesComponent {...props} />;
        }

        return <StorageNodesComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
};

function StorageNodesComponent({
    database,
    nodeId,
    groupId,
    viewContext,
    parentRef,
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

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <StorageNodesControls
                withTypeSelector
                withGroupBySelect={viewerNodesHandlerHasGrouping}
                entitiesCountCurrent={foundEntities}
                entitiesCountTotal={totalEntities}
                entitiesLoading={!inited}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
            />
        );
    };

    return (
        <PaginatedStorageNodesTable
            database={database}
            nodeId={nodeId}
            groupId={groupId}
            searchValue={searchValue}
            visibleEntities={visibleEntities}
            nodesUptimeFilter={nodesUptimeFilter}
            onShowAll={handleShowAllNodes}
            parentRef={parentRef}
            renderControls={renderControls}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            columns={columnsToShow}
            initialEntitiesCount={initialEntitiesCount}
            onDataFetched={handleDataFetched}
        />
    );
}

function GroupedStorageNodesComponent({
    database,
    groupId,
    nodeId,
    viewContext,
    parentRef,
}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {searchValue, storageNodesGroupByParam, handleShowAllNodes} = useStorageQueryParams();

    const {columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        viewContext,
    });

    const {currentData, isFetching, error} = storageApi.useGetStorageNodesInfoQuery(
        {
            database,
            with: 'all',
            filter: searchValue,
            node_id: nodeId,
            group_id: groupId,
            group: storageNodesGroupByParam,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {tableGroups, found = 0, total = 0} = currentData || {};

    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(tableGroups);

    const renderControls = () => {
        return (
            <StorageNodesControls
                withTypeSelector
                withGroupBySelect
                entitiesCountCurrent={found}
                entitiesCountTotal={total}
                entitiesLoading={isLoading}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
            />
        );
    };

    const renderGroups = () => {
        if (tableGroups?.length) {
            return tableGroups.map(({name, count}) => {
                const isExpanded = expandedGroups[name];

                return (
                    <TableGroup
                        key={name}
                        title={name}
                        count={count}
                        entityName={i18n('nodes')}
                        expanded={isExpanded}
                        onIsExpandedChange={setIsGroupExpanded}
                    >
                        <StorageNodesTableGroupContent
                            database={database}
                            parentRef={parentRef}
                            nodeId={nodeId}
                            groupId={groupId}
                            searchValue={searchValue}
                            handleShowAllNodes={handleShowAllNodes}
                            filterGroup={name}
                            filterGroupBy={storageNodesGroupByParam}
                            initialEntitiesCount={count}
                        />
                    </TableGroup>
                );
            });
        }

        return i18n('no-nodes');
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table loading={isLoading} className={b('groups-wrapper')}>
                {renderGroups()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}

interface StorageNodesTableGroupContentProps {
    database?: string;
    parentRef: React.RefObject<HTMLElement>;
    nodeId?: string | number;
    groupId?: string | number;
    searchValue: string;
    handleShowAllNodes: VoidFunction;
    filterGroup: string;
    filterGroupBy?: NodesGroupByField;
    viewContext?: StorageViewContext;
    initialEntitiesCount: number;
}

function StorageNodesTableGroupContent({
    database,
    parentRef,
    nodeId,
    groupId,
    searchValue,
    handleShowAllNodes,
    filterGroup,
    filterGroupBy,
    viewContext,
    initialEntitiesCount,
}: StorageNodesTableGroupContentProps) {
    const {handleDataFetched, columnsSettings} = useStorageColumnsSettings();
    const {columnsToShow} = useStorageNodesColumnsToSelect({
        database,
        viewContext,
        columnsSettings,
    });

    return (
        <PaginatedStorageNodesTable
            database={database}
            parentRef={parentRef}
            nodeId={nodeId}
            groupId={groupId}
            searchValue={searchValue}
            visibleEntities={'all'}
            nodesUptimeFilter={NodesUptimeFilterValues.All}
            onShowAll={handleShowAllNodes}
            filterGroup={filterGroup}
            filterGroupBy={filterGroupBy}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            columns={columnsToShow}
            initialEntitiesCount={initialEntitiesCount}
            onDataFetched={handleDataFetched}
        />
    );
}

function useStorageNodesColumnsToSelect({
    database,
    viewContext,
    columnsSettings,
}: {
    database?: string;
    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
}) {
    const additionalNodesProps = useAdditionalNodesProps();
    const {visibleEntities} = useStorageQueryParams();

    return useStorageNodesSelectedColumns({
        additionalNodesProps,
        visibleEntities,
        database,
        viewContext,
        columnsSettings,
    });
}
