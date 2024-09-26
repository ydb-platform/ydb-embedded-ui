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
import {valueIsDefined} from '../../utils';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {useAdditionalNodeProps} from '../AppWithClusters/useClusterData';

import type {PaginatedStorageProps} from './PaginatedStorage';
import {StorageNodesControls} from './StorageControls/StorageControls';
import {PaginatedStorageNodesTable} from './StorageNodes/PaginatedStorageNodesTable';
import {useStorageNodesSelectedColumns} from './StorageNodes/columns/hooks';
import {TableGroup} from './TableGroup/TableGroup';
import i18n from './i18n';
import {renderPaginatedTableErrorMessage} from './shared';
import {useStorageQueryParams} from './useStorageQueryParams';

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

function StorageNodesComponent({database, groupId, parentContainer}: PaginatedStorageProps) {
    const {searchValue, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        groupId,
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
        groupId,
    });

    const {currentData, isFetching, error} = storageApi.useGetStorageNodesInfoQuery(
        {
            database,
            with: 'all',
            node_id: nodeId,
            // node_id and group_id params don't work together
            group_id: valueIsDefined(nodeId) ? undefined : groupId,
            group: storageNodesGroupByParam,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {tableGroups, found = 0, total = 0} = currentData || {};

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
        return tableGroups?.map(({name, count}) => {
            return (
                <TableGroup key={name} title={name} count={count} entityName={i18n('nodes')}>
                    <PaginatedStorageNodesTable
                        database={database}
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
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table loading={isLoading}>
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
