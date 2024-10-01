import React from 'react';

import {ResponseError} from '../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import type {RenderControls} from '../../components/PaginatedTable';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {storageApi} from '../../store/reducers/storage/storage';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {useAdditionalNodeProps} from '../AppWithClusters/useClusterData';

import type {PaginatedStorageProps} from './PaginatedStorage';
import {StorageNodesControls} from './StorageControls/StorageControls';
import {PaginatedStorageNodesTable} from './StorageNodes/PaginatedStorageNodesTable';
import {useStorageNodesSelectedColumns} from './StorageNodes/columns/hooks';
import {TableGroup} from './TableGroup/TableGroup';
import {useExpandedGroups} from './TableGroup/useExpandedTableGroups';
import i18n from './i18n';
import {b, renderPaginatedTableErrorMessage} from './shared';
import {useStorageQueryParams} from './useStorageQueryParams';

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
            visibleEntities !== 'all' &&
            nodesUptimeFilter !== NodesUptimeFilterValues.All
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
    parentContainer,
}: PaginatedStorageProps) {
    const {searchValue, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        groupId: groupId?.toString(),
    });

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <StorageNodesControls
                withTypeSelector
                withGroupBySelect
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
            parentContainer={parentContainer}
            renderControls={renderControls}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            columns={columnsToShow}
        />
    );
}

function GroupedStorageNodesComponent({database, groupId, nodeId}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {searchValue, storageNodesGroupByParam, handleShowAllNodes} = useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        groupId: groupId?.toString(),
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
                        <PaginatedStorageNodesTable
                            database={database}
                            nodeId={nodeId}
                            groupId={groupId}
                            searchValue={searchValue}
                            visibleEntities={'all'}
                            nodesUptimeFilter={NodesUptimeFilterValues.All}
                            onShowAll={handleShowAllNodes}
                            filterGroup={name}
                            filterGroupBy={storageNodesGroupByParam}
                            renderErrorMessage={renderPaginatedTableErrorMessage}
                            columns={columnsToShow}
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

function useStorageNodesColumnsToSelect({
    database,
    groupId,
}: {
    database?: string;
    groupId?: string;
}) {
    const {balancer} = useClusterBaseInfo();
    const {additionalNodesProps} = useAdditionalNodeProps({balancer});
    const {visibleEntities} = useStorageQueryParams();

    return useStorageNodesSelectedColumns({
        additionalNodesProps,
        visibleEntities,
        database,
        groupId,
    });
}
